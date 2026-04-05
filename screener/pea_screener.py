#!/usr/bin/env python3
"""
Clawdbot PEA Boursorama v1.0
=============================
Screener d'actions PEA sous-évaluées sur Euronext.

Usage
-----
    python pea_screener.py [--output console|csv|telegram] [--csv-path results.csv]

Env vars (pour Telegram)
    TELEGRAM_TOKEN   : token du bot
    TELEGRAM_CHAT_ID : ID du chat / channel
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
import time

import pandas as pd
import requests

from tickers import TICKERS, ALL_TICKERS
from boursorama import fetch_consensus
from yfinance_data import fetch_yfinance, merge
from scoring import compute_score, recommend
from output import to_console, to_csv, to_telegram, send_telegram

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Rate limiter
# ---------------------------------------------------------------------------

RATE_LIMIT_SECONDS = 2.0


def _sleep():
    time.sleep(RATE_LIMIT_SECONDS)


# ---------------------------------------------------------------------------
# Reverse ticker → sector lookup
# ---------------------------------------------------------------------------

_TICKER_SECTOR: dict[str, str] = {
    t: sector for sector, tickers in TICKERS.items() for t in tickers
}


# ---------------------------------------------------------------------------
# Core screener loop
# ---------------------------------------------------------------------------

def run_screener() -> pd.DataFrame:
    session = requests.Session()
    rows = []

    total = len(ALL_TICKERS)
    logger.info("Démarrage du screener — %d tickers", total)

    for i, ticker in enumerate(ALL_TICKERS, 1):
        logger.info("[%d/%d] %s", i, total, ticker)

        # 1. Boursorama consensus
        brs = fetch_consensus(ticker, session=session)
        _sleep()

        # 2. yfinance fallback + metadata
        yf = fetch_yfinance(ticker)
        _sleep()

        # 3. Merge (Boursorama priority)
        data = merge(brs, yf)

        pe = data.get("pe")
        roe = data.get("roe")
        dette = data.get("dette_ebitda")

        # 4. Score
        score = compute_score(pe, roe, dette)
        rec = recommend(score, pe)

        rows.append(
            {
                "Ticker": ticker,
                "Nom": data.get("name", ticker),
                "Secteur": _TICKER_SECTOR.get(ticker, "Inconnu"),
                "P/E": round(pe, 2) if pe is not None else None,
                "ROE%": round(roe, 2) if roe is not None else None,
                "D/EBITDA": round(dette, 2) if dette is not None else None,
                "Score": score,
                "Recommandation": rec,
            }
        )

    df = pd.DataFrame(rows)
    return df


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Clawdbot PEA Screener")
    parser.add_argument(
        "--output",
        choices=["console", "csv", "telegram"],
        default="console",
        help="Mode de sortie (défaut: console)",
    )
    parser.add_argument(
        "--csv-path",
        default="results.csv",
        help="Chemin du fichier CSV (--output csv seulement)",
    )
    parser.add_argument(
        "--filter-buy",
        action="store_true",
        help="N'afficher que les signaux ACHETER",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    df = run_screener()

    if args.filter_buy:
        df = df[df["Recommandation"] == "ACHETER"]

    if df.empty and args.filter_buy:
        logger.info("Aucun signal ACHETER détecté.")

    if args.output == "console":
        to_console(df)

    elif args.output == "csv":
        to_csv(df, args.csv_path)
        to_console(df)  # also print

    elif args.output == "telegram":
        token = os.getenv("TELEGRAM_TOKEN")
        chat_id = os.getenv("TELEGRAM_CHAT_ID")
        if not token or not chat_id:
            logger.error(
                "Variables TELEGRAM_TOKEN et TELEGRAM_CHAT_ID requises pour --output telegram"
            )
            sys.exit(1)
        msg = to_telegram(df)
        send_telegram(token, chat_id, msg)
        logger.info("Message envoyé sur Telegram.")
        # Also print locally
        print(msg)


if __name__ == "__main__":
    main()
