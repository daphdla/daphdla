"""
XGBoost model that predicts the TRUE win probability for a bet,
given features from the sportsbook and prediction markets.

Training:
    python -m models.xgboost_model --train --data data/historical/bets.csv

Inference:
    model = XGBBetModel.load()
    prob  = model.predict_proba(features_dict)
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import brier_score_loss, log_loss, roc_auc_score
from sklearn.model_selection import StratifiedKFold, cross_val_score
from xgboost import XGBClassifier

from config import FEATURE_COLS, MODEL_PATH, TARGET_COL

logger = logging.getLogger(__name__)


class XGBBetModel:
    """Wrapper around XGBClassifier with probability calibration."""

    DEFAULT_PARAMS = {
        "n_estimators": 400,
        "max_depth": 4,
        "learning_rate": 0.05,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "min_child_weight": 5,
        "gamma": 1.0,
        "reg_alpha": 0.1,
        "reg_lambda": 1.0,
        "use_label_encoder": False,
        "eval_metric": "logloss",
        "random_state": 42,
        "n_jobs": -1,
    }

    def __init__(self, params: Optional[dict] = None):
        xgb_params = {**self.DEFAULT_PARAMS, **(params or {})}
        base = XGBClassifier(**xgb_params)
        # Isotonic regression calibration for better probability estimates
        self.model = CalibratedClassifierCV(base, method="isotonic", cv=5)
        self.feature_cols = FEATURE_COLS
        self.is_fitted = False

    # ── Training ──────────────────────────────────────────────────────────────

    def train(self, df: pd.DataFrame) -> dict:
        """
        Train on a DataFrame with FEATURE_COLS + TARGET_COL.
        Returns a dict of evaluation metrics.
        """
        df = df.dropna(subset=self.feature_cols + [TARGET_COL])
        X = df[self.feature_cols].values
        y = df[TARGET_COL].astype(int).values

        logger.info("Training on %d samples (%d features)", len(X), len(self.feature_cols))

        # Cross-validated AUC for honest eval
        skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_aucs = cross_val_score(self.model, X, y, cv=skf, scoring="roc_auc")

        # Full fit on all data
        self.model.fit(X, y)
        self.is_fitted = True

        y_prob = self.model.predict_proba(X)[:, 1]
        metrics = {
            "cv_auc_mean": float(cv_aucs.mean()),
            "cv_auc_std": float(cv_aucs.std()),
            "train_auc": float(roc_auc_score(y, y_prob)),
            "brier_score": float(brier_score_loss(y, y_prob)),
            "log_loss": float(log_loss(y, y_prob)),
            "n_samples": len(X),
            "pos_rate": float(y.mean()),
        }
        logger.info("Train metrics: %s", metrics)
        return metrics

    # ── Inference ─────────────────────────────────────────────────────────────

    def predict_proba(self, features: dict | pd.DataFrame) -> float:
        """
        Return predicted win probability for a single bet.
        `features` can be a dict or a 1-row DataFrame.
        """
        if not self.is_fitted:
            raise RuntimeError("Model not trained. Call train() or load() first.")

        if isinstance(features, dict):
            row = pd.DataFrame([features])
        else:
            row = features.copy()

        # Fill missing features with 0
        for col in self.feature_cols:
            if col not in row.columns:
                row[col] = 0.0

        X = row[self.feature_cols].values
        prob = self.model.predict_proba(X)[0, 1]
        return float(prob)

    def predict_batch(self, df: pd.DataFrame) -> np.ndarray:
        """Return predicted probabilities for a DataFrame of bets."""
        if not self.is_fitted:
            raise RuntimeError("Model not trained.")
        for col in self.feature_cols:
            if col not in df.columns:
                df[col] = 0.0
        return self.model.predict_proba(df[self.feature_cols].values)[:, 1]

    # ── Persistence ───────────────────────────────────────────────────────────

    def save(self, path: Path = MODEL_PATH) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, path)
        logger.info("Model saved to %s", path)

    @classmethod
    def load(cls, path: Path = MODEL_PATH) -> "XGBBetModel":
        if not path.exists():
            raise FileNotFoundError(f"No model found at {path}. Train one first.")
        model = joblib.load(path)
        logger.info("Model loaded from %s", path)
        return model

    # ── Feature importance ────────────────────────────────────────────────────

    def feature_importance(self) -> pd.DataFrame:
        """Return feature importances from the underlying XGBClassifier."""
        if not self.is_fitted:
            raise RuntimeError("Model not trained.")
        # CalibratedClassifierCV wraps the estimator
        base_estimator = self.model.calibrated_classifiers_[0].estimator
        importances = base_estimator.feature_importances_
        return (
            pd.DataFrame({"feature": self.feature_cols, "importance": importances})
            .sort_values("importance", ascending=False)
            .reset_index(drop=True)
        )


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    logging.basicConfig(level=logging.INFO)

    parser = argparse.ArgumentParser(description="Train or evaluate XGBoost bet model")
    parser.add_argument("--train", action="store_true")
    parser.add_argument("--data", type=str, default="data/historical/bets.csv")
    parser.add_argument("--importance", action="store_true")
    args = parser.parse_args()

    if args.train:
        df = pd.read_csv(args.data)
        model = XGBBetModel()
        metrics = model.train(df)
        print("\n=== Training Metrics ===")
        for k, v in metrics.items():
            print(f"  {k}: {v:.4f}" if isinstance(v, float) else f"  {k}: {v}")
        model.save()

    if args.importance:
        model = XGBBetModel.load()
        print(model.feature_importance().to_string(index=False))
