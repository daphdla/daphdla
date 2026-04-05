"""
Scraper for misprice.app using Playwright (headless browser).
Falls back gracefully when the site is unavailable.
"""
from __future__ import annotations

import asyncio
import logging
import re
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class MispriceRow:
    """One row of data from misprice.app."""
    event: str
    sport: str
    market: str
    book_odds: float            # decimal odds from sportsbook
    market_prob: float          # implied probability from prediction market (0-1)
    book_implied_prob: float    # 1 / book_odds
    edge: float                 # market_prob - book_implied_prob
    source_book: str = ""
    source_market: str = ""     # e.g. "Polymarket", "Manifold"
    raw: dict = field(default_factory=dict)


async def scrape_misprice_app(url: str = "https://www.misprice.app") -> list[MispriceRow]:
    """
    Attempt to scrape misprice.app via Playwright.
    Returns empty list if unavailable or blocked.
    """
    try:
        from playwright.async_api import async_playwright, TimeoutError as PWTimeout
    except ImportError:
        logger.warning("Playwright not installed – skipping misprice.app scrape. Run: pip install playwright && playwright install chromium")
        return []

    rows: list[MispriceRow] = []

    try:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/122.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1280, "height": 800},
                locale="en-US",
            )
            page = await context.new_page()
            await page.goto(url, wait_until="networkidle", timeout=30_000)
            await asyncio.sleep(2)  # let JS hydrate

            # Try to intercept XHR / fetch calls that return JSON odds data
            # Most React SPAs load data via fetch — we capture it here
            api_data: list[dict] = []

            async def handle_response(response):
                if "json" in response.headers.get("content-type", ""):
                    try:
                        body = await response.json()
                        if isinstance(body, list) and body:
                            api_data.extend(body)
                        elif isinstance(body, dict):
                            api_data.append(body)
                    except Exception:
                        pass

            page.on("response", handle_response)

            # Wait for table rows to appear in the DOM
            try:
                await page.wait_for_selector("table tr, [data-testid='odds-row']", timeout=15_000)
            except PWTimeout:
                logger.warning("misprice.app: table not found within timeout")

            # Parse DOM table if present
            table_rows = await page.query_selector_all("table tbody tr")
            for tr in table_rows:
                cells = await tr.query_selector_all("td")
                texts = [await c.inner_text() for c in cells]
                if len(texts) < 4:
                    continue
                try:
                    row = _parse_table_row(texts)
                    if row:
                        rows.append(row)
                except Exception as exc:
                    logger.debug("Row parse error: %s | %s", texts, exc)

            # If DOM parsing yielded nothing, try intercepted API data
            if not rows and api_data:
                for item in api_data:
                    row = _parse_api_item(item)
                    if row:
                        rows.append(row)

            await browser.close()

    except Exception as exc:
        logger.warning("misprice.app scrape failed: %s", exc)

    logger.info("misprice.app: found %d rows", len(rows))
    return rows


def _parse_table_row(cells: list[str]) -> Optional[MispriceRow]:
    """Parse a DOM table row from misprice.app."""
    # Typical columns: Event | Sport | Book | Book Odds | Market | Market Prob | Edge
    if len(cells) < 5:
        return None

    def to_float(s: str) -> float:
        s = s.strip().replace("%", "").replace(",", "")
        return float(s) if s else 0.0

    try:
        event = cells[0].strip()
        sport = cells[1].strip() if len(cells) > 1 else ""
        book_odds_str = next((c for c in cells if re.match(r"^\d+\.\d+$", c.strip())), "0")
        market_prob_str = next((c for c in cells if "%" in c), "0%")

        book_odds = to_float(book_odds_str)
        if book_odds <= 1.0:
            return None

        market_prob = to_float(market_prob_str) / 100.0
        book_implied = 1.0 / book_odds
        edge = market_prob - book_implied

        return MispriceRow(
            event=event,
            sport=sport,
            market="",
            book_odds=book_odds,
            market_prob=market_prob,
            book_implied_prob=book_implied,
            edge=edge,
            raw={"cells": cells},
        )
    except (ValueError, ZeroDivisionError):
        return None


def _parse_api_item(item: dict) -> Optional[MispriceRow]:
    """Parse a JSON item intercepted from misprice.app's internal API."""
    try:
        book_odds = float(item.get("odds", item.get("bookOdds", 0)))
        if book_odds <= 1.0:
            return None

        market_prob_raw = item.get("marketProb", item.get("market_prob", item.get("prob", 0)))
        market_prob = float(market_prob_raw)
        if market_prob > 1.0:
            market_prob /= 100.0

        book_implied = 1.0 / book_odds
        edge = market_prob - book_implied

        return MispriceRow(
            event=str(item.get("event", item.get("name", ""))),
            sport=str(item.get("sport", "")),
            market=str(item.get("market", "")),
            book_odds=book_odds,
            market_prob=market_prob,
            book_implied_prob=book_implied,
            edge=edge,
            source_book=str(item.get("book", item.get("bookmaker", ""))),
            source_market=str(item.get("predictionMarket", item.get("platform", ""))),
            raw=item,
        )
    except (TypeError, ValueError, ZeroDivisionError):
        return None
