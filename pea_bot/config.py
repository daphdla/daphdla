"""
Configuration centrale du bot PEA.
Charger les variables depuis .env ou les modifier directement ici.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── Telegram ──────────────────────────────────────────────────────────────────
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

# ── Filtres screening ─────────────────────────────────────────────────────────
MIN_ROE = 15.0          # ROE minimum en %
MAX_PE = 20.0           # P/E maximum
MIN_EDGE_PCT = 5.0      # Seuil d'alerte opportunité (%)
MIN_MARKET_CAP_M = 50   # Capitalisation mini en millions €

# ── Univers PEA éligible (tickers Yahoo Finance) ─────────────────────────────
# Principales valeurs françaises / européennes éligibles PEA
PEA_UNIVERSE = [
    # CAC 40
    "AI.PA", "AIR.PA", "ALO.PA", "MT.AS", "CS.PA", "BNP.PA", "EN.PA",
    "CAP.PA", "CA.PA", "ACA.PA", "BN.PA", "DSY.PA", "ENGI.PA", "EL.PA",
    "RMS.PA", "KER.PA", "OR.PA", "MC.PA", "ML.PA", "ORA.PA", "RI.PA",
    "PUB.PA", "RNO.PA", "SAF.PA", "SGO.PA", "SAN.PA", "SU.PA", "GLE.PA",
    "STLAM.MI", "STM.PA", "TEP.PA", "HO.PA", "TTE.PA", "URW.AS", "VIE.PA",
    "DG.PA", "WLN.PA",
    # SBF 120 / Mid-caps intéressants
    "ALFEN.AS", "ALMBF.PA", "AMUN.PA", "BALO.PA", "BOI.PA", "CBDG.PA",
    "COFA.PA", "DBG.PA", "EDF.PA", "ELIS.PA", "ERF.PA", "ESI.PA",
    "FGR.PA", "FNAC.PA", "GTT.PA", "HCO.PA", "IMCD.AS", "IPCO.ST",
    "LHN.SW", "LR.PA", "MRM.PA", "NEOEN.PA", "NK.PA", "OPX.PA",
    "POM.PA", "PREC.PA", "RDSA.AS", "RCO.PA", "SFCA.PA", "SMCP.PA",
    "SOLB.BR", "SPIE.PA", "TKTT.PA", "UBI.PA", "VCT.PA",
    # Euronext Growth / PME
    "ABEO.PA", "ACAN.PA", "ADES.PA", "AFER.PA", "ALDLS.PA",
]

# ── Backtest ──────────────────────────────────────────────────────────────────
BACKTEST_YEARS = 5
BACKTEST_REBALANCE = "quarterly"   # "monthly" | "quarterly" | "yearly"
BACKTEST_INITIAL_CAPITAL = 10_000  # €

# ── Scheduling ────────────────────────────────────────────────────────────────
SCAN_INTERVAL_HOURS = 6            # Fréquence de scan
ALERT_COOLDOWN_HOURS = 24          # Pas deux alertes pour le même ticker en 24h

# ── Chemins ───────────────────────────────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CACHE_FILE = os.path.join(DATA_DIR, "cache.parquet")
ALERTS_LOG = os.path.join(DATA_DIR, "alerts_log.json")
BACKTEST_RESULTS = os.path.join(DATA_DIR, "backtest_results.json")

os.makedirs(DATA_DIR, exist_ok=True)
