"""
Scraper Boursorama — consensus & top actions PEA.

Sources:
  • https://www.boursorama.com/bourse/actions/palmares/consensus/
  • https://www.boursorama.com/bourse/actions/palmares/dividendes/
  • Enrichissement via yfinance pour les fondamentaux (P/E, ROE, …)
"""
from __future__ import annotations

import logging
import time
import random
from typing import Optional

import requests
import pandas as pd
from bs4 import BeautifulSoup
import yfinance as yf
from fake_useragent import UserAgent

from config import PEA_UNIVERSE, MIN_ROE, MAX_PE, MIN_MARKET_CAP_M

logger = logging.getLogger(__name__)

_ua = UserAgent()

BOURSORAMA_CONSENSUS_URL = (
    "https://www.boursorama.com/bourse/actions/palmares/consensus/"
    "?market=2cFRANCE&variation=4"
)
BOURSORAMA_DIVIDENDS_URL = (
    "https://www.boursorama.com/bourse/actions/palmares/dividendes/"
    "?market=2cFRANCE"
)


# ── helpers ───────────────────────────────────────────────────────────────────

def _get(url: str, retries: int = 3) -> Optional[requests.Response]:
    """GET avec rotation d'User-Agent et retry exponentiel."""
    headers = {
        "User-Agent": _ua.random,
        "Accept-Language": "fr-FR,fr;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Referer": "https://www.boursorama.com/",
    }
    for attempt in range(retries):
        try:
            resp = requests.get(url, headers=headers, timeout=15)
            resp.raise_for_status()
            return resp
        except Exception as exc:
            wait = 2 ** attempt + random.uniform(0, 1)
            logger.warning("GET %s failed (attempt %d): %s — retry in %.1fs", url, attempt + 1, exc, wait)
            time.sleep(wait)
    return None


def _parse_float(text: str) -> Optional[float]:
    """Convertit '12,34' ou '12.34 %' en float."""
    try:
        return float(text.replace("\xa0", "").replace(",", ".").replace("%", "").strip())
    except (ValueError, AttributeError):
        return None


# ── scraping Boursorama ───────────────────────────────────────────────────────

def scrape_boursorama_consensus() -> pd.DataFrame:
    """
    Scrape le palmarès consensus Boursorama.
    Retourne un DataFrame avec colonnes: name, symbol_brs, consensus_score.
    """
    resp = _get(BOURSORAMA_CONSENSUS_URL)
    if resp is None:
        logger.error("Impossible de récupérer le consensus Boursorama")
        return pd.DataFrame()

    soup = BeautifulSoup(resp.text, "lxml")
    rows = []

    # Table principale — sélecteur générique robuste
    for tr in soup.select("table tbody tr"):
        cols = tr.find_all("td")
        if len(cols) < 4:
            continue
        try:
            name = cols[0].get_text(strip=True)
            symbol_raw = ""
            link = cols[0].find("a")
            if link and link.get("href"):
                # ex: /cours/1rPAIR/ → PAIR
                parts = link["href"].rstrip("/").split("/")
                symbol_raw = parts[-1].lstrip("1r").upper()

            # Score consensus (Achat fort = 5, Vente forte = 1)
            consensus_text = cols[-1].get_text(strip=True)
            score = _parse_float(consensus_text)

            rows.append({
                "name": name,
                "symbol_brs": symbol_raw,
                "consensus_score": score,
            })
        except Exception as exc:
            logger.debug("Ligne ignorée: %s", exc)

    df = pd.DataFrame(rows)
    logger.info("Boursorama consensus: %d lignes récupérées", len(df))
    return df


def scrape_boursorama_dividends() -> pd.DataFrame:
    """Scrape le palmarès rendement dividende Boursorama."""
    resp = _get(BOURSORAMA_DIVIDENDS_URL)
    if resp is None:
        return pd.DataFrame()

    soup = BeautifulSoup(resp.text, "lxml")
    rows = []
    for tr in soup.select("table tbody tr"):
        cols = tr.find_all("td")
        if len(cols) < 3:
            continue
        try:
            name = cols[0].get_text(strip=True)
            dividend_yield = _parse_float(cols[2].get_text(strip=True))
            rows.append({"name": name, "dividend_yield_pct": dividend_yield})
        except Exception:
            pass

    df = pd.DataFrame(rows)
    logger.info("Boursorama dividendes: %d lignes", len(df))
    return df


# ── enrichissement yfinance ───────────────────────────────────────────────────

def fetch_fundamentals(tickers: list[str]) -> pd.DataFrame:
    """
    Récupère les fondamentaux via yfinance pour une liste de tickers.
    Colonnes: ticker, name, pe_ratio, roe_pct, pb_ratio, market_cap_m,
              revenue_growth_yoy, debt_to_equity, dividend_yield_pct,
              eps_growth_5y, sector, industry, price, 52w_high, 52w_low.
    """
    records = []
    for ticker in tickers:
        try:
            info = yf.Ticker(ticker).info
            market_cap = info.get("marketCap") or 0
            roe_raw = info.get("returnOnEquity")         # ex: 0.23 → 23%
            pe_raw = info.get("trailingPE")
            records.append({
                "ticker": ticker,
                "name": info.get("longName") or info.get("shortName", ticker),
                "pe_ratio": round(pe_raw, 2) if pe_raw else None,
                "roe_pct": round(roe_raw * 100, 2) if roe_raw else None,
                "pb_ratio": info.get("priceToBook"),
                "market_cap_m": round(market_cap / 1e6, 1),
                "revenue_growth_yoy": info.get("revenueGrowth"),
                "earnings_growth_yoy": info.get("earningsGrowth"),
                "debt_to_equity": info.get("debtToEquity"),
                "dividend_yield_pct": round((info.get("dividendYield") or 0) * 100, 2),
                "sector": info.get("sector", ""),
                "industry": info.get("industry", ""),
                "price": info.get("currentPrice") or info.get("regularMarketPrice"),
                "52w_high": info.get("fiftyTwoWeekHigh"),
                "52w_low": info.get("fiftyTwoWeekLow"),
                "analyst_target": info.get("targetMeanPrice"),
                "analyst_count": info.get("numberOfAnalystOpinions"),
                "beta": info.get("beta"),
                "free_cashflow_m": round((info.get("freeCashflow") or 0) / 1e6, 1),
                "gross_margin_pct": round((info.get("grossMargins") or 0) * 100, 2),
                "operating_margin_pct": round((info.get("operatingMargins") or 0) * 100, 2),
            })
            time.sleep(0.3)   # courtoisie API
        except Exception as exc:
            logger.warning("yfinance %s: %s", ticker, exc)

    df = pd.DataFrame(records)
    logger.info("Fondamentaux récupérés: %d/%d tickers", len(df), len(tickers))
    return df


# ── screening PEA ─────────────────────────────────────────────────────────────

def screen_pea_stocks(fundamentals: pd.DataFrame) -> pd.DataFrame:
    """
    Filtre selon les critères PEA value:
      • ROE ≥ MIN_ROE %
      • P/E ≤ MAX_PE
      • Market cap ≥ MIN_MARKET_CAP_M M€
    Trie par score composite (ROE/PE).
    """
    df = fundamentals.copy()
    df = df[
        df["roe_pct"].notna() &
        df["pe_ratio"].notna() &
        (df["roe_pct"] >= MIN_ROE) &
        (df["pe_ratio"] <= MAX_PE) &
        (df["pe_ratio"] > 0) &
        (df["market_cap_m"] >= MIN_MARKET_CAP_M)
    ]

    # Score value = ROE / PE  (plus c'est haut, plus c'est intéressant)
    df["value_score"] = (df["roe_pct"] / df["pe_ratio"]).round(3)

    # Upside analyste
    df["analyst_upside_pct"] = (
        (df["analyst_target"] - df["price"]) / df["price"] * 100
    ).round(2)

    df = df.sort_values("value_score", ascending=False).reset_index(drop=True)
    logger.info("Screening PEA: %d actions retenues", len(df))
    return df


# ── point d'entrée ────────────────────────────────────────────────────────────

def run_boursorama_pipeline() -> pd.DataFrame:
    """
    Pipeline complet:
      1. Scrape consensus Boursorama
      2. Fetch fondamentaux yfinance sur PEA_UNIVERSE
      3. Filtre & score
    Retourne le DataFrame final trié.
    """
    logger.info("=== Pipeline Boursorama ===")

    # 1. Consensus (liste de noms intéressants — sert de signal qualitatif)
    consensus_df = scrape_boursorama_consensus()

    # 2. Fondamentaux sur l'univers complet PEA
    logger.info("Récupération fondamentaux pour %d tickers…", len(PEA_UNIVERSE))
    fundamentals = fetch_fundamentals(PEA_UNIVERSE)

    if fundamentals.empty:
        logger.error("Aucun fondamental récupéré")
        return pd.DataFrame()

    # 3. Screening
    screened = screen_pea_stocks(fundamentals)

    # 4. Bonus : ajouter le score consensus si dispo
    if not consensus_df.empty and "name" in consensus_df.columns:
        screened = screened.merge(
            consensus_df[["name", "consensus_score"]],
            on="name",
            how="left",
        )

    return screened
