"""
Telegram alert sender for mispricing notifications.

Setup:
  1. Create a bot with @BotFather → get TELEGRAM_BOT_TOKEN
  2. Start the bot in your chat → get TELEGRAM_CHAT_ID via:
     curl https://api.telegram.org/bot<TOKEN>/getUpdates
  3. Set env vars TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Optional

from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

logger = logging.getLogger(__name__)

_PARSE_MODE = "MarkdownV2"

# Characters that must be escaped in MarkdownV2
_ESC_CHARS = r"\_*[]()~`>#+-=|{}.!"


def _escape(text: str) -> str:
    """Escape special characters for Telegram MarkdownV2."""
    for ch in _ESC_CHARS:
        text = text.replace(ch, f"\\{ch}")
    return text


def _build_alert_message(alert) -> str:
    """Build a formatted Telegram message from a MispricingAlert."""
    edge_pct = alert.edge * 100
    edge_sign = "+" if alert.edge > 0 else ""
    kelly_usd = alert.kelly.recommended_bet_usd if alert.kelly else 0

    lines = [
        "🚨 *MISPRICING ALERT*",
        "",
        f"*Event:* {_escape(alert.event_name)}",
        f"*Sport:* {_escape(alert.sport)}",
        f"*Side:*  {_escape(alert.side.upper())}",
        f"*Odds:*  `{alert.book_decimal_odds:.3f}` \\(implied {alert.book_implied_prob:.1%}\\)",
        f"*True P:* `{alert.true_prob:.1%}`",
        f"*Edge:*  `{edge_sign}{edge_pct:.2f}%`",
        f"*Bet:*   `${kelly_usd:.2f}` \\(quarter\\-Kelly\\)",
        f"*EV:*    `{alert.kelly.expected_value:+.2%}`" if alert.kelly else "",
        f"*Books:* {alert.num_books}",
        f"*Starts:* {_escape(str(alert.commence_time)[:16])}",
    ]
    return "\n".join(l for l in lines if l or l == "")


async def send_alert_async(
    alert,
    token: str = TELEGRAM_BOT_TOKEN,
    chat_id: str = TELEGRAM_CHAT_ID,
) -> bool:
    """Send a single MispricingAlert via Telegram (async)."""
    if not token or not chat_id:
        logger.warning("Telegram credentials not set — skipping alert")
        return False

    try:
        from telegram import Bot
        from telegram.error import TelegramError
    except ImportError:
        logger.warning("python-telegram-bot not installed")
        return False

    try:
        bot = Bot(token=token)
        message = _build_alert_message(alert)
        await bot.send_message(
            chat_id=chat_id,
            text=message,
            parse_mode=_PARSE_MODE,
            disable_web_page_preview=True,
        )
        logger.info("Telegram alert sent for %s", alert.event_name)
        return True
    except Exception as exc:
        logger.error("Telegram send error: %s", exc)
        return False


def send_alert(alert, **kwargs) -> bool:
    """Synchronous wrapper around send_alert_async."""
    return asyncio.run(send_alert_async(alert, **kwargs))


async def send_bulk_alerts_async(
    alerts: list,
    token: str = TELEGRAM_BOT_TOKEN,
    chat_id: str = TELEGRAM_CHAT_ID,
    delay_seconds: float = 1.5,
) -> int:
    """Send multiple alerts with rate-limit delay. Returns number sent."""
    sent = 0
    for alert in alerts:
        ok = await send_alert_async(alert, token=token, chat_id=chat_id)
        if ok:
            sent += 1
        await asyncio.sleep(delay_seconds)
    return sent


async def send_summary_async(
    alerts: list,
    scan_time: str = "",
    token: str = TELEGRAM_BOT_TOKEN,
    chat_id: str = TELEGRAM_CHAT_ID,
) -> bool:
    """Send a concise summary message listing all current mispricings."""
    if not token or not chat_id:
        return False

    try:
        from telegram import Bot
    except ImportError:
        return False

    if not alerts:
        return True  # nothing to send

    lines = [
        f"📊 *SCAN COMPLETE* — {_escape(scan_time)}",
        f"Found *{len(alerts)}* mispricings \\(edge ≥ 4%\\)",
        "",
    ]
    for i, a in enumerate(alerts[:10], 1):
        edge_str = f"{a.edge*100:+.1f}%"
        bet_str = f"${a.kelly.recommended_bet_usd:.0f}" if a.kelly else "—"
        odds_str = f"{a.book_decimal_odds:.2f}"
        lines.append(
            f"{i}\\. {_escape(a.event_name[:30])} | "
            f"`{_escape(odds_str)}` | "
            f"edge `{_escape(edge_str)}` | bet `{_escape(bet_str)}`"
        )

    if len(alerts) > 10:
        lines.append(f"_\\.\\.\\. and {len(alerts) - 10} more_")

    try:
        bot = Bot(token=token)
        await bot.send_message(
            chat_id=chat_id,
            text="\n".join(lines),
            parse_mode=_PARSE_MODE,
            disable_web_page_preview=True,
        )
        return True
    except Exception as exc:
        logger.error("Telegram summary error: %s", exc)
        return False


def send_summary(alerts: list, **kwargs) -> bool:
    """Synchronous wrapper for send_summary_async."""
    return asyncio.run(send_summary_async(alerts, **kwargs))
