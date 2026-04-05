"""
Data fetching from yfinance with caching and error handling.
"""
import time
import logging
import pandas as pd
import yfinance as yf
import streamlit as st
from typing import Optional
from stocks import ALL_STOCKS, is_pea_eligible

logger = logging.getLogger(__name__)

CACHE_TTL = 3600  # 1 hour


def _safe_get(info: dict, key: str, default=None):
    val = info.get(key)
    if val in (None, "N/A", "Infinity", float("inf"), float("-inf")):
        return default
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


@st.cache_data(ttl=CACHE_TTL, show_spinner=False)
def fetch_ticker(ticker: str) -> Optional[dict]:
    """Fetch fundamentals for one ticker. Returns None on failure."""
    try:
        t = yf.Ticker(ticker)
        info = t.info or {}

        # ── Price & Market Cap ────────────────────────────────────────────
        price = _safe_get(info, "currentPrice") or _safe_get(info, "regularMarketPrice")
        market_cap = _safe_get(info, "marketCap")

        # ── Valuation ────────────────────────────────────────────────────
        pe_trailing = _safe_get(info, "trailingPE")
        pe_forward  = _safe_get(info, "forwardPE")
        pb          = _safe_get(info, "priceToBook")
        ev_ebitda   = _safe_get(info, "enterpriseToEbitda")

        # ── Profitability ────────────────────────────────────────────────
        roe         = _safe_get(info, "returnOnEquity")  # decimal
        roa         = _safe_get(info, "returnOnAssets")
        gross_margin = _safe_get(info, "grossMargins")
        op_margin   = _safe_get(info, "operatingMargins")

        # ── Debt ─────────────────────────────────────────────────────────
        total_debt  = _safe_get(info, "totalDebt")
        ebitda      = _safe_get(info, "ebitda")
        debt_ebitda = None
        if total_debt is not None and ebitda and ebitda > 0:
            debt_ebitda = total_debt / ebitda

        # ── FCF Yield ────────────────────────────────────────────────────
        fcf           = _safe_get(info, "freeCashflow")
        fcf_yield     = None
        if fcf is not None and market_cap and market_cap > 0:
            fcf_yield = (fcf / market_cap) * 100  # in %

        # ── Growth ───────────────────────────────────────────────────────
        rev_growth   = _safe_get(info, "revenueGrowth")   # decimal
        earn_growth  = _safe_get(info, "earningsGrowth")  # decimal

        # ── Dividend ─────────────────────────────────────────────────────
        div_yield    = _safe_get(info, "dividendYield")   # decimal

        return {
            "ticker":       ticker,
            "name":         info.get("shortName", ticker),
            "sector":       info.get("sector", "Unknown"),
            "country":      info.get("country", "US"),
            "currency":     info.get("currency", "USD"),
            "price":        price,
            "market_cap":   market_cap,
            "pe":           pe_trailing,
            "pe_forward":   pe_forward,
            "pb":           pb,
            "ev_ebitda":    ev_ebitda,
            "roe":          roe * 100 if roe is not None else None,      # → %
            "roa":          roa * 100 if roa is not None else None,
            "gross_margin": gross_margin * 100 if gross_margin is not None else None,
            "op_margin":    op_margin * 100 if op_margin is not None else None,
            "debt_ebitda":  debt_ebitda,
            "fcf_yield":    fcf_yield,
            "rev_growth":   rev_growth * 100 if rev_growth is not None else None,
            "earn_growth":  earn_growth * 100 if earn_growth is not None else None,
            "div_yield":    div_yield * 100 if div_yield is not None else None,
        }
    except Exception as e:
        logger.warning(f"Failed to fetch {ticker}: {e}")
        return None


def fetch_all(tickers: list[str], progress_callback=None) -> pd.DataFrame:
    """
    Fetch all tickers with a small delay to avoid rate-limiting.
    Returns a DataFrame with one row per successfully fetched ticker.
    """
    rows = []
    total = len(tickers)
    for i, stock in enumerate(ALL_STOCKS):
        if stock["ticker"] not in tickers:
            continue
        if progress_callback:
            progress_callback(i / total, f"Chargement {stock['ticker']}…")
        data = fetch_ticker(stock["ticker"])
        if data:
            # Enrich with static metadata
            data["pea"] = is_pea_eligible(stock["country"])
            rows.append(data)
        time.sleep(0.05)  # gentle throttle

    if progress_callback:
        progress_callback(1.0, "Terminé")

    return pd.DataFrame(rows) if rows else pd.DataFrame()
