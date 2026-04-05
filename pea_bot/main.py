"""
PEA Stock Bot — Orchestrateur principal.

Usage:
  python main.py scan          # Scan immédiat + alertes
  python main.py backtest      # Lance le backtest 5 ans
  python main.py schedule      # Mode démon (scan toutes les N heures)
  python main.py report        # Rapport hebdomadaire manuel
  python main.py github        # Analyse stratégies GitHub uniquement
  python main.py full          # Tout faire (scan + github + backtest)

Variables d'environnement (.env):
  TELEGRAM_TOKEN    — Token bot Telegram (@BotFather)
  TELEGRAM_CHAT_ID  — Chat ID destinataire
  GITHUB_TOKEN      — (Optionnel) Token GitHub pour augmenter la limite API
"""
from __future__ import annotations

import argparse
import logging
import os
import sys
import time
from datetime import datetime

import schedule
import pandas as pd
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import box

# ── imports locaux ────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(__file__))

from config import (
    SCAN_INTERVAL_HOURS,
    PEA_UNIVERSE,
    MIN_EDGE_PCT,
    CACHE_FILE,
    DATA_DIR,
)
from scrapers.boursorama import run_boursorama_pipeline
from scrapers.euronext import run_euronext_pipeline
from analysis.edge_calculator import EdgeCalculator
from analysis.github_strategies import fetch_github_strategies, apply_github_signals
from alerts.telegram import TelegramAlerter, send_backtest_report
from backtest.engine import Backtester

# ── logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(DATA_DIR, "bot.log"), encoding="utf-8"),
    ],
)
logger = logging.getLogger("pea_bot.main")
console = Console()


# ── Affichage Rich ────────────────────────────────────────────────────────────

def _print_opportunities(edges_df: pd.DataFrame) -> None:
    """Affiche les opportunités dans un tableau Rich."""
    opps = edges_df[edges_df["is_opportunity"]].head(20)
    if opps.empty:
        console.print(Panel("[yellow]Aucune opportunité > {MIN_EDGE_PCT}% détectée[/yellow]"))
        return

    table = Table(
        title=f"Opportunités PEA (edge > {MIN_EDGE_PCT}%)",
        box=box.ROUNDED,
        show_header=True,
        header_style="bold cyan",
    )
    table.add_column("#", style="dim", width=3)
    table.add_column("Ticker", style="bold")
    table.add_column("Nom", max_width=25)
    table.add_column("Prix €", justify="right")
    table.add_column("Edge %", justify="right", style="bold green")
    table.add_column("Type", justify="center")
    table.add_column("P/E", justify="right")
    table.add_column("ROE %", justify="right")
    table.add_column("Graham €", justify="right")
    table.add_column("DCF €", justify="right")

    for i, (_, row) in enumerate(opps.iterrows(), 1):
        edge = row.get("composite_edge_adjusted") or row.get("composite_edge", 0)
        edge_type = row.get("edge_type", "neutral")
        type_color = {"value": "green", "growth": "blue", "overvalued": "red"}.get(edge_type, "white")

        table.add_row(
            str(i),
            str(row.get("ticker", "")),
            str(row.get("name", ""))[:25],
            f"{row.get('price', 0):.2f}" if row.get("price") else "—",
            f"+{edge:.1f}%",
            f"[{type_color}]{edge_type}[/{type_color}]",
            f"{row.get('pe_ratio', 0):.1f}" if row.get("pe_ratio") else "—",
            f"{row.get('roe_pct', 0):.1f}" if row.get("roe_pct") else "—",
            f"{row.get('graham_value', 0):.2f}" if row.get("graham_value") else "—",
            f"{row.get('dcf_value', 0):.2f}" if row.get("dcf_value") else "—",
        )

    console.print(table)


def _print_backtest_summary(result) -> None:
    """Affiche le résumé du backtest."""
    console.print(Panel(
        result.print_summary(),
        title="[bold cyan]Résultats Backtest[/bold cyan]",
        border_style="cyan",
    ))


# ── Commandes ─────────────────────────────────────────────────────────────────

def cmd_scan(send_alerts: bool = True, use_cache: bool = False) -> pd.DataFrame:
    """
    Scan complet:
      1. Scrape Boursorama → fondamentaux filtrés
      2. Calcule les edges value/growth
      3. Envoie alertes Telegram si opportunités
    """
    console.rule("[bold blue]SCAN PEA[/bold blue]")
    console.print(f"[dim]{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}[/dim]")

    # 1. Données
    if use_cache and os.path.exists(CACHE_FILE):
        logger.info("Chargement depuis le cache: %s", CACHE_FILE)
        fundamentals = pd.read_parquet(CACHE_FILE)
    else:
        console.print("[cyan]Scraping Boursorama + yfinance...[/cyan]")
        fundamentals = run_boursorama_pipeline()
        if fundamentals.empty:
            console.print("[red]Echec récupération fondamentaux[/red]")
            return pd.DataFrame()
        # Sauvegarder en cache
        try:
            fundamentals.to_parquet(CACHE_FILE)
        except Exception:
            pass

    console.print(f"[green]{len(fundamentals)} actions analysées[/green]")

    # 2. Edges
    console.print("[cyan]Calcul des edges value/growth...[/cyan]")
    calculator = EdgeCalculator(fundamentals)
    edges_df = calculator.run()

    # 3. Affichage
    summary = calculator.summary()
    console.print(Panel(
        f"[bold]Opportunités:[/bold] {summary['opportunities']} "
        f"(value: {summary['value_plays']}, growth: {summary['growth_plays']})\n"
        f"[bold]Surévalués:[/bold] {summary['overvalued']}\n"
        f"[bold]Edge moyen:[/bold] {summary['avg_composite_edge']:+.2f}%",
        title="Résumé scan",
    ))
    _print_opportunities(edges_df)

    # 4. Alertes
    if send_alerts and not edges_df.empty:
        alerter = TelegramAlerter()
        sent = alerter.alert_opportunities(edges_df)
        if sent > 0:
            console.print(f"[green]{sent} alertes Telegram envoyées[/green]")

    return edges_df


def cmd_github(edges_df: pd.DataFrame | None = None) -> pd.DataFrame:
    """Analyse les repos GitHub et enrichit le score."""
    console.rule("[bold yellow]GITHUB STRATEGIES[/bold yellow]")
    github_token = os.getenv("GITHUB_TOKEN")

    console.print("[cyan]Recherche stratégies GitHub...[/cyan]")
    strategies = fetch_github_strategies(token=github_token, max_repos_per_query=3)

    if not strategies:
        console.print("[yellow]Aucune stratégie GitHub trouvée[/yellow]")
        return edges_df or pd.DataFrame()

    console.print(f"[green]{len(strategies)} stratégies analysées[/green]")
    for s in strategies:
        console.print(
            f"  ★ {s['stars']:>4} | [bold]{s['repo']}[/bold]\n"
            f"       {s['description'][:70]}"
        )

    if edges_df is not None and not edges_df.empty:
        edges_df = apply_github_signals(edges_df, strategies)
        console.print("[green]Scores ajustés avec signaux GitHub[/green]")

    return edges_df


def cmd_backtest(send_report: bool = True) -> None:
    """Lance le backtest 5 ans."""
    console.rule("[bold magenta]BACKTEST 5 ANS[/bold magenta]")
    console.print("[cyan]Téléchargement des données historiques...[/cyan]")

    try:
        backtester = Backtester()
        result = backtester.run()
        _print_backtest_summary(result)

        if send_report:
            alerter = TelegramAlerter()
            alerter.backtest_report(result)
            console.print("[green]Rapport backtest envoyé sur Telegram[/green]")

        # Comparaison des fréquences
        console.print("\n[cyan]Comparaison des stratégies de rebalancement...[/cyan]")
        comparison = backtester.compare_strategies()
        comp_table = Table(title="Comparaison rebalancement", box=box.SIMPLE)
        comp_table.add_column("Fréquence")
        comp_table.add_column("CAGR %", justify="right")
        comp_table.add_column("Sharpe", justify="right")
        comp_table.add_column("Max DD %", justify="right")
        comp_table.add_column("Alpha %", justify="right")
        for freq, metrics in comparison.items():
            comp_table.add_row(
                freq,
                f"{metrics.get('cagr', 0):+.2f}",
                f"{metrics.get('sharpe', 0):.2f}",
                f"{metrics.get('max_drawdown', 0):.2f}",
                f"{metrics.get('alpha', 0):+.2f}",
            )
        console.print(comp_table)

    except Exception as exc:
        logger.error("Backtest échoué: %s", exc, exc_info=True)
        console.print(f"[red]Erreur backtest: {exc}[/red]")


def cmd_report() -> None:
    """Rapport hebdomadaire manuel."""
    edges_df = cmd_scan(send_alerts=False)
    if edges_df.empty:
        return
    alerter = TelegramAlerter()
    success = alerter.weekly_report(edges_df)
    if success:
        console.print("[green]Rapport hebdomadaire envoyé[/green]")


def cmd_full() -> None:
    """Pipeline complet: scan + github + backtest."""
    edges_df = cmd_scan(send_alerts=False)
    edges_df = cmd_github(edges_df)

    if not edges_df.empty:
        alerter = TelegramAlerter()
        sent = alerter.alert_opportunities(edges_df)
        console.print(f"[green]{sent} alertes envoyées[/green]")

    cmd_backtest(send_report=True)


def cmd_schedule() -> None:
    """Mode démon avec scheduling automatique."""
    console.print(Panel(
        f"[bold green]PEA Bot démarré[/bold green]\n"
        f"Scan toutes les [bold]{SCAN_INTERVAL_HOURS}h[/bold]\n"
        f"Rapport hebdomadaire: lundi 08:00\n"
        f"Backtest: dimanche 06:00\n"
        f"Ctrl+C pour arrêter",
        title="Scheduler",
    ))

    # Planification
    schedule.every(SCAN_INTERVAL_HOURS).hours.do(lambda: cmd_scan(send_alerts=True))
    schedule.every().monday.at("08:00").do(cmd_report)
    schedule.every().sunday.at("06:00").do(lambda: cmd_backtest(send_report=True))

    # Scan immédiat au démarrage
    cmd_scan(send_alerts=True)

    while True:
        try:
            schedule.run_pending()
            time.sleep(60)
        except KeyboardInterrupt:
            console.print("\n[yellow]Bot arrêté[/yellow]")
            break
        except Exception as exc:
            logger.error("Erreur scheduler: %s", exc, exc_info=True)
            from alerts.telegram import send_error_alert
            send_error_alert(str(exc))
            time.sleep(60)


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="PEA Stock Bot — Screener Euronext + Alertes Telegram",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "command",
        choices=["scan", "backtest", "schedule", "report", "github", "full"],
        help="Commande à exécuter",
    )
    parser.add_argument(
        "--no-alerts",
        action="store_true",
        help="Désactiver les alertes Telegram",
    )
    parser.add_argument(
        "--cache",
        action="store_true",
        help="Utiliser le cache local si disponible",
    )
    args = parser.parse_args()

    console.print(Panel(
        "[bold cyan]PEA Stock Bot[/bold cyan] v1.0\n"
        "Screener Euronext | Alertes Telegram | Backtest 5 ans",
        border_style="cyan",
    ))

    cmd = args.command
    if cmd == "scan":
        cmd_scan(send_alerts=not args.no_alerts, use_cache=args.cache)
    elif cmd == "backtest":
        cmd_backtest(send_report=not args.no_alerts)
    elif cmd == "schedule":
        cmd_schedule()
    elif cmd == "report":
        cmd_report()
    elif cmd == "github":
        cmd_github()
    elif cmd == "full":
        cmd_full()


if __name__ == "__main__":
    main()
