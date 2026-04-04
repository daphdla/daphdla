# PE Dashboard — European Growth Fund III 

Application de Private Equity pour la gestion et le suivi du portefeuille.

## Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Recharts
- **Backend**: Node.js + Express

## Fonctionnalités

- **Vue d'ensemble**: NAV, IRR, MOIC, répartition sectorielle, participations actives
- **Portefeuille**: Liste des sociétés, valorisations, IRR, MOIC, EBITDA
- **Pipeline Deals**: Vue Kanban + tableau, priorités, étapes (Screening → LOI Signed)
- **Investisseurs (LP)**: Engagements, capital appelé, distributions, DPI/TVPI/IRR
- **KPIs & Métriques**: Tableaux de bord analytics, allocations géo/sectorielle

## Installation & Démarrage

```bash
# Installation des dépendances
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Démarrage (backend + frontend en parallèle)
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
