"""
Fetches odds from The Odds API (https://the-odds-api.com).
Free tier: 500 requests/month.  h2h = head-to-head moneylines.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

import requests

from config import ODDS_API_KEY, ODDS_API_BASE, SPORTS_TO_MONITOR

logger = logging.getLogger(__name__)


@dataclass
class OddsEvent:
    event_id: str
    sport: str
    home_team: str
    away_team: str
    commence_time: str
    bookmakers: list[dict]       # raw bookmaker list from API
    best_home_odds: float = 0.0  # decimal
    best_away_odds: float = 0.0
    worst_home_odds: float = 0.0
    worst_away_odds: float = 0.0
    num_books: int = 0


def american_to_decimal(american: int | float) -> float:
    """Convert American odds to decimal."""
    if american >= 100:
        return round(american / 100 + 1, 4)
    elif american <= -100:
        return round(100 / abs(american) + 1, 4)
    return 0.0


def decimal_to_implied_prob(decimal_odds: float) -> float:
    if decimal_odds <= 0:
        return 0.0
    return round(1.0 / decimal_odds, 6)


def get_sports() -> list[dict]:
    """List all available sports."""
    if not ODDS_API_KEY:
        logger.warning("ODDS_API_KEY not set")
        return []
    resp = requests.get(
        f"{ODDS_API_BASE}/sports",
        params={"apiKey": ODDS_API_KEY},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def get_odds(
    sport_key: str,
    regions: str = "us,eu",
    markets: str = "h2h",
    odds_format: str = "decimal",
) -> list[OddsEvent]:
    """
    Fetch h2h odds for a given sport.
    Returns a list of OddsEvent objects.
    """
    if not ODDS_API_KEY:
        logger.warning("ODDS_API_KEY not set – returning empty odds")
        return []

    try:
        resp = requests.get(
            f"{ODDS_API_BASE}/sports/{sport_key}/odds",
            params={
                "apiKey": ODDS_API_KEY,
                "regions": regions,
                "markets": markets,
                "oddsFormat": odds_format,
            },
            timeout=15,
        )
        resp.raise_for_status()
        raw_events = resp.json()
        remaining = resp.headers.get("x-requests-remaining", "?")
        logger.info("Odds API [%s]: %d events | %s requests left", sport_key, len(raw_events), remaining)
    except requests.RequestException as exc:
        logger.error("Odds API error for %s: %s", sport_key, exc)
        return []

    events = []
    for ev in raw_events:
        odds_event = _parse_event(ev, sport_key)
        if odds_event:
            events.append(odds_event)
    return events


def get_all_odds() -> list[OddsEvent]:
    """Fetch odds for all configured sports."""
    all_events: list[OddsEvent] = []
    for sport in SPORTS_TO_MONITOR:
        events = get_odds(sport)
        all_events.extend(events)
    logger.info("Total events fetched: %d", len(all_events))
    return all_events


def _parse_event(ev: dict, sport: str) -> Optional[OddsEvent]:
    bookmakers = ev.get("bookmakers", [])
    if not bookmakers:
        return None

    home = ev.get("home_team", "")
    away = ev.get("away_team", "")

    home_odds_list: list[float] = []
    away_odds_list: list[float] = []

    for bm in bookmakers:
        for mkt in bm.get("markets", []):
            if mkt.get("key") != "h2h":
                continue
            for outcome in mkt.get("outcomes", []):
                price = float(outcome.get("price", 0))
                if price <= 1.0:
                    continue
                if outcome.get("name") == home:
                    home_odds_list.append(price)
                elif outcome.get("name") == away:
                    away_odds_list.append(price)

    if not home_odds_list or not away_odds_list:
        return None

    return OddsEvent(
        event_id=ev.get("id", ""),
        sport=sport,
        home_team=home,
        away_team=away,
        commence_time=ev.get("commence_time", ""),
        bookmakers=bookmakers,
        best_home_odds=max(home_odds_list),
        best_away_odds=max(away_odds_list),
        worst_home_odds=min(home_odds_list),
        worst_away_odds=min(away_odds_list),
        num_books=len(bookmakers),
    )
