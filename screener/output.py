"""
Output formatters.

Supported modes:
  - telegram  : Markdown table for Telegram Bot API (parse_mode=MarkdownV2)
  - console   : Pretty-printed pandas DataFrame
  - csv       : CSV file dump
"""

from __future__ import annotations
import io
import pandas as pd


# ---------------------------------------------------------------------------
# Telegram
# ---------------------------------------------------------------------------

def to_telegram(df: pd.DataFrame) -> str:
    """
    Format results as a Telegram-friendly monospace table.

    Telegram MarkdownV2 limitations:
      - Use ```...``` for monospace blocks (safe for tables)
      - Special chars outside code blocks must be escaped
    """
    if df.empty:
        return "```\nAucune action trouvée.\n```"

    # Sort: BUY first, then by Score desc
    order = {"ACHETER": 0, "Surveiller": 1, "Neutre": 2, "Eviter": 3, "Données insuffisantes": 4}
    df = df.copy()
    df["_ord"] = df["Recommandation"].map(order).fillna(9)
    df = df.sort_values(["_ord", "Score"], ascending=[True, False]).drop(columns="_ord")

    lines = []
    header = f"{'Ticker':<12} {'P/E':>6} {'ROE%':>7} {'D/EBITDA':>9} {'Score':>7} {'Signal'}"
    sep = "-" * len(header)
    lines.append(header)
    lines.append(sep)

    for _, row in df.iterrows():
        pe_s = f"{row['P/E']:.1f}" if pd.notna(row["P/E"]) else "N/A"
        roe_s = f"{row['ROE%']:.1f}" if pd.notna(row["ROE%"]) else "N/A"
        det_s = f"{row['D/EBITDA']:.2f}" if pd.notna(row["D/EBITDA"]) else "N/A"
        sc_s = f"{row['Score']:.3f}" if pd.notna(row["Score"]) else "N/A"
        rec = row["Recommandation"]

        ticker_disp = str(row["Ticker"])[:11]
        lines.append(
            f"{ticker_disp:<12} {pe_s:>6} {roe_s:>7} {det_s:>9} {sc_s:>7} {rec}"
        )

    table = "\n".join(lines)
    return f"```\nClawdbot PEA Screener\n{table}\n```"


def send_telegram(token: str, chat_id: str, message: str) -> None:
    """POST message to Telegram Bot API."""
    import requests

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "MarkdownV2",
    }
    resp = requests.post(url, json=payload, timeout=15)
    resp.raise_for_status()


# ---------------------------------------------------------------------------
# Console
# ---------------------------------------------------------------------------

def to_console(df: pd.DataFrame) -> None:
    """Print a formatted table to stdout."""
    if df.empty:
        print("Aucune action trouvée.")
        return

    order = {"ACHETER": 0, "Surveiller": 1, "Neutre": 2, "Eviter": 3, "Données insuffisantes": 4}
    df = df.copy()
    df["_ord"] = df["Recommandation"].map(order).fillna(9)
    df = df.sort_values(["_ord", "Score"], ascending=[True, False]).drop(columns="_ord")

    pd.set_option("display.max_rows", 200)
    pd.set_option("display.width", 120)
    pd.set_option("display.float_format", "{:.3f}".format)
    print("\n=== Clawdbot PEA Screener ===")
    print(df.to_string(index=False))
    print()


# ---------------------------------------------------------------------------
# CSV
# ---------------------------------------------------------------------------

def to_csv(df: pd.DataFrame, path: str) -> None:
    df.to_csv(path, index=False)
    print(f"Résultats exportés → {path}")
