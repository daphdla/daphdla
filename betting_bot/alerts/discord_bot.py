"""
Discord alert sender for mispricing notifications.

Setup:
  1. In your Discord server: Edit Channel → Integrations → Webhooks → New Webhook
  2. Copy the webhook URL → set DISCORD_WEBHOOK_URL in .env

No bot token needed — uses incoming webhooks only.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

import requests

from config import DISCORD_WEBHOOK_URL

logger = logging.getLogger(__name__)

# Discord embed color palette
COLOR_GREEN  = 0x22C55E   # positive edge
COLOR_YELLOW = 0xEAB308   # moderate edge (4-8%)
COLOR_RED    = 0xEF4444   # high edge (>8%, unusual, verify)
COLOR_BLUE   = 0x3B82F6   # summary / info


def _edge_color(edge: float) -> int:
    if edge >= 0.08:
        return COLOR_RED
    if edge >= 0.04:
        return COLOR_GREEN
    return COLOR_YELLOW


def _build_embed(alert) -> dict:
    """Build a Discord embed dict from a MispricingAlert."""
    kelly_usd  = alert.kelly.recommended_bet_usd if alert.kelly else 0
    ev_str     = f"{alert.kelly.expected_value:+.2%}" if alert.kelly else "N/A"
    poly_str   = f"{alert.prediction_market_prob:.1%}" if alert.prediction_market_prob else "N/A"

    fields = [
        {"name": "Sport",        "value": alert.sport,                               "inline": True},
        {"name": "Side",         "value": alert.side.upper(),                        "inline": True},
        {"name": "Decimal Odds", "value": f"{alert.book_decimal_odds:.3f}",          "inline": True},
        {"name": "Implied Prob", "value": f"{alert.book_implied_prob:.1%}",          "inline": True},
        {"name": "True Prob",    "value": f"{alert.true_prob:.1%}",                  "inline": True},
        {"name": "Edge",         "value": f"{alert.edge:+.2%}",                      "inline": True},
        {"name": "Kelly Bet",    "value": f"${kelly_usd:.2f}",                       "inline": True},
        {"name": "EV",           "value": ev_str,                                    "inline": True},
        {"name": "Polymarket",   "value": poly_str,                                  "inline": True},
        {"name": "Books",        "value": str(alert.num_books),                      "inline": True},
        {"name": "Starts",       "value": str(alert.commence_time)[:16] + " UTC",    "inline": True},
    ]

    return {
        "title": f"🚨 {alert.event_name}",
        "description": f"Edge detected on the **{alert.side.upper()}**",
        "color": _edge_color(alert.edge),
        "fields": fields,
        "footer": {"text": f"Detected at {alert.detected_at[:19]} UTC"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def send_alert(
    alert,
    webhook_url: str = DISCORD_WEBHOOK_URL,
) -> bool:
    """Post a single MispricingAlert to Discord via webhook."""
    if not webhook_url:
        logger.warning("DISCORD_WEBHOOK_URL not set — skipping alert")
        return False

    payload = {
        "username": "MispricingBot",
        "avatar_url": "https://em-content.zobj.net/source/twitter/361/money-bag_1f4b0.png",
        "embeds": [_build_embed(alert)],
    }

    try:
        resp = requests.post(webhook_url, json=payload, timeout=10)
        resp.raise_for_status()
        logger.info("Discord alert sent for %s", alert.event_name)
        return True
    except requests.RequestException as exc:
        logger.error("Discord send error: %s", exc)
        return False


def send_bulk_alerts(
    alerts: list,
    webhook_url: str = DISCORD_WEBHOOK_URL,
    delay_seconds: float = 1.0,
) -> int:
    """Send multiple alerts. Returns number of successful sends."""
    import time
    sent = 0
    for alert in alerts:
        if send_alert(alert, webhook_url=webhook_url):
            sent += 1
        time.sleep(delay_seconds)
    return sent


def send_summary(
    alerts: list,
    scan_time: str = "",
    webhook_url: str = DISCORD_WEBHOOK_URL,
) -> bool:
    """Send a compact summary embed listing all current mispricings."""
    if not webhook_url:
        return False
    if not alerts:
        return True

    rows = []
    for i, a in enumerate(alerts[:15], 1):
        bet = f"${a.kelly.recommended_bet_usd:.0f}" if a.kelly else "—"
        rows.append(
            f"`{i:2d}.` {a.event_name[:28]:30s} | "
            f"odds `{a.book_decimal_odds:.2f}` | "
            f"edge `{a.edge:+.1%}` | bet `{bet}`"
        )

    extra = f"\n_+{len(alerts)-15} more_" if len(alerts) > 15 else ""

    embed = {
        "title": f"📊 Scan Complete — {scan_time}",
        "description": f"**{len(alerts)}** mispricings found (edge ≥ 4%)\n\n" + "\n".join(rows) + extra,
        "color": COLOR_BLUE,
        "footer": {"text": "MispricingBot • Kelly-sized bets • XGBoost model"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    payload = {
        "username": "MispricingBot",
        "embeds": [embed],
    }

    try:
        resp = requests.post(webhook_url, json=payload, timeout=10)
        resp.raise_for_status()
        return True
    except requests.RequestException as exc:
        logger.error("Discord summary error: %s", exc)
        return False


def send_error_notification(
    error_msg: str,
    webhook_url: str = DISCORD_WEBHOOK_URL,
) -> None:
    """Post an error notification to Discord."""
    if not webhook_url:
        return
    payload = {
        "username": "MispricingBot",
        "embeds": [{
            "title": "⚠️ Bot Error",
            "description": f"```{error_msg[:1800]}```",
            "color": 0xFF6B00,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }],
    }
    try:
        requests.post(webhook_url, json=payload, timeout=5)
    except Exception:
        pass
