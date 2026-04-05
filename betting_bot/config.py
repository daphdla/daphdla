"""
Central configuration for the sports betting mispricing bot.
Copy .env.example to .env and fill in your credentials.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).parent

# ── Data Sources ──────────────────────────────────────────────────────────────
# The Odds API  https://the-odds-api.com  (free tier: 500 req/month)
ODDS_API_KEY = os.getenv("ODDS_API_KEY", "")
ODDS_API_BASE = "https://api.the-odds-api.com/v4"

# Polymarket  (public, no key required)
POLYMARKET_API_BASE = "https://clob.polymarket.com"
POLYMARKET_GAMMA_BASE = "https://gamma-api.polymarket.com"

# misprice.app  (scraped via Playwright when available)
MISPRICE_APP_URL = "https://www.misprice.app"

# ── Mispricing Detection ──────────────────────────────────────────────────────
MISPRICING_THRESHOLD = 0.04        # 4 % edge minimum to flag
MIN_LIQUIDITY_USD = 500            # ignore thin markets
MAX_ODDS_AMERICAN = 1000           # filter huge underdogs

# ── Kelly Criterion ───────────────────────────────────────────────────────────
KELLY_FRACTION = 0.25              # fractional Kelly (0.25 = quarter-Kelly)
MAX_BET_FRACTION = 0.05            # never risk >5 % of bankroll on one bet
MIN_BET_USD = 10                   # floor
BANKROLL = float(os.getenv("BANKROLL", "1000"))

# ── XGBoost Model ────────────────────────────────────────────────────────────
MODEL_PATH = BASE_DIR / "data" / "xgb_model.joblib"
FEATURE_COLS = [
    "implied_prob_book",
    "implied_prob_market",
    "spread",
    "volume_usd",
    "time_to_event_hours",
    "num_books_offering",
    "best_book_odds",
    "worst_book_odds",
    "polymarket_prob",
]
TARGET_COL = "outcome"             # 1 = bet won, 0 = lost

# ── Backtesting ───────────────────────────────────────────────────────────────
BACKTEST_START = "2024-01-01"
BACKTEST_END   = "2024-12-31"
COMMISSION_RATE = 0.02             # 2 % vig / juice estimate

# ── Alerts ───────────────────────────────────────────────────────────────────
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID   = os.getenv("TELEGRAM_CHAT_ID", "")

DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")

# Sports to monitor (Odds API sport keys)
SPORTS_TO_MONITOR = [
    "americanfootball_nfl",
    "basketball_nba",
    "baseball_mlb",
    "soccer_epl",
    "soccer_uefa_champs_league",
    "tennis_atp_french_open",
    "mma_mixed_martial_arts",
]

# Poll interval in seconds
POLL_INTERVAL = 300   # 5 minutes
