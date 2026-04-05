"""
Fetches prediction market probabilities from Polymarket's public API.
No API key required.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

import requests

from config import POLYMARKET_GAMMA_BASE, POLYMARKET_API_BASE

logger = logging.getLogger(__name__)

HEADERS = {"Accept": "application/json", "User-Agent": "BettingBot/1.0"}


@dataclass
class PolymarketMarket:
    condition_id: str
    question: str
    description: str
    yes_prob: float          # current YES probability (0-1)
    no_prob: float
    volume_usd: float
    active: bool
    end_date: str
    slug: str


def get_active_markets(
    limit: int = 200,
    offset: int = 0,
    min_volume: float = 1000,
) -> list[PolymarketMarket]:
    """
    Pull active markets from Polymarket's Gamma (markets) API.
    Sorted by volume descending, filtered by min_volume.
    """
    try:
        resp = requests.get(
            f"{POLYMARKET_GAMMA_BASE}/markets",
            params={
                "active": "true",
                "closed": "false",
                "limit": limit,
                "offset": offset,
                "order": "volume",
                "ascending": "false",
            },
            headers=HEADERS,
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        logger.error("Polymarket Gamma API error: %s", exc)
        return []

    # Gamma returns either a list directly or {"data": [...]}
    items = data if isinstance(data, list) else data.get("data", data.get("markets", []))

    markets = []
    for item in items:
        mkt = _parse_market(item)
        if mkt and mkt.volume_usd >= min_volume:
            markets.append(mkt)

    logger.info("Polymarket: %d active markets (vol >= $%.0f)", len(markets), min_volume)
    return markets


def get_market_price(condition_id: str) -> Optional[float]:
    """
    Get real-time YES price for a single market via the CLOB API.
    Returns probability as float (0-1) or None.
    """
    try:
        resp = requests.get(
            f"{POLYMARKET_API_BASE}/midpoint",
            params={"token_id": condition_id},
            headers=HEADERS,
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        mid = float(data.get("mid", 0))
        return mid if 0 < mid < 1 else None
    except (requests.RequestException, ValueError):
        return None


def search_markets(query: str, limit: int = 10) -> list[PolymarketMarket]:
    """Search Polymarket markets by keyword."""
    try:
        resp = requests.get(
            f"{POLYMARKET_GAMMA_BASE}/markets",
            params={"search": query, "active": "true", "limit": limit},
            headers=HEADERS,
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        items = data if isinstance(data, list) else data.get("data", [])
        return [m for m in (_parse_market(i) for i in items) if m]
    except requests.RequestException as exc:
        logger.error("Polymarket search error: %s", exc)
        return []


def _parse_market(item: dict) -> Optional[PolymarketMarket]:
    try:
        # Volume can be in "volumeNum" or "volume" (string)
        vol_raw = item.get("volumeNum", item.get("volume", 0))
        volume = float(vol_raw or 0)

        # Probabilities: outcomePrices is ["yes_prob", "no_prob"] or similar
        outcome_prices = item.get("outcomePrices", [])
        if outcome_prices and len(outcome_prices) >= 2:
            yes_p = float(outcome_prices[0])
            no_p  = float(outcome_prices[1])
        else:
            yes_p = float(item.get("probability", item.get("prob", 0.5)))
            no_p  = 1.0 - yes_p

        return PolymarketMarket(
            condition_id=str(item.get("conditionId", item.get("condition_id", ""))),
            question=str(item.get("question", "")),
            description=str(item.get("description", "")),
            yes_prob=yes_p,
            no_prob=no_p,
            volume_usd=volume,
            active=bool(item.get("active", True)),
            end_date=str(item.get("endDate", item.get("end_date", ""))),
            slug=str(item.get("slug", "")),
        )
    except (TypeError, ValueError, KeyError):
        return None
