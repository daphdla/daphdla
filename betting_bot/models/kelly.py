"""
Kelly Criterion bet sizing.

Full Kelly:   f* = (bp - q) / b   where b = decimal_odds - 1,  p = win_prob,  q = 1 - p
Fractional Kelly multiplies by KELLY_FRACTION (default 0.25) for safety.

Reference: https://en.wikipedia.org/wiki/Kelly_criterion
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from config import BANKROLL, KELLY_FRACTION, MAX_BET_FRACTION, MIN_BET_USD


@dataclass
class KellyResult:
    win_prob: float
    decimal_odds: float
    full_kelly_fraction: float
    fractional_kelly_fraction: float
    recommended_bet_usd: float
    bankroll: float
    expected_value: float         # EV per unit staked (e.g. 0.05 = 5% edge)
    is_positive_ev: bool


def kelly_bet(
    win_prob: float,
    decimal_odds: float,
    bankroll: float = BANKROLL,
    kelly_fraction: float = KELLY_FRACTION,
    max_fraction: float = MAX_BET_FRACTION,
    min_bet: float = MIN_BET_USD,
) -> Optional[KellyResult]:
    """
    Compute Kelly-optimal bet size.

    Args:
        win_prob:      Estimated true win probability (0 < p < 1).
        decimal_odds:  Decimal odds offered (e.g. 2.10).
        bankroll:      Current bankroll in USD.
        kelly_fraction: Fraction of full Kelly to use (0.25 = quarter Kelly).
        max_fraction:  Hard cap on bet as fraction of bankroll.
        min_bet:       Minimum bet in USD.

    Returns:
        KellyResult or None if the bet has no edge.
    """
    if not (0 < win_prob < 1):
        return None
    if decimal_odds <= 1.0:
        return None

    b = decimal_odds - 1.0          # net profit per unit staked if win
    q = 1.0 - win_prob

    # Full Kelly fraction of bankroll
    full_kelly = (b * win_prob - q) / b

    # Expected value per unit staked
    ev = b * win_prob - q

    if full_kelly <= 0:
        return KellyResult(
            win_prob=win_prob,
            decimal_odds=decimal_odds,
            full_kelly_fraction=full_kelly,
            fractional_kelly_fraction=0.0,
            recommended_bet_usd=0.0,
            bankroll=bankroll,
            expected_value=ev,
            is_positive_ev=False,
        )

    # Apply fractional Kelly and hard cap
    frac = min(full_kelly * kelly_fraction, max_fraction)
    recommended_usd = max(frac * bankroll, min_bet)

    return KellyResult(
        win_prob=win_prob,
        decimal_odds=decimal_odds,
        full_kelly_fraction=round(full_kelly, 6),
        fractional_kelly_fraction=round(frac, 6),
        recommended_bet_usd=round(recommended_usd, 2),
        bankroll=bankroll,
        expected_value=round(ev, 6),
        is_positive_ev=True,
    )


def kelly_portfolio(bets: list[dict], bankroll: float = BANKROLL) -> list[KellyResult]:
    """
    Apply Kelly to a list of bets, adjusting for correlation by
    scaling each bet proportionally so total exposure ≤ MAX_BET_FRACTION * n_bets.

    Each dict should have: {"win_prob": float, "decimal_odds": float}.
    """
    results = []
    for b in bets:
        r = kelly_bet(
            win_prob=b["win_prob"],
            decimal_odds=b["decimal_odds"],
            bankroll=bankroll,
        )
        if r and r.is_positive_ev:
            results.append(r)

    # Scale down if total exposure > 30% of bankroll
    total_fraction = sum(r.fractional_kelly_fraction for r in results)
    if total_fraction > 0.30:
        scale = 0.30 / total_fraction
        for r in results:
            r.fractional_kelly_fraction = round(r.fractional_kelly_fraction * scale, 6)
            r.recommended_bet_usd = round(r.fractional_kelly_fraction * bankroll, 2)

    return results


def format_kelly_summary(result: KellyResult) -> str:
    """Human-readable summary of a Kelly result."""
    if not result.is_positive_ev:
        return (
            f"NO EDGE | odds={result.decimal_odds:.2f} | "
            f"your_prob={result.win_prob:.1%} | EV={result.expected_value:.2%}"
        )
    return (
        f"BET ${result.recommended_bet_usd:.2f} "
        f"({result.fractional_kelly_fraction:.2%} of ${result.bankroll:,.0f}) | "
        f"odds={result.decimal_odds:.2f} | "
        f"win_prob={result.win_prob:.1%} | "
        f"EV={result.expected_value:.2%} | "
        f"full_kelly={result.full_kelly_fraction:.2%}"
    )
