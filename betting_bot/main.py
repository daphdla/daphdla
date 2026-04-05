"""
Sports Betting Mispricing Bot — Main Orchestrator
=================================================

Modes:
  python main.py --live          Continuous scanning loop (every 5 min)
  python main.py --once          Single scan, print results, exit
  python main.py --backtest      Run backtest on historical data
  python main.py --train         Train XGBoost model on historical data
  python main.py --generate-data Generate synthetic historical data for demo

Environment variables (see .env.example):
  ODDS_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
  DISCORD_WEBHOOK_URL, BANKROLL
"""
from __future__ import annotations

import argparse
import asyncio
import logging
import sys
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path

# ── Bootstrap path so sub-modules can import from project root ────────────────
sys.path.insert(0, str(Path(__file__).parent))

from config import POLL_INTERVAL, MISPRICING_THRESHOLD, BANKROLL
from scraper.misprice_scraper import scrape_misprice_app
from scraper.odds_api import get_all_odds
from scraper.polymarket import get_active_markets
from analysis.mispricing import MispricingDetector, MispricingAlert
from analysis.backtest import Backtester
from models.xgboost_model import XGBBetModel
from alerts import telegram_bot, discord_bot

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("main")

# Track already-alerted event IDs to avoid duplicates within a session
_alerted_ids: set[str] = set()


# ── Core scan cycle ───────────────────────────────────────────────────────────

async def run_scan(detector: MispricingDetector) -> list[MispricingAlert]:
    """
    Fetch data from all sources, run mispricing detection,
    and return a list of new alerts (not yet sent this session).
    """
    logger.info("Starting scan …")
    scan_start = datetime.now(timezone.utc)

    # 1. Fetch odds from The Odds API
    logger.info("Fetching sportsbook odds …")
    odds_events = get_all_odds()

    # 2. Fetch Polymarket prediction markets
    logger.info("Fetching Polymarket markets …")
    poly_markets = get_active_markets(limit=200, min_volume=500)

    # 3. Try misprice.app (Playwright scrape — may fail silently)
    logger.info("Trying misprice.app scrape …")
    misprice_rows = await scrape_misprice_app()
    if misprice_rows:
        logger.info("misprice.app: %d rows scraped", len(misprice_rows))

    # 4. Detect mispricings
    all_alerts = detector.detect_from_odds_events(odds_events, poly_markets)

    # 5. Also process misprice.app rows as extra signals
    for row in misprice_rows:
        if abs(row.edge) >= MISPRICING_THRESHOLD:
            from models.kelly import kelly_bet
            k = kelly_bet(row.market_prob, row.book_odds, bankroll=BANKROLL)
            alert = MispricingAlert(
                event_id=f"misprice_{hash(row.event)}",
                event_name=row.event,
                sport=row.sport,
                side="yes",
                commence_time="",
                book_decimal_odds=row.book_odds,
                book_implied_prob=row.book_implied_prob,
                true_prob=row.market_prob,
                edge=row.edge,
                kelly=k,
                source_book=row.source_book if hasattr(row, "source_book") else "",
                prediction_market_prob=row.market_prob,
                num_books=1,
            )
            all_alerts.append(alert)

    # Filter out already-alerted
    new_alerts = [a for a in all_alerts if a.event_id not in _alerted_ids]
    _alerted_ids.update(a.event_id for a in new_alerts)

    elapsed = (datetime.now(timezone.utc) - scan_start).total_seconds()
    logger.info(
        "Scan complete in %.1fs — %d total, %d new mispricings",
        elapsed, len(all_alerts), len(new_alerts),
    )
    return new_alerts


async def send_alerts(alerts: list[MispricingAlert], scan_time: str = "") -> None:
    """Dispatch alerts to Telegram and Discord."""
    if not alerts:
        return

    # Send individual alerts for top 5 (avoid spam)
    top = sorted(alerts, key=lambda a: a.edge, reverse=True)[:5]
    for alert in top:
        logger.info(alert.summary)
        await telegram_bot.send_alert_async(alert)
        discord_bot.send_alert(alert)

    # Send digest summary for all alerts
    await telegram_bot.send_summary_async(alerts, scan_time=scan_time)
    discord_bot.send_summary(alerts, scan_time=scan_time)


# ── Modes ─────────────────────────────────────────────────────────────────────

async def mode_once(detector: MispricingDetector) -> None:
    """Single scan, print results to stdout, exit."""
    alerts = await run_scan(detector)
    if not alerts:
        print("\nNo mispricings found above threshold.")
        return

    print(f"\n{'='*60}")
    print(f"  {len(alerts)} MISPRICINGS DETECTED")
    print(f"{'='*60}\n")
    for alert in alerts:
        print(alert.summary)
        print()

    await send_alerts(alerts, scan_time=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"))


async def mode_live(detector: MispricingDetector) -> None:
    """Continuous scanning loop — polls every POLL_INTERVAL seconds."""
    logger.info("Starting live mode (interval=%ds, threshold=%.1f%%)", POLL_INTERVAL, MISPRICING_THRESHOLD * 100)
    while True:
        try:
            alerts = await run_scan(detector)
            scan_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
            await send_alerts(alerts, scan_time=scan_time)
        except Exception as exc:
            msg = traceback.format_exc()
            logger.error("Scan error: %s", exc)
            discord_bot.send_error_notification(msg)

        logger.info("Sleeping %d seconds until next scan …", POLL_INTERVAL)
        await asyncio.sleep(POLL_INTERVAL)


def mode_backtest(args) -> None:
    """Run historical backtest."""
    import pandas as pd

    data_path = Path(args.data)
    if not data_path.exists():
        logger.error("Data file not found: %s", data_path)
        logger.info("Generate synthetic data with: python main.py --generate-data")
        sys.exit(1)

    df = pd.read_csv(data_path)
    bt = Backtester(
        threshold=args.threshold,
        kelly_fraction=args.kelly,
    )
    result = bt.run(df, initial_bankroll=args.bankroll)
    print(result.summary())

    if not result.bet_log.empty:
        print("\nTop 10 bets by profit:")
        top = result.bet_log.nlargest(10, "profit")[
            ["event", "sport", "decimal_odds", "true_prob", "edge", "stake", "profit"]
        ]
        print(top.to_string(index=False))

        out_path = Path("data/historical/backtest_results.csv")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        result.bet_log.to_csv(out_path, index=False)
        logger.info("Full bet log saved to %s", out_path)

    if args.plot:
        save = Path(args.save_plot) if args.save_plot else None
        bt.plot(result, save_path=save)


def mode_train(args) -> None:
    """Train XGBoost model on historical data."""
    import pandas as pd

    data_path = Path(args.data)
    if not data_path.exists():
        logger.error("Data file not found: %s", data_path)
        sys.exit(1)

    df = pd.read_csv(data_path)
    model = XGBBetModel()
    metrics = model.train(df)
    model.save()

    print("\n=== XGBoost Training Metrics ===")
    for k, v in metrics.items():
        print(f"  {k}: {v:.4f}" if isinstance(v, float) else f"  {k}: {v}")

    print("\n=== Feature Importance ===")
    print(model.feature_importance().to_string(index=False))


def mode_generate_data() -> None:
    """
    Generate synthetic historical bet data for demo/testing.
    Simulates 500 bets with realistic distributions.
    """
    import numpy as np
    import pandas as pd

    rng = np.random.default_rng(42)
    n = 500

    sports = ["americanfootball_nfl", "basketball_nba", "baseball_mlb", "soccer_epl"]
    book_implied = rng.uniform(0.35, 0.70, n)
    # True probability slightly higher (our edge assumption)
    edge_noise = rng.normal(0.03, 0.04, n)
    true_prob   = np.clip(book_implied + edge_noise, 0.05, 0.95)
    decimal_odds = np.clip(1.0 / book_implied, 1.1, 8.0)

    # Simulate outcomes based on true probability
    outcomes = rng.binomial(1, true_prob, n)

    # Timestamps: 2024 calendar year
    from datetime import timedelta
    base = datetime(2024, 1, 1, tzinfo=timezone.utc)
    dates = [base + timedelta(hours=int(h)) for h in rng.integers(0, 365 * 24, n)]
    dates.sort()

    df = pd.DataFrame({
        "commence_time":    [d.isoformat() for d in dates],
        "event_name":       [f"Team A vs Team B #{i}" for i in range(n)],
        "sport":            rng.choice(sports, n),
        "side":             rng.choice(["home", "away"], n),
        "book_decimal_odds": np.round(decimal_odds, 3),
        "book_implied_prob": np.round(book_implied, 4),
        "true_prob":         np.round(true_prob, 4),
        "polymarket_prob":   np.round(true_prob + rng.normal(0, 0.01, n), 4).clip(0.01, 0.99),
        "edge":              np.round(true_prob - book_implied, 4),
        "implied_prob_book": np.round(book_implied, 4),
        "implied_prob_market": np.round(true_prob, 4),
        "spread":            np.round(rng.uniform(0.1, 0.5, n), 3),
        "volume_usd":        np.round(rng.exponential(5000, n), 0),
        "time_to_event_hours": np.round(rng.uniform(0.5, 120, n), 1),
        "num_books_offering": rng.integers(3, 15, n),
        "best_book_odds":    np.round(decimal_odds * rng.uniform(0.98, 1.02, n), 3),
        "worst_book_odds":   np.round(decimal_odds * rng.uniform(0.90, 0.98, n), 3),
        "outcome":           outcomes,
    })

    out_path = Path("data/historical/bets.csv")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_path, index=False)
    logger.info("Generated %d synthetic bets → %s", n, out_path)
    print(f"Data saved to {out_path}")
    print(f"Columns: {list(df.columns)}")
    print(f"Hit rate: {df['outcome'].mean():.1%}")
    print(f"Avg edge: {df['edge'].mean():.2%}")


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sports Betting Mispricing Bot",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )

    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--live",          action="store_true", help="Continuous scanning loop")
    mode.add_argument("--once",          action="store_true", help="Single scan and exit")
    mode.add_argument("--backtest",      action="store_true", help="Run historical backtest")
    mode.add_argument("--train",         action="store_true", help="Train XGBoost model")
    mode.add_argument("--generate-data", action="store_true", help="Generate synthetic demo data")

    parser.add_argument("--data",       default="data/historical/bets.csv", help="CSV path for backtest/train")
    parser.add_argument("--bankroll",   type=float, default=BANKROLL)
    parser.add_argument("--threshold",  type=float, default=MISPRICING_THRESHOLD)
    parser.add_argument("--kelly",      type=float, default=0.25)
    parser.add_argument("--plot",       action="store_true", help="Show backtest plot")
    parser.add_argument("--save-plot",  type=str,   default="", help="Save plot to path")
    parser.add_argument("--use-model",  action="store_true", help="Load XGBoost model for detection")

    args = parser.parse_args()

    if args.generate_data:
        mode_generate_data()
        return

    if args.backtest:
        mode_backtest(args)
        return

    if args.train:
        mode_train(args)
        return

    # Load model if available and requested
    model = None
    if args.use_model:
        try:
            model = XGBBetModel.load()
            logger.info("XGBoost model loaded")
        except FileNotFoundError:
            logger.warning("No trained model found — using market probabilities as fallback")

    detector = MispricingDetector(threshold=args.threshold, model=model)

    if args.once:
        asyncio.run(mode_once(detector))
    elif args.live:
        asyncio.run(mode_live(detector))


if __name__ == "__main__":
    main()
