"""
Calcul des edges value vs growth pour chaque action PEA.

Un "edge" représente l'écart entre la valeur intrinsèque estimée
et le cours actuel. Plusieurs méthodes sont combinées:

  1. Graham Number     → valeur plancher value
  2. DCF simplifié     → valeur intrinsèque croissance
  3. Relative value    → comparaison sectorielle P/E & P/B
  4. Momentum score    → 52w range + RSI simplifié
  5. Analyst upside    → consensus analyste

Score final = moyenne pondérée → alerte si > MIN_EDGE_PCT
"""
from __future__ import annotations

import logging
import math
from dataclasses import dataclass, field, asdict
from typing import Optional

import numpy as np
import pandas as pd
import yfinance as yf

from config import MIN_EDGE_PCT

logger = logging.getLogger(__name__)

# ── Constantes ────────────────────────────────────────────────────────────────
RISK_FREE_RATE = 0.035      # OAT 10 ans ~3.5%
MARKET_PREMIUM = 0.055      # prime de risque marché
TERMINAL_GROWTH = 0.025     # croissance terminale (inflation EU)
DCF_YEARS = 10              # horizon DCF
GRAHAM_CONST = 22.5         # constante Graham (√(PE*PB) ≤ 22.5)

# Pondérations des méthodes pour le score final
WEIGHTS = {
    "graham_edge": 0.20,
    "dcf_edge": 0.30,
    "relative_edge": 0.20,
    "analyst_edge": 0.20,
    "momentum_score": 0.10,
}


@dataclass
class StockEdge:
    ticker: str
    name: str = ""
    price: float = 0.0

    # Méthodes individuelles (en %)
    graham_edge: Optional[float] = None     # (graham_value - price) / price * 100
    dcf_edge: Optional[float] = None        # (dcf_value - price) / price * 100
    relative_edge: Optional[float] = None   # discount vs médiane sectorielle
    analyst_edge: Optional[float] = None    # upside vs target analyste
    momentum_score: Optional[float] = None  # -100..+100

    # Score composite
    composite_edge: float = 0.0
    edge_type: str = "neutral"              # "value" | "growth" | "neutral"
    is_opportunity: bool = False

    # Données brutes
    graham_value: Optional[float] = None
    dcf_value: Optional[float] = None
    pe_ratio: Optional[float] = None
    roe_pct: Optional[float] = None
    pb_ratio: Optional[float] = None
    eps: Optional[float] = None
    eps_growth_est: Optional[float] = None
    beta: Optional[float] = None
    details: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return asdict(self)


# ── Méthodes de valorisation ──────────────────────────────────────────────────

def _graham_number(eps: float, book_value_per_share: float) -> Optional[float]:
    """
    Graham Number = √(22.5 × EPS × BVPS)
    Valeur plancher pour une action value.
    """
    if eps > 0 and book_value_per_share > 0:
        return math.sqrt(GRAHAM_CONST * eps * book_value_per_share)
    return None


def _dcf_value(
    eps: float,
    growth_rate: float,
    beta: float,
    years: int = DCF_YEARS,
) -> Optional[float]:
    """
    DCF sur `years` ans avec actualisation CAPM.
    Valeur terminale = Gordon Growth Model.
    """
    if eps <= 0:
        return None
    # Coût des fonds propres (CAPM)
    ke = RISK_FREE_RATE + beta * MARKET_PREMIUM
    ke = max(ke, 0.06)   # plancher 6%

    # Phase 1 : croissance explicite
    pv = 0.0
    for t in range(1, years + 1):
        # Décroissance linéaire du taux vers la croissance terminale
        g_t = growth_rate - (growth_rate - TERMINAL_GROWTH) * (t / years)
        g_t = max(g_t, TERMINAL_GROWTH)
        cashflow = eps * (1 + g_t) ** t
        pv += cashflow / (1 + ke) ** t

    # Phase 2 : valeur terminale
    terminal_eps = eps * (1 + growth_rate) ** years
    terminal_value = terminal_eps * (1 + TERMINAL_GROWTH) / (ke - TERMINAL_GROWTH)
    pv_terminal = terminal_value / (1 + ke) ** years

    return round(pv + pv_terminal, 2)


def _momentum_score(price: float, high_52w: float, low_52w: float) -> float:
    """
    Score momentum -100..+100.
    -100 = au plus haut 52w (sur-acheté)
    +100 = au plus bas 52w (sur-vendu — opportunité)
    """
    if high_52w <= low_52w or price <= 0:
        return 0.0
    position = (price - low_52w) / (high_52w - low_52w)  # 0..1
    return round((1 - position) * 200 - 100, 1)          # +100..-100


def _relative_valuation_edge(
    pe: float,
    pb: float,
    sector_median_pe: float,
    sector_median_pb: float,
) -> float:
    """
    Discount/premium par rapport à la médiane sectorielle.
    Positif = moins cher que le secteur.
    """
    pe_edge = (sector_median_pe - pe) / sector_median_pe * 100 if sector_median_pe > 0 else 0
    pb_edge = (sector_median_pb - pb) / sector_median_pb * 100 if sector_median_pb > 0 else 0
    return round((pe_edge + pb_edge) / 2, 2)


# ── Médianes sectorielles (base historique Euronext) ─────────────────────────
SECTOR_MEDIANS: dict[str, dict] = {
    "Technology": {"pe": 22.0, "pb": 4.5},
    "Financial Services": {"pe": 11.0, "pb": 1.2},
    "Consumer Cyclical": {"pe": 15.0, "pb": 2.0},
    "Consumer Defensive": {"pe": 18.0, "pb": 3.5},
    "Healthcare": {"pe": 20.0, "pb": 4.0},
    "Industrials": {"pe": 14.0, "pb": 2.2},
    "Energy": {"pe": 10.0, "pb": 1.5},
    "Utilities": {"pe": 13.0, "pb": 1.3},
    "Basic Materials": {"pe": 12.0, "pb": 1.8},
    "Real Estate": {"pe": 16.0, "pb": 1.0},
    "Communication Services": {"pe": 17.0, "pb": 2.5},
    "DEFAULT": {"pe": 15.0, "pb": 2.0},
}


def _get_sector_medians(sector: str) -> dict:
    return SECTOR_MEDIANS.get(sector, SECTOR_MEDIANS["DEFAULT"])


# ── Calcul principal ──────────────────────────────────────────────────────────

def compute_stock_edge(row: pd.Series) -> StockEdge:
    """Calcule tous les edges pour une ligne du DataFrame fondamentaux."""
    ticker = row.get("ticker", "")
    price = row.get("price") or 0.0
    edge = StockEdge(ticker=ticker, name=row.get("name", ticker), price=price)

    if price <= 0:
        return edge

    # Données brutes
    eps = row.get("eps") or (price / row["pe_ratio"] if row.get("pe_ratio") and row["pe_ratio"] > 0 else None)
    pb = row.get("pb_ratio")
    pe = row.get("pe_ratio")
    roe = row.get("roe_pct") or 0.0
    beta = row.get("beta") or 1.0
    bvps = (price / pb) if pb and pb > 0 else None  # price = pb * bvps → bvps = price/pb
    growth = row.get("earnings_growth_yoy") or row.get("revenue_growth_yoy") or 0.05
    growth = min(max(float(growth), -0.30), 0.50)   # clamp -30%..+50%

    edge.pe_ratio = pe
    edge.pb_ratio = pb
    edge.roe_pct = roe
    edge.eps = eps
    edge.beta = beta
    edge.eps_growth_est = growth

    # 1. Graham Number
    if eps and bvps:
        gn = _graham_number(eps, bvps)
        if gn:
            edge.graham_value = round(gn, 2)
            edge.graham_edge = round((gn - price) / price * 100, 2)

    # 2. DCF
    if eps:
        dcf = _dcf_value(eps, growth, beta)
        if dcf:
            edge.dcf_value = dcf
            edge.dcf_edge = round((dcf - price) / price * 100, 2)

    # 3. Relative valuation vs secteur
    sector = row.get("sector", "DEFAULT")
    if pe and pb:
        meds = _get_sector_medians(sector)
        edge.relative_edge = _relative_valuation_edge(pe, pb, meds["pe"], meds["pb"])

    # 4. Analyst upside
    analyst_target = row.get("analyst_target")
    if analyst_target and analyst_target > 0:
        edge.analyst_edge = round((analyst_target - price) / price * 100, 2)

    # 5. Momentum
    high_52w = row.get("52w_high")
    low_52w = row.get("52w_low")
    if high_52w and low_52w:
        edge.momentum_score = _momentum_score(price, high_52w, low_52w)

    # Score composite pondéré
    composite = 0.0
    total_weight = 0.0
    for method, weight in WEIGHTS.items():
        val = getattr(edge, method, None)
        if val is not None:
            composite += val * weight
            total_weight += weight

    edge.composite_edge = round(composite / total_weight, 2) if total_weight > 0 else 0.0

    # Classification
    if edge.composite_edge >= MIN_EDGE_PCT:
        edge.edge_type = "value" if (pe or 99) < 15 else "growth"
        edge.is_opportunity = True
    elif edge.composite_edge <= -MIN_EDGE_PCT:
        edge.edge_type = "overvalued"
    else:
        edge.edge_type = "neutral"

    edge.details = {
        "sector": sector,
        "growth_rate_used": f"{growth*100:.1f}%",
        "cost_of_equity": f"{(RISK_FREE_RATE + beta * MARKET_PREMIUM)*100:.2f}%",
    }

    return edge


def compute_edges(fundamentals: pd.DataFrame) -> pd.DataFrame:
    """
    Applique compute_stock_edge sur tout le DataFrame.
    Retourne un DataFrame trié par composite_edge décroissant.
    """
    if fundamentals.empty:
        return pd.DataFrame()

    # Enrichir avec EPS si absent
    if "eps" not in fundamentals.columns:
        fundamentals = fundamentals.copy()
        fundamentals["eps"] = None

    edges = [compute_stock_edge(row) for _, row in fundamentals.iterrows()]
    df = pd.DataFrame([e.to_dict() for e in edges])
    df = df.sort_values("composite_edge", ascending=False).reset_index(drop=True)

    opportunities = df[df["is_opportunity"]].shape[0]
    logger.info(
        "Edge calculator: %d actions analysées, %d opportunités (edge > %.1f%%)",
        len(df), opportunities, MIN_EDGE_PCT,
    )
    return df


# ── Classe façade ─────────────────────────────────────────────────────────────

class EdgeCalculator:
    """Façade haut niveau pour l'analyse d'edge."""

    def __init__(self, fundamentals: pd.DataFrame):
        self.fundamentals = fundamentals
        self._edges_df: pd.DataFrame | None = None

    def run(self) -> pd.DataFrame:
        self._edges_df = compute_edges(self.fundamentals)
        return self._edges_df

    @property
    def opportunities(self) -> pd.DataFrame:
        if self._edges_df is None:
            self.run()
        return self._edges_df[self._edges_df["is_opportunity"]].copy()

    def summary(self) -> dict:
        if self._edges_df is None:
            self.run()
        df = self._edges_df
        return {
            "total_analyzed": len(df),
            "opportunities": len(df[df["is_opportunity"]]),
            "value_plays": len(df[df["edge_type"] == "value"]),
            "growth_plays": len(df[df["edge_type"] == "growth"]),
            "overvalued": len(df[df["edge_type"] == "overvalued"]),
            "avg_composite_edge": round(df["composite_edge"].mean(), 2),
            "top3": df.head(3)[["ticker", "name", "composite_edge", "edge_type"]].to_dict("records"),
        }
