"""
Value Score engine.

Formula : Score = ROE / P/E × (1 − Dette/EBITDA)

Buy signal : Score > 1.5  AND  P/E < 15

Interpretation
--------------
- High ROE → company is profitable relative to equity
- Low P/E  → market is not over-paying
- Low Dette/EBITDA → balance sheet not over-leveraged
- Score > 1.5 + P/E < 15 → classic deep-value + quality combo
"""

from __future__ import annotations
import math


BUY_SCORE_THRESHOLD = 1.5
BUY_PE_MAX = 15.0

# Cap Dette/EBITDA at 5× so the factor never goes strongly negative
_DEBT_CAP = 5.0


def compute_score(pe: float | None, roe: float | None, dette_ebitda: float | None) -> float | None:
    """
    Return Value Score, or None if essential data is missing.

    pe            : Price/Earnings ratio (positive number)
    roe           : Return on Equity in % (e.g. 18.5 for 18.5 %)
    dette_ebitda  : Net Debt / EBITDA ratio (can be negative = net cash)
    """
    if pe is None or roe is None or pe <= 0:
        return None

    # Clamp leverage factor to avoid extreme negatives
    leverage = dette_ebitda if dette_ebitda is not None else 0.0
    leverage = min(leverage, _DEBT_CAP)
    leverage_factor = 1.0 - leverage

    score = (roe / pe) * leverage_factor

    # Protect against NaN / Inf
    if not math.isfinite(score):
        return None

    return round(score, 3)


def recommend(score: float | None, pe: float | None) -> str:
    """Return a human-readable recommendation string."""
    if score is None or pe is None:
        return "Données insuffisantes"

    if score > BUY_SCORE_THRESHOLD and pe < BUY_PE_MAX:
        return "ACHETER"
    if score > 1.0 and pe < 20:
        return "Surveiller"
    if score < 0:
        return "Eviter"
    return "Neutre"
