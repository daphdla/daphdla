"""
Fetches prediction market probabilities from Kalshi's public REST API.
No API key required for read-only market data.
Docs: https://trading-api.kalshi.com/trade-api/v2
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

import requests

logger = logging.getLogger(__name__)

KALSHI_BASE = "https://trading-api.kalshi.com/trade-api/v2"
HEADERS = {"Accept": "application/json", "User-Agent": "BettingBot/1.0"}


@dataclass
class KalshiMarket:
    ticker: str
    title: str
    yes_bid: float       # best bid for YES (implied prob lower bound)
    yes_ask: float       # best ask for YES (implied prob upper bound)
    yes_mid: float       # midpoint probability (0-1)
    volume_usd: float
    open_interest: float
    close_time: str
    status: str          # "open", "closed", "settled"
    category: str


def get_active_markets(
    limit: int = 200,
    min_volume: float = 500,
    status: str = "open",
) -> list[KalshiMarket]:
    """
    Pull active Kalshi markets, sorted by volume.
    """
    markets: list[KalshiMarket] = []
    cursor = None

    while True:
        params: dict = {"limit": min(limit, 200), "status": status}
        if cursor:
            params["cursor"] = cursor

        try:
            resp = requests.get(
                f"{KALSHI_BASE}/markets",
                params=params,
                headers=HEADERS,
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
        except requests.RequestException as exc:
            logger.error("Kalshi API error: %s", exc)
            break

        batch = data.get("markets", [])
        for item in batch:
            mkt = _parse_market(item)
            if mkt and mkt.volume_usd >= min_volume:
                markets.append(mkt)

        cursor = data.get("cursor")
        if not cursor or len(markets) >= limit:
            break

    logger.info("Kalshi: %d active markets (vol >= $%.0f)", len(markets), min_volume)
    return markets


def get_market(ticker: str) -> Optional[KalshiMarket]:
    """Fetch a single Kalshi market by ticker."""
    try:
        resp = requests.get(
            f"{KALSHI_BASE}/markets/{ticker}",
            headers=HEADERS,
            timeout=10,
        )
        resp.raise_for_status()
        return _parse_market(resp.json().get("market", resp.json()))
    except requests.RequestException as exc:
        logger.error("Kalshi market fetch error [%s]: %s", ticker, exc)
        return None


def get_orderbook(ticker: str) -> dict:
    """
    Get real-time order book for a market.
    Returns {"yes_bids": [...], "yes_asks": [...]} with prices in cents (0-100).
    """
    try:
        resp = requests.get(
            f"{KALSHI_BASE}/markets/{ticker}/orderbook",
            headers=HEADERS,
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json().get("orderbook", {})
    except requests.RequestException:
        return {}


def cross_market_mispricing(
    kalshi_markets: list[KalshiMarket],
    poly_markets: list,   # list[PolymarketMarket]
    threshold: float = 0.04,
) -> list[dict]:
    """
    Find same-event markets priced differently on Kalshi vs Polymarket.
    Returns list of arbitrage opportunities.
    """
    opportunities = []
    poly_index = {m.question.lower(): m.yes_prob for m in poly_markets}

    for km in kalshi_markets:
        title_lower = km.title.lower()
        # Fuzzy match: any 4+ char word in the Kalshi title matches Polymarket
        words = [w for w in title_lower.split() if len(w) >= 4]
        for word in words:
            for poly_q, poly_p in poly_index.items():
                if word in poly_q:
                    gap = abs(km.yes_mid - poly_p)
                    if gap >= threshold:
                        opportunities.append({
                            "kalshi_ticker": km.ticker,
                            "kalshi_title": km.title,
                            "kalshi_prob": km.yes_mid,
                            "poly_question": poly_q,
                            "poly_prob": poly_p,
                            "gap": gap,
                            "long_side": "kalshi" if km.yes_mid < poly_p else "polymarket",
                        })
                    break

    opportunities.sort(key=lambda x: x["gap"], reverse=True)
    return opportunities


def _parse_market(item: dict) -> Optional[KalshiMarket]:
    try:
        # Prices are in cents (0-100) in Kalshi's API
        yes_bid = float(item.get("yes_bid", 0)) / 100
        yes_ask = float(item.get("yes_ask", 0)) / 100
        yes_mid = (yes_bid + yes_ask) / 2 if yes_bid and yes_ask else yes_bid or yes_ask

        vol_raw = item.get("volume", item.get("dollar_volume", 0))
        volume = float(vol_raw or 0)

        oi_raw = item.get("open_interest", item.get("dollar_open_interest", 0))
        open_interest = float(oi_raw or 0)

        return KalshiMarket(
            ticker=str(item.get("ticker", "")),
            title=str(item.get("title", item.get("question", ""))),
            yes_bid=yes_bid,
            yes_ask=yes_ask,
            yes_mid=yes_mid,
            volume_usd=volume,
            open_interest=open_interest,
            close_time=str(item.get("close_time", item.get("expiration_time", ""))),
            status=str(item.get("status", "open")),
            category=str(item.get("category", "")),
        )
    except (TypeError, ValueError, KeyError):
        return None
