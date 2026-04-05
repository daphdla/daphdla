"""
Euronext tracker — top holders & données de marché.

Sources:
  • Euronext Live API  https://live.euronext.com/en/ajax/getEquityScreenerData
  • Euronext instruments https://api.euronext.com/v1/instruments/
  • Scraping page détail action pour composition actionnariat
  • Données AMF via XBRL (fallback)
"""
from __future__ import annotations

import json
import logging
import time
import random
from typing import Optional

import requests
import pandas as pd
from bs4 import BeautifulSoup
from fake_useragent import UserAgent

logger = logging.getLogger(__name__)
_ua = UserAgent()

# ── endpoints Euronext ────────────────────────────────────────────────────────
EURONEXT_SCREENER_API = "https://live.euronext.com/en/pd_es/data/stocks"
EURONEXT_INSTRUMENT_API = "https://live.euronext.com/en/ajax/getDetailedInstrument"
EURONEXT_HOLDERS_URL = "https://live.euronext.com/en/product/equities/{isin}-{mic}/shareholders"

HEADERS_EURONEXT = {
    "User-Agent": "",   # rempli dynamiquement
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://live.euronext.com/",
    "Origin": "https://live.euronext.com",
}


def _get_json(url: str, params: dict | None = None, retries: int = 3) -> Optional[dict | list]:
    for attempt in range(retries):
        headers = {**HEADERS_EURONEXT, "User-Agent": _ua.random}
        try:
            resp = requests.get(url, headers=headers, params=params, timeout=15)
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:
            wait = 2 ** attempt + random.uniform(0, 1)
            logger.warning("GET %s fail %d: %s — wait %.1fs", url, attempt + 1, exc, wait)
            time.sleep(wait)
    return None


def _post_json(url: str, data: dict, retries: int = 3) -> Optional[dict | list]:
    for attempt in range(retries):
        headers = {**HEADERS_EURONEXT, "User-Agent": _ua.random}
        try:
            resp = requests.post(url, headers=headers, data=data, timeout=15)
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:
            wait = 2 ** attempt + random.uniform(0, 1)
            logger.warning("POST %s fail %d: %s — wait %.1fs", url, attempt + 1, exc, wait)
            time.sleep(wait)
    return None


# ── Screener Euronext ─────────────────────────────────────────────────────────

def fetch_euronext_screener(
    market: str = "XPAR",
    page_size: int = 100,
    max_pages: int = 10,
) -> pd.DataFrame:
    """
    Utilise l'API DataTables d'Euronext Live pour récupérer toutes les actions
    d'un marché (défaut: Paris XPAR).

    Retourne un DataFrame avec: isin, name, mic, last_price, volume, market_cap.
    """
    records = []
    for page in range(max_pages):
        payload = {
            "draw": page + 1,
            "start": page * page_size,
            "length": page_size,
            "iDisplayLength": page_size,
            "iDisplayStart": page * page_size,
            "sSortDir_0": "desc",
            "iSortCol_0": 6,           # tri par market cap
            "sSortDir_0": "desc",
            "mDataProp_0": 0,
            "market": market,
        }
        data = _post_json(EURONEXT_SCREENER_API, payload)
        if not data or "aaData" not in data:
            break

        page_data = data["aaData"]
        if not page_data:
            break

        for row in page_data:
            try:
                # Format: [name_html, isin, mic, currency, last, change, market_cap, ...]
                name_html = row[0] if row else ""
                soup = BeautifulSoup(str(name_html), "lxml")
                name = soup.get_text(strip=True)
                isin = row[1] if len(row) > 1 else ""
                mic = row[2] if len(row) > 2 else market
                last = row[4] if len(row) > 4 else None
                market_cap = row[6] if len(row) > 6 else None
                records.append({
                    "isin": isin,
                    "name": name,
                    "mic": mic,
                    "last_price": _safe_float(last),
                    "market_cap_m": _safe_float(market_cap),
                })
            except Exception:
                pass

        logger.debug("Page %d: %d instruments", page + 1, len(page_data))

        # Si moins d'une page complète → fin
        if len(page_data) < page_size:
            break
        time.sleep(0.5)

    df = pd.DataFrame(records)
    logger.info("Euronext screener [%s]: %d instruments", market, len(df))
    return df


def _safe_float(val) -> Optional[float]:
    try:
        return float(str(val).replace(",", ".").replace("\xa0", "").strip())
    except (ValueError, TypeError):
        return None


# ── Top holders ───────────────────────────────────────────────────────────────

def fetch_top_holders(isin: str, mic: str = "XPAR") -> pd.DataFrame:
    """
    Scrape la page actionnariat d'une action Euronext.
    Retourne un DataFrame: holder_name, pct_held, nb_shares, type, date_disclosed.
    """
    url = EURONEXT_HOLDERS_URL.format(isin=isin, mic=mic)
    headers = {"User-Agent": _ua.random, "Accept-Language": "fr-FR,fr;q=0.9"}
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
    except Exception as exc:
        logger.warning("Holders %s: %s", isin, exc)
        return pd.DataFrame()

    soup = BeautifulSoup(resp.text, "lxml")
    rows = []

    # Table actionnaires significatifs
    for tr in soup.select("table.shareholders-table tbody tr, table tbody tr"):
        cols = [td.get_text(strip=True) for td in tr.find_all("td")]
        if len(cols) >= 3:
            rows.append({
                "holder_name": cols[0],
                "pct_held": _safe_float(cols[1].replace(",", ".").replace("%", "")),
                "nb_shares": cols[2] if len(cols) > 2 else None,
                "type": cols[3] if len(cols) > 3 else "Unknown",
                "date_disclosed": cols[4] if len(cols) > 4 else None,
            })

    if not rows:
        # Fallback: chercher JSON embarqué dans la page
        script_tags = soup.find_all("script", type="application/json")
        for script in script_tags:
            try:
                data = json.loads(script.string or "")
                if isinstance(data, list) and data and "holder" in str(data[0]).lower():
                    for item in data:
                        rows.append({
                            "holder_name": item.get("holderName") or item.get("name", ""),
                            "pct_held": item.get("percentage") or item.get("pct"),
                            "nb_shares": item.get("shares"),
                            "type": item.get("type", ""),
                            "date_disclosed": item.get("date"),
                        })
                    break
            except Exception:
                pass

    df = pd.DataFrame(rows)
    logger.info("Top holders %s: %d actionnaires", isin, len(df))
    return df


def fetch_institutional_concentration(isin: str, mic: str = "XPAR") -> dict:
    """
    Calcule la concentration institutionnelle (signal de conviction).
    Retourne: top3_pct, top10_pct, institutional_pct, float_pct.
    """
    holders = fetch_top_holders(isin, mic)
    if holders.empty:
        return {}

    pcts = holders["pct_held"].dropna().sort_values(ascending=False)
    institutional = holders[holders["type"].str.lower().isin(
        ["institutional", "fund", "etf", "fonds", "gérant", "asset manager"]
    )]

    return {
        "top3_pct": round(pcts.head(3).sum(), 2),
        "top10_pct": round(pcts.head(10).sum(), 2),
        "institutional_pct": round(institutional["pct_held"].sum(), 2),
        "nb_significant_holders": len(holders),
    }


# ── Pipeline complet ──────────────────────────────────────────────────────────

def run_euronext_pipeline(
    tickers_with_isin: list[dict] | None = None,
) -> pd.DataFrame:
    """
    1. Récupère la liste des actions via le screener Euronext
    2. Pour chaque action (ou sous-ensemble fourni), récupère les top holders
    3. Retourne un DataFrame enrichi

    tickers_with_isin: [{"isin": "FR0000131104", "mic": "XPAR", "ticker": "BNP.PA"}, …]
    """
    logger.info("=== Pipeline Euronext ===")

    # Screener Paris + Amsterdam (éligibles PEA)
    paris = fetch_euronext_screener("XPAR", page_size=100, max_pages=5)
    amsterdam = fetch_euronext_screener("XAMS", page_size=100, max_pages=3)
    universe = pd.concat([paris, amsterdam], ignore_index=True).drop_duplicates("isin")

    if tickers_with_isin:
        # Enrichir avec les holders pour les actions filtrées
        rows = []
        for item in tickers_with_isin[:20]:   # limite à 20 pour ne pas surcharger
            isin = item.get("isin", "")
            mic = item.get("mic", "XPAR")
            if not isin:
                continue
            concentration = fetch_institutional_concentration(isin, mic)
            row = {**item, **concentration}
            rows.append(row)
            time.sleep(1)
        holders_df = pd.DataFrame(rows)
        if not holders_df.empty and not universe.empty:
            universe = universe.merge(holders_df, on="isin", how="left")

    return universe
