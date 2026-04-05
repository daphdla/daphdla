"""
Alertes Telegram pour opportunités PEA.

Fonctionnalités:
  • Alerte immédiate quand composite_edge > MIN_EDGE_PCT
  • Rapport hebdomadaire (top 5 actions)
  • Rapport backtest avec métriques
  • Anti-spam : cooldown par ticker (configurable)
  • Formatage Markdown avancé avec emojis financiers
"""
from __future__ import annotations

import json
import logging
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import requests

from config import (
    TELEGRAM_TOKEN,
    TELEGRAM_CHAT_ID,
    MIN_EDGE_PCT,
    ALERT_COOLDOWN_HOURS,
    ALERTS_LOG,
)

logger = logging.getLogger(__name__)

TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"
TELEGRAM_PARSE_MODE = "MarkdownV2"


# ── Helpers ───────────────────────────────────────────────────────────────────

def _escape_md(text: str) -> str:
    """Échappe les caractères spéciaux MarkdownV2."""
    special = r"\_*[]()~`>#+-=|{}.!"
    for ch in special:
        text = text.replace(ch, f"\\{ch}")
    return text


def _send_message(text: str, token: str = TELEGRAM_TOKEN, chat_id: str = TELEGRAM_CHAT_ID) -> bool:
    """Envoie un message Telegram. Retourne True si succès."""
    if not token or not chat_id:
        logger.warning("TELEGRAM_TOKEN ou TELEGRAM_CHAT_ID non configuré — simulation")
        logger.info("--- MESSAGE SIMULÉ ---\n%s\n---", text)
        return True

    url = TELEGRAM_API.format(token=token)
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }
    for attempt in range(3):
        try:
            resp = requests.post(url, json=payload, timeout=10)
            resp.raise_for_status()
            return True
        except Exception as exc:
            wait = 2 ** attempt
            logger.warning("Telegram send fail %d: %s", attempt + 1, exc)
            time.sleep(wait)
    return False


# ── Gestion du cooldown (anti-spam) ──────────────────────────────────────────

def _load_alerts_log() -> dict:
    try:
        with open(ALERTS_LOG) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _save_alerts_log(log: dict) -> None:
    with open(ALERTS_LOG, "w") as f:
        json.dump(log, f, indent=2)


def _is_on_cooldown(ticker: str) -> bool:
    log = _load_alerts_log()
    last_alert = log.get(ticker)
    if not last_alert:
        return False
    last_dt = datetime.fromisoformat(last_alert)
    return datetime.now() - last_dt < timedelta(hours=ALERT_COOLDOWN_HOURS)


def _mark_alerted(ticker: str) -> None:
    log = _load_alerts_log()
    log[ticker] = datetime.now().isoformat()
    _save_alerts_log(log)


# ── Formatage des messages ────────────────────────────────────────────────────

def _format_opportunity_message(edge_row: dict) -> str:
    """
    Formate un message HTML Telegram pour une opportunité détectée.
    """
    ticker = edge_row.get("ticker", "?")
    name = edge_row.get("name", ticker)
    price = edge_row.get("price", 0)
    edge = edge_row.get("composite_edge_adjusted") or edge_row.get("composite_edge", 0)
    edge_type = edge_row.get("edge_type", "neutral")
    pe = edge_row.get("pe_ratio")
    roe = edge_row.get("roe_pct")
    analyst_target = edge_row.get("analyst_target")
    analyst_edge = edge_row.get("analyst_edge")
    graham_value = edge_row.get("graham_value")
    dcf_value = edge_row.get("dcf_value")
    github_votes = edge_row.get("github_votes", 0)

    # Icône selon le type
    icon_map = {"value": "💎", "growth": "🚀", "neutral": "📊", "overvalued": "⚠️"}
    icon = icon_map.get(edge_type, "📊")

    edge_pct_str = f"+{edge:.1f}%" if edge > 0 else f"{edge:.1f}%"

    lines = [
        f"<b>{icon} OPPORTUNITÉ PEA DÉTECTÉE</b>",
        f"",
        f"<b>Action :</b> {name} (<code>{ticker}</code>)",
        f"<b>Type :</b> {edge_type.upper()}",
        f"<b>Edge composite :</b> <b>{edge_pct_str}</b>",
        f"<b>Cours actuel :</b> {price:.2f} €",
    ]

    if pe:
        lines.append(f"<b>P/E :</b> {pe:.1f}x")
    if roe:
        lines.append(f"<b>ROE :</b> {roe:.1f}%")
    if graham_value:
        lines.append(f"<b>Graham Number :</b> {graham_value:.2f} €")
    if dcf_value:
        lines.append(f"<b>Valeur DCF :</b> {dcf_value:.2f} €")
    if analyst_target and analyst_edge is not None:
        lines.append(f"<b>Target analyste :</b> {analyst_target:.2f} € ({analyst_edge:+.1f}%)")
    if github_votes > 0:
        lines.append(f"<b>Mentions GitHub :</b> {github_votes} repos")

    lines += [
        f"",
        f"<i>Seuil alerte : edge &gt; {MIN_EDGE_PCT}%</i>",
        f"<i>{datetime.now().strftime('%d/%m/%Y %H:%M')}</i>",
        f"",
        f"⚠️ <i>Ceci n'est pas un conseil d'investissement.</i>",
    ]

    return "\n".join(lines)


def _format_weekly_report(top_stocks: list[dict]) -> str:
    """Formate le rapport hebdomadaire top 5."""
    lines = [
        f"<b>📈 RAPPORT HEBDOMADAIRE PEA BOT</b>",
        f"<i>{datetime.now().strftime('%d/%m/%Y')}</i>",
        f"",
        f"<b>Top {min(5, len(top_stocks))} opportunités de la semaine :</b>",
        f"",
    ]

    for i, stock in enumerate(top_stocks[:5], 1):
        ticker = stock.get("ticker", "?")
        name = stock.get("name", ticker)
        edge = stock.get("composite_edge_adjusted") or stock.get("composite_edge", 0)
        edge_type = stock.get("edge_type", "neutral")
        price = stock.get("price", 0)
        pe = stock.get("pe_ratio")
        roe = stock.get("roe_pct")

        icon = {"value": "💎", "growth": "🚀"}.get(edge_type, "📊")
        lines.append(
            f"{i}. {icon} <b>{name}</b> (<code>{ticker}</code>)\n"
            f"   Edge: <b>{edge:+.1f}%</b> | Prix: {price:.2f}€"
            + (f" | P/E: {pe:.1f}" if pe else "")
            + (f" | ROE: {roe:.1f}%" if roe else "")
        )

    lines += [
        f"",
        f"<i>Powered by PEA Bot 🤖</i>",
        f"⚠️ <i>Non-conseil en investissement.</i>",
    ]
    return "\n".join(lines)


def _format_backtest_report(result_dict: dict) -> str:
    """Formate le rapport de backtest."""
    r = result_dict
    lines = [
        f"<b>🔬 RÉSULTATS BACKTEST PEA</b>",
        f"",
        f"<b>Stratégie :</b> {r.get('strategy', '?')}",
        f"<b>Période :</b> {r.get('start_date', '?')} → {r.get('end_date', '?')}",
        f"",
        f"<b>Performance :</b>",
        f"  • Capital final : <b>{r.get('final_value', 0):,.0f} €</b>",
        f"  • Rendement total : <b>{r.get('total_return_pct', 0):+.2f}%</b>",
        f"  • CAGR : <b>{r.get('cagr_pct', 0):+.2f}%</b>",
        f"  • Benchmark CAC40 : {r.get('benchmark_return_pct', 0):+.2f}%",
        f"  • Alpha : <b>{r.get('alpha_pct', 0):+.2f}%</b>",
        f"",
        f"<b>Risque :</b>",
        f"  • Sharpe : {r.get('sharpe_ratio', 0):.2f}",
        f"  • Max Drawdown : {r.get('max_drawdown_pct', 0):.2f}%",
        f"  • Volatilité : {r.get('volatility_pct', 0):.2f}%",
        f"  • Calmar : {r.get('calmar_ratio', 0):.2f}",
        f"  • Beta : {r.get('beta', 0):.2f}",
        f"",
        f"<b>Trades :</b> {r.get('nb_trades', 0)} | Win rate: {r.get('win_rate_pct', 0):.1f}%",
        f"",
        f"<i>{datetime.now().strftime('%d/%m/%Y %H:%M')}</i>",
    ]
    return "\n".join(lines)


# ── API publique ──────────────────────────────────────────────────────────────

def send_opportunity_alert(edge_row: dict) -> bool:
    """
    Envoie une alerte Telegram pour une opportunité.
    Respecte le cooldown anti-spam par ticker.
    """
    ticker = edge_row.get("ticker", "?")
    edge = edge_row.get("composite_edge_adjusted") or edge_row.get("composite_edge", 0)

    if edge < MIN_EDGE_PCT:
        logger.debug("Edge insuffisant pour %s: %.1f%%", ticker, edge)
        return False

    if _is_on_cooldown(ticker):
        logger.info("Ticker %s en cooldown, alerte ignorée", ticker)
        return False

    message = _format_opportunity_message(edge_row)
    success = _send_message(message)

    if success:
        _mark_alerted(ticker)
        logger.info("Alerte envoyée: %s (edge=%.1f%%)", ticker, edge)

    return success


def send_weekly_report(top_stocks: list[dict]) -> bool:
    """Envoie le rapport hebdomadaire."""
    if not top_stocks:
        return False
    message = _format_weekly_report(top_stocks)
    return _send_message(message)


def send_backtest_report(result_dict: dict) -> bool:
    """Envoie les résultats du backtest sur Telegram."""
    message = _format_backtest_report(result_dict)
    return _send_message(message)


def send_error_alert(error_msg: str) -> bool:
    """Notifie d'une erreur critique du bot."""
    message = (
        f"<b>🚨 PEA BOT — ERREUR</b>\n\n"
        f"<code>{error_msg[:500]}</code>\n\n"
        f"<i>{datetime.now().strftime('%d/%m/%Y %H:%M')}</i>"
    )
    return _send_message(message)


# ── Classe façade ─────────────────────────────────────────────────────────────

class TelegramAlerter:
    """Façade orientée objet pour les alertes Telegram."""

    def __init__(self, token: str = TELEGRAM_TOKEN, chat_id: str = TELEGRAM_CHAT_ID):
        self.token = token
        self.chat_id = chat_id
        self._sent: list[str] = []

    def alert_opportunities(self, edges_df) -> int:
        """Envoie des alertes pour toutes les opportunités du DataFrame."""
        import pandas as pd
        if isinstance(edges_df, pd.DataFrame):
            opps = edges_df[edges_df["is_opportunity"]].to_dict("records")
        else:
            opps = edges_df

        sent = 0
        for row in opps:
            if send_opportunity_alert(row):
                sent += 1
                self._sent.append(row.get("ticker", "?"))
        return sent

    def weekly_report(self, edges_df) -> bool:
        import pandas as pd
        if isinstance(edges_df, pd.DataFrame):
            top = edges_df.head(5).to_dict("records")
        else:
            top = edges_df[:5]
        return send_weekly_report(top)

    def backtest_report(self, result) -> bool:
        if hasattr(result, "to_dict"):
            return send_backtest_report(result.to_dict())
        return send_backtest_report(result)

    @property
    def sent_count(self) -> int:
        return len(self._sent)
