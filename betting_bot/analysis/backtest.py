"""
Backtesting engine for the mispricing strategy.

Usage:
    python -m analysis.backtest --data data/historical/bets.csv --plot

Input CSV columns required:
    event_id, event_name, sport, side, commence_time,
    book_decimal_odds, true_prob (or polymarket_prob),
    outcome (1=won, 0=lost), kelly_fraction (optional)

The engine simulates a Kelly-staked portfolio over the historical period
and reports: ROI, Sharpe, max drawdown, hit rate, CLV (closing line value).
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

from config import (
    BACKTEST_START,
    BACKTEST_END,
    BANKROLL,
    COMMISSION_RATE,
    KELLY_FRACTION,
    MAX_BET_FRACTION,
    MIN_BET_USD,
    MISPRICING_THRESHOLD,
)
from models.kelly import kelly_bet

logger = logging.getLogger(__name__)


@dataclass
class BacktestResult:
    n_bets: int
    n_won: int
    hit_rate: float
    total_staked: float
    total_profit: float
    roi: float                  # profit / staked
    final_bankroll: float
    max_drawdown: float         # maximum peak-to-trough loss
    sharpe_ratio: float         # per-bet Sharpe
    avg_edge: float
    avg_kelly_fraction: float
    bankroll_history: list[float] = field(default_factory=list)
    bet_log: pd.DataFrame = field(default_factory=pd.DataFrame)

    def summary(self) -> str:
        return (
            f"\n{'='*50}\n"
            f" BACKTEST RESULTS\n"
            f"{'='*50}\n"
            f" Bets:           {self.n_bets}\n"
            f" Won:            {self.n_won} ({self.hit_rate:.1%})\n"
            f" Total staked:   ${self.total_staked:,.2f}\n"
            f" Total profit:   ${self.total_profit:+,.2f}\n"
            f" ROI:            {self.roi:+.2%}\n"
            f" Start bankroll: ${BANKROLL:,.2f}\n"
            f" Final bankroll: ${self.final_bankroll:,.2f}\n"
            f" Max drawdown:   {self.max_drawdown:.2%}\n"
            f" Sharpe ratio:   {self.sharpe_ratio:.3f}\n"
            f" Avg edge:       {self.avg_edge:.2%}\n"
            f" Avg Kelly frac: {self.avg_kelly_fraction:.2%}\n"
            f"{'='*50}"
        )


class Backtester:
    """
    Simulates Kelly-sized bets on historical data.

    For each row in the dataset that exceeds the edge threshold,
    the engine bets Kelly-fraction × current_bankroll, applies the
    outcome, and tracks the bankroll curve.
    """

    def __init__(
        self,
        threshold: float = MISPRICING_THRESHOLD,
        kelly_fraction: float = KELLY_FRACTION,
        max_fraction: float = MAX_BET_FRACTION,
        min_bet: float = MIN_BET_USD,
        commission: float = COMMISSION_RATE,
        start_date: str = BACKTEST_START,
        end_date: str = BACKTEST_END,
    ):
        self.threshold = threshold
        self.kelly_fraction = kelly_fraction
        self.max_fraction = max_fraction
        self.min_bet = min_bet
        self.commission = commission
        self.start_date = start_date
        self.end_date = end_date

    def run(self, df: pd.DataFrame, initial_bankroll: float = BANKROLL) -> BacktestResult:
        """
        Run the backtest.

        Required columns: book_decimal_odds, true_prob, outcome, commence_time.
        Optional: event_name, sport, side, kelly_fraction.
        """
        df = self._prepare(df)
        if df.empty:
            logger.warning("No bets after filtering — returning empty result")
            return self._empty_result(initial_bankroll)

        bankroll = initial_bankroll
        bankroll_history = [bankroll]
        bet_records = []
        peak = bankroll

        for _, row in df.iterrows():
            true_prob = float(row["true_prob"])
            decimal_odds = float(row["book_decimal_odds"])
            outcome = int(row["outcome"])

            k = kelly_bet(
                win_prob=true_prob,
                decimal_odds=decimal_odds,
                bankroll=bankroll,
                kelly_fraction=self.kelly_fraction,
                max_fraction=self.max_fraction,
                min_bet=self.min_bet,
            )
            if k is None or not k.is_positive_ev:
                continue
            if k.edge < self.threshold:          # type: ignore[attr-defined]
                continue

            stake = k.recommended_bet_usd
            stake = min(stake, bankroll)          # can't bet more than we have

            if outcome == 1:
                profit = stake * (decimal_odds - 1) * (1 - self.commission)
            else:
                profit = -stake

            bankroll += profit
            bankroll = max(bankroll, 0)
            peak = max(peak, bankroll)
            drawdown = (peak - bankroll) / peak if peak > 0 else 0

            bet_records.append({
                "commence_time": row.get("commence_time", ""),
                "event": row.get("event_name", ""),
                "sport": row.get("sport", ""),
                "side": row.get("side", ""),
                "decimal_odds": decimal_odds,
                "true_prob": true_prob,
                "edge": k.expected_value,
                "stake": stake,
                "kelly_fraction": k.fractional_kelly_fraction,
                "outcome": outcome,
                "profit": profit,
                "bankroll": bankroll,
                "drawdown": drawdown,
            })
            bankroll_history.append(bankroll)

        bet_df = pd.DataFrame(bet_records)
        return self._compute_stats(bet_df, initial_bankroll, bankroll_history)

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _prepare(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        # Accept either true_prob or polymarket_prob as the probability source
        if "true_prob" not in df.columns and "polymarket_prob" in df.columns:
            df["true_prob"] = df["polymarket_prob"]

        required = ["book_decimal_odds", "true_prob", "outcome"]
        missing = [c for c in required if c not in df.columns]
        if missing:
            raise ValueError(f"Missing columns: {missing}")

        df["true_prob"] = pd.to_numeric(df["true_prob"], errors="coerce")
        df["book_decimal_odds"] = pd.to_numeric(df["book_decimal_odds"], errors="coerce")
        df["outcome"] = pd.to_numeric(df["outcome"], errors="coerce")
        df = df.dropna(subset=required)

        # Date filter
        if "commence_time" in df.columns:
            df["commence_time"] = pd.to_datetime(df["commence_time"], errors="coerce", utc=True)
            mask = (
                df["commence_time"] >= pd.Timestamp(self.start_date, tz="UTC")
            ) & (
                df["commence_time"] <= pd.Timestamp(self.end_date, tz="UTC")
            )
            df = df[mask]

        df = df.sort_values("commence_time") if "commence_time" in df.columns else df
        return df.reset_index(drop=True)

    @staticmethod
    def _compute_stats(
        bet_df: pd.DataFrame,
        initial_bankroll: float,
        bankroll_history: list[float],
    ) -> BacktestResult:
        if bet_df.empty:
            return BacktestResult(
                n_bets=0, n_won=0, hit_rate=0, total_staked=0, total_profit=0,
                roi=0, final_bankroll=initial_bankroll, max_drawdown=0,
                sharpe_ratio=0, avg_edge=0, avg_kelly_fraction=0,
                bankroll_history=[initial_bankroll],
            )

        n_bets = len(bet_df)
        n_won = int(bet_df["outcome"].sum())
        total_staked = float(bet_df["stake"].sum())
        total_profit = float(bet_df["profit"].sum())
        roi = total_profit / total_staked if total_staked > 0 else 0
        final_bankroll = float(bankroll_history[-1])
        max_dd = float(bet_df["drawdown"].max())
        hit_rate = n_won / n_bets

        # Per-bet returns for Sharpe
        returns = bet_df["profit"] / bet_df["stake"]
        sharpe = (returns.mean() / returns.std()) * np.sqrt(252) if returns.std() > 0 else 0

        return BacktestResult(
            n_bets=n_bets,
            n_won=n_won,
            hit_rate=hit_rate,
            total_staked=total_staked,
            total_profit=total_profit,
            roi=roi,
            final_bankroll=final_bankroll,
            max_drawdown=max_dd,
            sharpe_ratio=float(sharpe),
            avg_edge=float(bet_df["edge"].mean()),
            avg_kelly_fraction=float(bet_df["kelly_fraction"].mean()),
            bankroll_history=bankroll_history,
            bet_log=bet_df,
        )

    @staticmethod
    def _empty_result(bankroll: float) -> BacktestResult:
        return BacktestResult(
            n_bets=0, n_won=0, hit_rate=0, total_staked=0, total_profit=0,
            roi=0, final_bankroll=bankroll, max_drawdown=0,
            sharpe_ratio=0, avg_edge=0, avg_kelly_fraction=0,
            bankroll_history=[bankroll],
        )

    def plot(self, result: BacktestResult, save_path: Optional[Path] = None) -> None:
        """Plot bankroll curve and drawdown chart."""
        try:
            import matplotlib.pyplot as plt
            import matplotlib.dates as mdates
        except ImportError:
            logger.warning("matplotlib not installed — skipping plot")
            return

        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8), sharex=False)

        # Bankroll curve
        ax1.plot(result.bankroll_history, color="#2563eb", linewidth=1.5)
        ax1.axhline(BANKROLL, color="gray", linestyle="--", alpha=0.5, label="Initial bankroll")
        ax1.set_title("Bankroll Curve (Kelly-sized bets)")
        ax1.set_ylabel("Bankroll ($)")
        ax1.legend()
        ax1.grid(True, alpha=0.3)

        # Drawdown
        if not result.bet_log.empty:
            ax2.fill_between(
                range(len(result.bet_log)),
                result.bet_log["drawdown"] * -100,
                0,
                color="#ef4444",
                alpha=0.6,
            )
            ax2.set_title("Drawdown (%)")
            ax2.set_ylabel("Drawdown (%)")
            ax2.set_xlabel("Bet number")
            ax2.grid(True, alpha=0.3)

        plt.tight_layout()
        if save_path:
            plt.savefig(save_path, dpi=150, bbox_inches="tight")
            logger.info("Plot saved to %s", save_path)
        else:
            plt.show()
        plt.close()


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

    parser = argparse.ArgumentParser(description="Run backtest on historical bet data")
    parser.add_argument("--data", default="data/historical/bets.csv", help="Path to CSV")
    parser.add_argument("--bankroll", type=float, default=BANKROLL)
    parser.add_argument("--threshold", type=float, default=MISPRICING_THRESHOLD)
    parser.add_argument("--kelly", type=float, default=KELLY_FRACTION)
    parser.add_argument("--plot", action="store_true")
    parser.add_argument("--save-plot", type=str, default="")
    args = parser.parse_args()

    df = pd.read_csv(args.data)
    bt = Backtester(threshold=args.threshold, kelly_fraction=args.kelly)
    result = bt.run(df, initial_bankroll=args.bankroll)

    print(result.summary())
    print("\nTop 10 bets by profit:")
    if not result.bet_log.empty:
        top = result.bet_log.nlargest(10, "profit")[
            ["event", "decimal_odds", "true_prob", "edge", "stake", "profit"]
        ]
        print(top.to_string(index=False))

    if args.plot:
        save = Path(args.save_plot) if args.save_plot else None
        bt.plot(result, save_path=save)
