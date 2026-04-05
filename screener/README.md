# Stock Screener

Application web Streamlit de screening d'actions US et européennes.

## Fonctionnalités

- **Données temps réel** via Yahoo Finance (yfinance) — cache 1h
- **Univers** : ~60 actions US (S&P 500) + ~45 actions européennes (CAC 40, DAX, AEX, IBEX, etc.)
- **Filtre PEA** : affiche uniquement les actions éligibles au Plan d'Épargne en Actions
- **Filtres fondamentaux** :
  - P/E trailing (max)
  - ROE — Return on Equity (min %)
  - Dette / EBITDA (max, seuil recommandé : < 3×)
  - FCF Yield — Free Cash Flow Yield (min %)
- **Score composite 1–100** :
  | Critère | Poids |
  |---|---|
  | FCF Yield | 25 pts |
  | ROE | 20 pts |
  | P/E | 20 pts |
  | Dette/EBITDA | 20 pts |
  | EV/EBITDA | 15 pts |
- **Tableau interactif** avec export CSV
- **Graphiques** : distribution des scores, scatter P/E × FCF, top 20, répartition sectorielle
- **Radar** par action : visualisation des 5 composantes du score

## Lancement

```bash
cd screener
pip install -r requirements.txt
streamlit run app.py
```

Application disponible sur `http://localhost:8501`
