"""
Mispricing detection engine.

Combines:
  1. Sportsbook odds  (The Odds API)
  2. Prediction market probabilities  (Polymarket, misprice.app)
  3. XGBoost model prediction (optional, falls back to market prob)

Flags bets where the edge > MISPRICING_THRESHOLD (default 4%).
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

import pandas as pd

from config import MISPRICING_THRESHOLD, MIN_LIQUIDITY_USD, KELLY_FRACTION, BANKROLL
from models.kelly import kelly_bet, KellyResult, format_kelly_summary
from scraper.odds_api import OddsEvent, decimal_to_implied_prob

logger = logging.getLogger(__name__)


@dataclass
class MispricingAlert:
    # Identification
    event_id: str
    event_name: str
    sport: str
    side: str               # "home" or "away"
    commence_time: str

    # Odds & probabilities
    book_decimal_odds: float
    book_implied_prob: float
    true_prob: float        # from model or prediction market
    edge: float             # true_prob - book_implied_prob (positive = +EV)

    # Kelly sizing
    kelly: Optional[KellyResult]

    # Source info
    best_book: str = ""
    source_book: str = ""
    prediction_market_prob: Optional[float] = None
    model_prob: Optional[float] = None
    num_books: int = 0

    # Timestamp
    detected_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @property
    def summary(self) -> str:
        kelly_str = format_kelly_summary(self.kelly) if self.kelly else "N/A"
        return (
            f"🔔 MISPRICING DETECTED\n"
            f"  Event:  {self.event_name} ({self.sport})\n"
            f"  Side:   {self.side.upper()}\n"
            f"  Odds:   {self.book_decimal_odds:.3f} (implied {self.book_implied_prob:.1%})\n"
            f"  True P: {self.true_prob:.1%}  |  Edge: {self.edge:+.2%}\n"
            f"  {kelly_str}\n"
            f"  Starts: {self.commence_time}"
        )

    def to_dict(self) -> dict:
        return {
            "event_id": self.event_id,
            "event_name": self.event_name,
            "sport": self.sport,
            "side": self.side,
            "commence_time": self.commence_time,
            "book_decimal_odds": self.book_decimal_odds,
            "book_implied_prob": self.book_implied_prob,
            "true_prob": self.true_prob,
            "edge": self.edge,
            "kelly_fraction": self.kelly.fractional_kelly_fraction if self.kelly else 0.0,
            "recommended_bet_usd": self.kelly.recommended_bet_usd if self.kelly else 0.0,
            "expected_value": self.kelly.expected_value if self.kelly else 0.0,
            "best_book": self.best_book,
            "prediction_market_prob": self.prediction_market_prob,
            "model_prob": self.model_prob,
            "num_books": self.num_books,
            "detected_at": self.detected_at,
        }


class MispricingDetector:
    """
    Detects mispricings between sportsbook odds and true probabilities.

    Hierarchy of probability sources (best available):
      1. XGBoost model prediction  (most accurate when trained)
      2. Polymarket probability    (liquid prediction markets)
      3. Cross-book average        (simple no-vig average across bookmakers)
    """

    def __init__(
        self,
        threshold: float = MISPRICING_THRESHOLD,
        min_liquidity: float = MIN_LIQUIDITY_USD,
        model=None,                 # XGBBetModel instance or None
    ):
        self.threshold = threshold
        self.min_liquidity = min_liquidity
        self.model = model

    # ── Main detection ────────────────────────────────────────────────────────

    def detect_from_odds_events(
        self,
        events: list[OddsEvent],
        poly_markets: list = None,   # list[PolymarketMarket]
    ) -> list[MispricingAlert]:
        """
        For each OddsEvent, find the best odds available and compare against
        the estimated true probability to flag mispricings.
        """
        poly_index = self._index_polymarket(poly_markets or [])
        alerts: list[MispricingAlert] = []

        for ev in events:
            for side in ("home", "away"):
                alert = self._check_side(ev, side, poly_index)
                if alert and alert.edge >= self.threshold:
                    alerts.append(alert)

        alerts.sort(key=lambda a: a.edge, reverse=True)
        logger.info(
            "Detected %d mispricings (threshold=%.1f%%)",
            len(alerts), self.threshold * 100,
        )
        return alerts

    def detect_from_dataframe(self, df: pd.DataFrame) -> list[MispricingAlert]:
        """
        Detect mispricings from a DataFrame with columns:
        event_id, event_name, sport, side, commence_time,
        book_decimal_odds, polymarket_prob, [model features...]
        """
        alerts = []
        for _, row in df.iterrows():
            book_odds = float(row.get("book_decimal_odds", 0))
            if book_odds <= 1.0:
                continue

            book_impl = decimal_to_implied_prob(book_odds)
            poly_prob = row.get("polymarket_prob")
            poly_prob = float(poly_prob) if poly_prob and poly_prob > 0 else None

            # Determine true probability
            true_prob = self._estimate_true_prob(row, poly_prob, book_impl)
            edge = true_prob - book_impl

            if edge < self.threshold:
                continue

            k = kelly_bet(true_prob, book_odds, bankroll=BANKROLL)
            alerts.append(MispricingAlert(
                event_id=str(row.get("event_id", "")),
                event_name=str(row.get("event_name", "")),
                sport=str(row.get("sport", "")),
                side=str(row.get("side", "")),
                commence_time=str(row.get("commence_time", "")),
                book_decimal_odds=book_odds,
                book_implied_prob=book_impl,
                true_prob=true_prob,
                edge=edge,
                kelly=k,
                prediction_market_prob=poly_prob,
            ))

        alerts.sort(key=lambda a: a.edge, reverse=True)
        return alerts

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _check_side(
        self, ev: OddsEvent, side: str, poly_index: dict
    ) -> Optional[MispricingAlert]:
        best_odds = ev.best_home_odds if side == "home" else ev.best_away_odds
        if best_odds <= 1.0:
            return None

        book_impl = decimal_to_implied_prob(best_odds)

        # No-vig average across all books as baseline
        worst_odds = ev.worst_home_odds if side == "home" else ev.worst_away_odds
        avg_odds = (best_odds + worst_odds) / 2 if worst_odds > 1.0 else best_odds
        novig_avg_impl = decimal_to_implied_prob(avg_odds)

        # Polymarket prob (fuzzy match on team name)
        team = ev.home_team if side == "home" else ev.away_team
        poly_prob = self._lookup_polymarket(team, ev.sport, poly_index)

        # Build feature dict for XGBoost
        features = {
            "implied_prob_book": book_impl,
            "implied_prob_market": poly_prob or novig_avg_impl,
            "spread": abs(best_odds - worst_odds),
            "volume_usd": 0.0,
            "time_to_event_hours": _hours_until(ev.commence_time),
            "num_books_offering": ev.num_books,
            "best_book_odds": best_odds,
            "worst_book_odds": worst_odds,
            "polymarket_prob": poly_prob or 0.0,
        }
        true_prob = self._estimate_true_prob(features, poly_prob, novig_avg_impl)
        edge = true_prob - book_impl

        k = kelly_bet(true_prob, best_odds, bankroll=BANKROLL) if edge > 0 else None

        return MispricingAlert(
            event_id=ev.event_id,
            event_name=f"{ev.home_team} vs {ev.away_team}",
            sport=ev.sport,
            side=side,
            commence_time=ev.commence_time,
            book_decimal_odds=best_odds,
            book_implied_prob=book_impl,
            true_prob=true_prob,
            edge=edge,
            kelly=k,
            prediction_market_prob=poly_prob,
            model_prob=None,
            num_books=ev.num_books,
        )

    def _estimate_true_prob(
        self,
        features: dict,
        poly_prob: Optional[float],
        fallback: float,
    ) -> float:
        """Priority: model > polymarket > no-vig average."""
        if self.model is not None:
            try:
                return float(self.model.predict_proba(features))
            except Exception as exc:
                logger.debug("Model prediction failed: %s", exc)

        if poly_prob and 0 < poly_prob < 1:
            return poly_prob

        return fallback

    @staticmethod
    def _index_polymarket(markets: list) -> dict:
        """Build a keyword → probability index from Polymarket markets."""
        index: dict[str, float] = {}
        for m in markets:
            for word in m.question.lower().split():
                if len(word) > 3:
                    index[word] = m.yes_prob
        return index

    @staticmethod
    def _lookup_polymarket(team: str, sport: str, index: dict) -> Optional[float]:
        """Fuzzy lookup of a team name in the Polymarket index."""
        words = [w.lower() for w in team.split() if len(w) > 3]
        probs = [index[w] for w in words if w in index]
        return float(sum(probs) / len(probs)) if probs else None


def _hours_until(commence_time: str) -> float:
    """Return hours from now until the event starts."""
    try:
        dt = datetime.fromisoformat(commence_time.replace("Z", "+00:00"))
        delta = dt - datetime.now(timezone.utc)
        return max(delta.total_seconds() / 3600, 0)
    except Exception:
        return 0.0
