"""
Boursorama scraper — fetches consensus P/E, ROE, Dette/EBITDA.

Strategy:
  1. Convert Yahoo ticker (e.g. "MC.PA") → Boursorama symbol ("1rPMC")
  2. Scrape /bourse/action/<symbol>/consensus
  3. Parse the summary table for forward P/E, ROE, debt metrics.

Rate limit: 2 s between requests (caller's responsibility).
"""

import re
import time
import logging
import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/122.0 Safari/537.36"
    ),
    "Accept-Language": "fr-FR,fr;q=0.9",
}

BASE_URL = "https://www.boursorama.com/bourse/action/graph/ws/GetTickerChart"
CONSENSUS_URL = "https://www.boursorama.com/cours/{symbol}/"

# Manual mapping Yahoo suffix → Boursorama prefix
_SUFFIX_PREFIX = {
    ".PA": "1rP",
    ".NL": "1rA",
    ".AS": "1rA",
    ".BR": "1rB",
    ".BE": "1rB",
    ".MC": "1rE",
    ".SW": "1zXS",
    ".CO": "1rCO",
    ".MI": "1rMI",
}


def _yahoo_to_boursorama(ticker: str) -> str:
    """Best-effort conversion of Yahoo ticker to Boursorama symbol."""
    for suffix, prefix in _SUFFIX_PREFIX.items():
        if ticker.upper().endswith(suffix.upper()):
            base = ticker[: -len(suffix)].replace(".", "")
            return f"{prefix}{base}"
    return ticker  # fallback: return as-is


def _parse_float(text: str) -> float | None:
    """Parse a European-formatted number like '12,34' or '1 234,5' → float."""
    if not text:
        return None
    cleaned = text.strip().replace("\xa0", "").replace(" ", "").replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


def fetch_consensus(ticker: str, session: requests.Session | None = None) -> dict:
    """
    Returns dict with keys: pe, roe, dette_ebitda.
    Values are float or None if unavailable.
    """
    symbol = _yahoo_to_boursorama(ticker)
    url = CONSENSUS_URL.format(symbol=symbol)

    sess = session or requests.Session()
    result = {"pe": None, "roe": None, "dette_ebitda": None}

    try:
        resp = sess.get(url, headers=HEADERS, timeout=10)
        resp.raise_for_status()
    except requests.RequestException as exc:
        logger.warning("Boursorama fetch failed for %s: %s", ticker, exc)
        return result

    soup = BeautifulSoup(resp.text, "html.parser")

    # Boursorama renders ratios inside <span> tags with data-ist attributes
    # or inside ratio tables. We use multiple heuristics.
    result.update(_parse_ratio_table(soup))
    return result


# ---------------------------------------------------------------------------
# Internal parsers
# ---------------------------------------------------------------------------

def _parse_ratio_table(soup: BeautifulSoup) -> dict:
    """
    Scan all <table> elements for rows containing keywords
    PER / P/E / ROE / Dette / EBITDA.
    """
    out: dict = {}
    text_lower = soup.get_text(" ", strip=True).lower()

    # ---- Strategy A: structured ratio section ----
    for row in soup.select("tr"):
        cells = [td.get_text(" ", strip=True) for td in row.find_all(["td", "th"])]
        if len(cells) < 2:
            continue
        label = cells[0].lower()

        if _match(label, ("per", "p/e", "price earning")):
            if out.get("pe") is None:
                out["pe"] = _parse_float(cells[-1])

        elif _match(label, ("roe", "return on equity")):
            if out.get("roe") is None:
                val = _parse_float(cells[-1].replace("%", ""))
                out["roe"] = val

        elif _match(label, ("dette nette/ebitda", "dette/ebitda", "net debt/ebitda")):
            if out.get("dette_ebitda") is None:
                out["dette_ebitda"] = _parse_float(cells[-1])

    # ---- Strategy B: regex scan on raw text ----
    if out.get("pe") is None:
        m = re.search(r"p(?:er|/e)[^\d]{0,10}([\d,.\s]+)", text_lower)
        if m:
            out["pe"] = _parse_float(m.group(1))

    if out.get("roe") is None:
        m = re.search(r"roe[^\d]{0,10}([\d,.\s]+)\s*%?", text_lower)
        if m:
            out["roe"] = _parse_float(m.group(1))

    if out.get("dette_ebitda") is None:
        m = re.search(r"dette[^\d]{0,20}ebitda[^\d]{0,10}([\d,.\s]+)", text_lower)
        if m:
            out["dette_ebitda"] = _parse_float(m.group(1))

    return out


def _match(label: str, keywords: tuple) -> bool:
    return any(kw in label for kw in keywords)
