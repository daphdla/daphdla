"""
Scoring engine: compute a 1-100 composite score for each stock.

Weights (total = 100 pts):
  FCF Yield      25 pts   – higher is better
  ROE            20 pts   – higher is better
  P/E ratio      20 pts   – lower is better
  Debt/EBITDA    20 pts   – lower is better (max 3x for full score)
  EV/EBITDA      15 pts   – lower is better (proxy for value)
"""
import pandas as pd
import numpy as np


# ── Helpers ──────────────────────────────────────────────────────────────────

def _clip_score(val: float, lo: float, hi: float, inverse: bool = False) -> float:
    """Linear scale val in [lo, hi] → [0, 1]. If inverse, lower is better."""
    if val is None or np.isnan(val):
        return 0.0
    if inverse:
        val = -val
        lo, hi = -hi, -lo
    normalized = (val - lo) / (hi - lo)
    return float(np.clip(normalized, 0.0, 1.0))


# ── Per-metric scorers ────────────────────────────────────────────────────────

def score_fcf_yield(fcf_yield):
    """0–25 pts: FCF yield 0% → 0 pts, ≥15% → 25 pts"""
    return round(_clip_score(fcf_yield, 0, 15) * 25, 1)


def score_roe(roe):
    """0–20 pts: ROE 0% → 0, ≥30% → 20"""
    return round(_clip_score(roe, 0, 30) * 20, 1)


def score_pe(pe):
    """0–20 pts: P/E ≤10 → 20, P/E ≥40 → 0. Negative P/E = 0."""
    if pe is None or np.isnan(pe) or pe <= 0:
        return 0.0
    return round(_clip_score(pe, 10, 40, inverse=True) * 20, 1)


def score_debt_ebitda(debt_ebitda):
    """0–20 pts: 0x → 20, ≥4x → 0. None (e.g. no debt) → 18 pts."""
    if debt_ebitda is None or np.isnan(debt_ebitda):
        return 18.0  # assume low / no debt
    return round(_clip_score(debt_ebitda, 0, 4, inverse=True) * 20, 1)


def score_ev_ebitda(ev_ebitda):
    """0–15 pts: ≤8 → 15, ≥30 → 0"""
    if ev_ebitda is None or np.isnan(ev_ebitda) or ev_ebitda <= 0:
        return 0.0
    return round(_clip_score(ev_ebitda, 8, 30, inverse=True) * 15, 1)


# ── Main entry point ─────────────────────────────────────────────────────────

def compute_scores(df: pd.DataFrame) -> pd.DataFrame:
    """Add score columns and a total Score (1–100) to the dataframe."""
    if df.empty:
        return df

    df = df.copy()

    df["score_fcf"]   = df["fcf_yield"].apply(score_fcf_yield)
    df["score_roe"]   = df["roe"].apply(score_roe)
    df["score_pe"]    = df["pe"].apply(score_pe)
    df["score_debt"]  = df["debt_ebitda"].apply(score_debt_ebitda)
    df["score_ev"]    = df["ev_ebitda"].apply(score_ev_ebitda)

    df["score"] = (
        df["score_fcf"]
        + df["score_roe"]
        + df["score_pe"]
        + df["score_debt"]
        + df["score_ev"]
    ).clip(1, 100).round(1)

    return df
