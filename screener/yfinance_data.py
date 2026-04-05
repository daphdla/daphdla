"""
yfinance fallback layer.

When Boursorama scraping returns None for a metric, we attempt to fill
the gap from yfinance .info dict (TTM / last-annual values).
"""

import logging
import yfinance as yf

logger = logging.getLogger(__name__)


def fetch_yfinance(ticker: str) -> dict:
    """
    Returns dict with keys: pe, roe, dette_ebitda, name, sector, currency.
    All financial values are float | None.
    """
    result = {
        "pe": None,
        "roe": None,
        "dette_ebitda": None,
        "name": ticker,
        "sector": None,
        "currency": None,
    }

    try:
        info = yf.Ticker(ticker).info
    except Exception as exc:
        logger.warning("yfinance fetch failed for %s: %s", ticker, exc)
        return result

    result["name"] = info.get("shortName") or info.get("longName") or ticker
    result["sector"] = info.get("sector")
    result["currency"] = info.get("currency")

    # P/E — prefer forward, fall back to trailing
    result["pe"] = (
        info.get("forwardPE")
        or info.get("trailingPE")
    )

    # ROE — yfinance gives a ratio; convert to %
    roe_raw = info.get("returnOnEquity")
    if roe_raw is not None:
        result["roe"] = round(roe_raw * 100, 2)

    # Dette/EBITDA — compute from balance sheet components
    total_debt = info.get("totalDebt") or 0
    cash = info.get("totalCash") or 0
    ebitda = info.get("ebitda")

    if ebitda and ebitda != 0:
        net_debt = total_debt - cash
        result["dette_ebitda"] = round(net_debt / ebitda, 2)

    return result


def merge(boursorama: dict, yf_data: dict) -> dict:
    """
    Merge Boursorama (priority) + yfinance (fallback).
    yfinance metadata (name, sector, currency) always fills in.
    """
    merged = dict(yf_data)  # start with yfinance base
    for key in ("pe", "roe", "dette_ebitda"):
        if boursorama.get(key) is not None:
            merged[key] = boursorama[key]
    return merged
