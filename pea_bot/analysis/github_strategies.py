"""
Analyse de repos GitHub publics sur les thèmes:
  • "PEA arbitrage"
  • "Euronext screener"
  • "French stocks value"

Pour chaque repo trouvé, on tente d'extraire:
  • Critères de filtrage (P/E, ROE, etc.)
  • Listes de tickers recommandés
  • Paramètres de stratégie (rebalancement, seuils)

Ces signaux servent de bonus qualitatif dans le score final.
"""
from __future__ import annotations

import json
import logging
import time
from typing import Optional

import requests
import pandas as pd

logger = logging.getLogger(__name__)

GITHUB_API = "https://api.github.com"
SEARCH_QUERIES = [
    "PEA arbitrage France stocks",
    "Euronext screener Python",
    "CAC40 value investing screener",
    "French stocks PEA filter ROE",
    "bourse France algorithme Python",
]

# Fichiers communs dans les repos de screener
INTERESTING_FILES = [
    "config.py", "config.json", "settings.py", "settings.json",
    "screener.py", "strategy.py", "criteria.py", "filters.py",
    "README.md", "readme.md",
]


def _github_get(url: str, token: Optional[str] = None, retries: int = 3) -> Optional[dict | list]:
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    for attempt in range(retries):
        try:
            resp = requests.get(url, headers=headers, timeout=15)
            if resp.status_code == 403:
                logger.warning("GitHub rate limit — attente 60s")
                time.sleep(60)
                continue
            resp.raise_for_status()
            return resp.json()
        except Exception as exc:
            wait = 2 ** attempt
            logger.warning("GitHub GET %s fail %d: %s", url, attempt + 1, exc)
            time.sleep(wait)
    return None


def search_repos(query: str, max_results: int = 5, token: Optional[str] = None) -> list[dict]:
    """Cherche des repos GitHub correspondant à la query."""
    url = f"{GITHUB_API}/search/repositories"
    params = f"?q={requests.utils.quote(query)}&sort=stars&order=desc&per_page={max_results}"
    data = _github_get(url + params, token)
    if not data or "items" not in data:
        return []
    return data["items"]


def fetch_file_content(owner: str, repo: str, path: str, token: Optional[str] = None) -> Optional[str]:
    """Récupère le contenu brut d'un fichier dans un repo GitHub."""
    url = f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}"
    data = _github_get(url, token)
    if not data or "content" not in data:
        return None
    import base64
    try:
        return base64.b64decode(data["content"]).decode("utf-8", errors="replace")
    except Exception:
        return None


def extract_numeric_params(content: str) -> dict:
    """
    Parse grossièrement du code Python/JSON pour extraire des paramètres numériques
    liés au screening (P/E, ROE, P/B, seuils, etc.).
    """
    import re
    params = {}
    patterns = {
        "max_pe": r"(?:max_pe|PE_MAX|pe_max|max.*pe)\s*[=:]\s*([\d.]+)",
        "min_roe": r"(?:min_roe|ROE_MIN|roe_min|min.*roe)\s*[=:]\s*([\d.]+)",
        "min_dividend": r"(?:min_div|dividend_min|yield_min)\s*[=:]\s*([\d.]+)",
        "max_pb": r"(?:max_pb|PB_MAX|pb_max)\s*[=:]\s*([\d.]+)",
        "rebalance": r"(?:rebalance|REBALANCE)\s*[=:]\s*['\"](\w+)['\"]",
        "min_market_cap": r"(?:min_cap|market_cap_min|MIN_CAP)\s*[=:]\s*([\d.]+)",
    }
    for key, pattern in patterns.items():
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            try:
                val = match.group(1)
                params[key] = float(val) if val.replace(".", "").isdigit() else val
            except Exception:
                pass

    # Chercher des listes de tickers
    ticker_pattern = r"['\"]([A-Z]{2,5}\.[A-Z]{2})['\"]"
    tickers = list(set(re.findall(ticker_pattern, content)))
    if tickers:
        params["tickers_found"] = tickers[:30]

    return params


def fetch_github_strategies(
    token: Optional[str] = None,
    max_repos_per_query: int = 3,
) -> list[dict]:
    """
    Cherche et analyse les repos GitHub pertinents.
    Retourne une liste de stratégies extraites avec leurs paramètres.
    """
    all_strategies = []
    seen_repos = set()

    for query in SEARCH_QUERIES:
        logger.info("GitHub search: %s", query)
        repos = search_repos(query, max_repos_per_query, token)

        for repo in repos:
            full_name = repo.get("full_name", "")
            if full_name in seen_repos:
                continue
            seen_repos.add(full_name)

            owner, name = full_name.split("/") if "/" in full_name else ("", full_name)
            strategy = {
                "repo": full_name,
                "stars": repo.get("stargazers_count", 0),
                "description": repo.get("description", ""),
                "url": repo.get("html_url", ""),
                "language": repo.get("language", ""),
                "params": {},
                "files_analyzed": [],
            }

            # Analyser les fichiers intéressants
            for filename in INTERESTING_FILES:
                content = fetch_file_content(owner, name, filename, token)
                if content:
                    params = extract_numeric_params(content)
                    if params:
                        strategy["params"].update(params)
                        strategy["files_analyzed"].append(filename)
                time.sleep(0.3)

            if strategy["params"] or strategy["files_analyzed"]:
                all_strategies.append(strategy)
                logger.info(
                    "Stratégie extraite: %s (stars=%d, params=%s)",
                    full_name, strategy["stars"], list(strategy["params"].keys()),
                )

        time.sleep(1)   # rate limit GitHub

    logger.info("GitHub: %d stratégies extraites depuis %d repos", len(all_strategies), len(seen_repos))
    return all_strategies


def apply_github_signals(
    edges_df: pd.DataFrame,
    strategies: list[dict],
) -> pd.DataFrame:
    """
    Applique un bonus/malus sur le composite_edge basé sur les stratégies GitHub.
    Si un ticker est cité dans ≥2 repos → bonus +2% sur composite_edge.
    Si les paramètres d'un repo concordent avec nos critères → signal renforcé.
    """
    if edges_df.empty or not strategies:
        return edges_df

    df = edges_df.copy()

    # Compter les mentions de tickers dans les stratégies
    ticker_votes: dict[str, int] = {}
    for strategy in strategies:
        for ticker in strategy["params"].get("tickers_found", []):
            ticker_votes[ticker] = ticker_votes.get(ticker, 0) + 1

    def _github_bonus(ticker: str) -> float:
        votes = ticker_votes.get(ticker, 0)
        if votes >= 3:
            return 3.0
        elif votes == 2:
            return 1.5
        elif votes == 1:
            return 0.5
        return 0.0

    df["github_votes"] = df["ticker"].apply(lambda t: ticker_votes.get(t, 0))
    df["github_bonus"] = df["ticker"].apply(_github_bonus)
    df["composite_edge_adjusted"] = (df["composite_edge"] + df["github_bonus"]).round(2)

    # Recalculer is_opportunity avec le score ajusté
    from config import MIN_EDGE_PCT
    df["is_opportunity"] = df["composite_edge_adjusted"] >= MIN_EDGE_PCT

    logger.info(
        "GitHub signals appliqués: %d tickers avec votes, %d nouvelles opportunités",
        sum(1 for v in ticker_votes.values() if v > 0),
        df["is_opportunity"].sum(),
    )
    return df
