# PEA Stock Bot 🤖📈

Bot Python de screening et d'alerte pour actions éligibles PEA (Euronext Paris/Amsterdam).

## Fonctionnalités

| Module | Description |
|--------|-------------|
| **Scraper Boursorama** | Consensus analystes + top actions, enrichi via yfinance |
| **Euronext Tracker** | Screener complet + top holders (actionnariat significatif) |
| **Edge Calculator** | Valorisation multi-méthodes : Graham Number, DCF, Relative, Analyste |
| **GitHub Strategies** | Analyse des repos publics pour signaux supplémentaires |
| **Backtest 5 ans** | Simulation historique avec métriques complètes vs CAC 40 |
| **Alertes Telegram** | Notifications immédiates + rapport hebdomadaire |

## Installation

```bash
cd pea_bot
pip install -r requirements.txt
cp .env.example .env
# Éditer .env avec vos tokens
```

## Utilisation

```bash
# Scan immédiat + alertes Telegram
python main.py scan

# Scan sans envoyer d'alertes
python main.py scan --no-alerts

# Utiliser le cache (évite re-scraper)
python main.py scan --cache

# Backtest 5 ans
python main.py backtest

# Analyse stratégies GitHub
python main.py github

# Pipeline complet (scan + github + backtest)
python main.py full

# Mode démon (scan toutes les 6h, rapport lundi 08:00)
python main.py schedule

# Rapport hebdomadaire manuel
python main.py report
```

## Architecture

```
pea_bot/
├── main.py                  # Orchestrateur CLI
├── config.py                # Configuration centrale
├── requirements.txt
├── .env.example
├── scrapers/
│   ├── boursorama.py        # Scraping Boursorama + yfinance
│   └── euronext.py          # API Euronext + top holders
├── analysis/
│   ├── edge_calculator.py   # Graham / DCF / Relative / Momentum
│   └── github_strategies.py # Extraction stratégies GitHub
├── backtest/
│   └── engine.py            # Backtester 5 ans vs CAC 40
├── alerts/
│   └── telegram.py          # Bot Telegram + anti-spam
└── data/                    # Cache, logs, résultats
```

## Méthodes de valorisation (Edge Calculator)

| Méthode | Poids | Description |
|---------|-------|-------------|
| **Graham Number** | 20% | √(22.5 × EPS × BVPS) — valeur plancher |
| **DCF (10 ans)** | 30% | Flux actualisés CAPM, croissance terminale 2.5% |
| **Relative Value** | 20% | Discount vs médiane sectorielle Euronext |
| **Analyste** | 20% | Upside vs target consensus |
| **Momentum 52w** | 10% | Position dans le range 52 semaines |

**Score composite ≥ 5% → ALERTE**

## Backtest

- Univers : ~70 actions PEA éligibles
- Benchmark : CAC 40 (^FCHI)
- Sélection : top 10 par ratio Sharpe 12M
- Rebalancement : trimestriel (configurable : mensuel / annuel)
- Coûts : 0.15% aller-retour
- Capital initial : 10 000 €

Métriques : CAGR, Sharpe, Max Drawdown, Alpha, Beta, Calmar, Win Rate

## Configuration (`config.py`)

```python
MIN_ROE = 15.0          # ROE minimum (%)
MAX_PE = 20.0           # P/E maximum
MIN_EDGE_PCT = 5.0      # Seuil alerte opportunité (%)
SCAN_INTERVAL_HOURS = 6 # Fréquence de scan en mode schedule
BACKTEST_YEARS = 5      # Durée du backtest
```

## Avertissement

> Ce bot est un outil d'aide à la décision à visée éducative.
> Il ne constitue **pas** un conseil en investissement.
> Les performances passées ne préjugent pas des performances futures.
