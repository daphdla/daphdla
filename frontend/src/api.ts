import type { PortfolioCompany, Deal, LP, FundMetrics } from './types'

export const PORTFOLIO: PortfolioCompany[] = [
  { id: 1, name: 'TechVision SAS', sector: 'SaaS / B2B', country: 'France', entryDate: '2021-03-15', entryValuation: 45000000, currentValuation: 112000000, equity: 35, revenue: 18500000, ebitda: 4200000, employees: 142, stage: 'Growth', status: 'Active', irr: 42.5, moic: 2.49, currency: 'EUR' },
  { id: 2, name: 'MedTech Innovations', sector: 'MedTech', country: 'Germany', entryDate: '2020-06-01', entryValuation: 28000000, currentValuation: 95000000, equity: 42, revenue: 22000000, ebitda: 6800000, employees: 210, stage: 'Growth', status: 'Active', irr: 38.2, moic: 3.39, currency: 'EUR' },
  { id: 3, name: 'GreenEnergy Co', sector: 'CleanTech', country: 'Spain', entryDate: '2022-01-10', entryValuation: 62000000, currentValuation: 78000000, equity: 28, revenue: 31000000, ebitda: 9200000, employees: 380, stage: 'Mature', status: 'Active', irr: 14.8, moic: 1.26, currency: 'EUR' },
  { id: 4, name: 'FinFlow Technologies', sector: 'FinTech', country: 'Netherlands', entryDate: '2019-09-20', entryValuation: 15000000, currentValuation: 0, equity: 51, revenue: 0, ebitda: 0, employees: 0, stage: 'Exit', status: 'Exited', irr: 55.1, moic: 5.2, exitDate: '2023-11-30', exitValuation: 78000000, currency: 'EUR' },
  { id: 5, name: 'DataSphere AI', sector: 'Intelligence Artificielle', country: 'France', entryDate: '2023-02-14', entryValuation: 35000000, currentValuation: 52000000, equity: 30, revenue: 8200000, ebitda: 1100000, employees: 68, stage: 'Early Growth', status: 'Active', irr: 28.4, moic: 1.49, currency: 'EUR' },
  { id: 6, name: 'LogiChain Europe', sector: 'Logistique / Supply Chain', country: 'Belgium', entryDate: '2021-11-05', entryValuation: 40000000, currentValuation: 58000000, equity: 38, revenue: 54000000, ebitda: 7800000, employees: 520, stage: 'Growth', status: 'Active', irr: 22.1, moic: 1.45, currency: 'EUR' },
]

export const DEALS: Deal[] = [
  { id: 1, company: 'CyberShield Security', sector: 'Cybersécurité', country: 'UK', stage: 'Due Diligence', targetValuation: 55000000, targetEquity: 40, revenue: 12000000, ebitda: 3200000, contactDate: '2026-01-10', owner: 'Marie Dubois', priority: 'High', notes: 'Leader UK, ARR +85% YoY', thesis: "CyberShield est le leader de la cybersécurité SMB en UK avec une plateforme SaaS MDR entièrement propriétaire. Croissance ARR +85% YoY, NRR 128%.", lbo: { entryEBITDA: 3200000, exitEBITDA: 7800000, entryMultiple: 17.2, exitMultiple: 15.0, leverageRatio: 0.45, holdingPeriod: 5, ebitdaGrowthRate: 19.5 }, milestones: [{ id: 1, date: '2026-01-10', label: 'Premier contact', status: 'done', type: 'contact' }, { id: 2, date: '2026-01-28', label: 'NDA signé', status: 'done', type: 'legal' }, { id: 3, date: '2026-02-10', label: 'Management presentation', status: 'done', type: 'meeting' }, { id: 4, date: '2026-04-15', label: 'Rapport DD financière', status: 'upcoming', type: 'diligence' }, { id: 5, date: '2026-05-20', label: 'Term Sheet', status: 'upcoming', type: 'legal' }, { id: 6, date: '2026-07-01', label: 'Closing prévu', status: 'upcoming', type: 'closing' }] },
  { id: 2, company: 'BioLab Diagnostics', sector: 'BioTech', country: 'Switzerland', stage: 'Term Sheet', targetValuation: 80000000, targetEquity: 35, revenue: 19000000, ebitda: 5400000, contactDate: '2025-11-20', owner: 'Thomas Laurent', priority: 'High', notes: 'Pipeline produits solide, brevets exclusifs', thesis: "BioLab Diagnostics est un acteur de référence dans le diagnostic in vitro de précision. 12 brevets exclusifs sur des biomarqueurs oncologiques.", lbo: { entryEBITDA: 5400000, exitEBITDA: 14200000, entryMultiple: 14.8, exitMultiple: 14.0, leverageRatio: 0.40, holdingPeriod: 5, ebitdaGrowthRate: 21.3 }, milestones: [{ id: 7, date: '2025-11-20', label: 'Premier contact', status: 'done', type: 'contact' }, { id: 8, date: '2025-12-05', label: 'NDA signé', status: 'done', type: 'legal' }, { id: 9, date: '2026-03-20', label: 'Term Sheet soumis', status: 'done', type: 'legal' }, { id: 10, date: '2026-06-01', label: 'Closing', status: 'upcoming', type: 'closing' }] },
  { id: 3, company: 'EduTech Platform', sector: 'EdTech', country: 'France', stage: 'Initial Contact', targetValuation: 22000000, targetEquity: 45, revenue: 5500000, ebitda: 900000, contactDate: '2026-02-28', owner: 'Sophie Martin', priority: 'Medium', notes: 'Potentiel B2B corporate training', lbo: { entryEBITDA: 900000, exitEBITDA: 3200000, entryMultiple: 24.4, exitMultiple: 18.0, leverageRatio: 0.30, holdingPeriod: 5, ebitdaGrowthRate: 28.8 }, milestones: [{ id: 11, date: '2026-02-28', label: 'Premier contact', status: 'done', type: 'contact' }, { id: 12, date: '2026-04-01', label: 'Call exploratoire', status: 'upcoming', type: 'meeting' }] },
  { id: 4, company: 'AgriSmart IoT', sector: 'AgriTech', country: 'Denmark', stage: 'Screening', targetValuation: 18000000, targetEquity: 50, revenue: 3200000, ebitda: 400000, contactDate: '2026-03-05', owner: 'Pierre Moreau', priority: 'Low', notes: 'Tech innovante, marché émergent', lbo: { entryEBITDA: 400000, exitEBITDA: 2100000, entryMultiple: 45.0, exitMultiple: 20.0, leverageRatio: 0.20, holdingPeriod: 5, ebitdaGrowthRate: 39.3 }, milestones: [{ id: 13, date: '2026-03-05', label: 'Sourcing', status: 'done', type: 'contact' }, { id: 14, date: '2026-04-01', label: 'Analyse marché', status: 'upcoming', type: 'diligence' }] },
  { id: 5, company: 'CloudOps Pro', sector: 'DevOps / Cloud', country: 'Germany', stage: 'LOI Signed', targetValuation: 48000000, targetEquity: 33, revenue: 16800000, ebitda: 4900000, contactDate: '2025-10-15', owner: 'Marie Dubois', priority: 'High', notes: 'Top 3 Europe, NRR > 130%', thesis: "CloudOps Pro est l'un des trois leaders européens DevSecOps cloud-native, position dominante en DACH.", lbo: { entryEBITDA: 4900000, exitEBITDA: 11500000, entryMultiple: 9.8, exitMultiple: 12.0, leverageRatio: 0.50, holdingPeriod: 5, ebitdaGrowthRate: 18.6 }, milestones: [{ id: 15, date: '2025-10-15', label: 'Premier contact', status: 'done', type: 'contact' }, { id: 16, date: '2025-11-01', label: 'NDA signé', status: 'done', type: 'legal' }, { id: 17, date: '2026-03-01', label: 'LOI signée', status: 'done', type: 'legal' }, { id: 18, date: '2026-04-10', label: 'Négociation SHA & SPA', status: 'upcoming', type: 'legal' }, { id: 19, date: '2026-06-01', label: 'Closing', status: 'upcoming', type: 'closing' }] },
]

export const LPS: LP[] = [
  { id: 1, name: 'Fonds de Retraite AXA', type: 'Fonds de Pension', country: 'France', commitment: 50000000, called: 38500000, distributed: 12000000, nav: 62000000, dpi: 0.31, tvpi: 1.92, irr: 24.5, vintage: 2019, currency: 'EUR' },
  { id: 2, name: 'Sovereign Capital GmbH', type: 'Family Office', country: 'Germany', commitment: 25000000, called: 20000000, distributed: 8500000, nav: 31000000, dpi: 0.43, tvpi: 1.98, irr: 26.1, vintage: 2019, currency: 'EUR' },
  { id: 3, name: 'Nordic Pension Fund', type: 'Fonds de Pension', country: 'Sweden', commitment: 40000000, called: 30000000, distributed: 6000000, nav: 48000000, dpi: 0.20, tvpi: 1.80, irr: 21.3, vintage: 2021, currency: 'EUR' },
  { id: 4, name: 'BNP Paribas AM', type: 'Asset Manager', country: 'France', commitment: 35000000, called: 28000000, distributed: 5000000, nav: 42000000, dpi: 0.18, tvpi: 1.68, irr: 18.9, vintage: 2021, currency: 'EUR' },
  { id: 5, name: 'AlpInvest Partners', type: 'Fonds de Fonds', country: 'Netherlands', commitment: 60000000, called: 45000000, distributed: 18000000, nav: 71000000, dpi: 0.40, tvpi: 1.98, irr: 25.7, vintage: 2019, currency: 'EUR' },
]

export const METRICS: FundMetrics = {
  fundName: 'European Growth Fund III', fundSize: 350000000, vintage: 2019, currency: 'EUR',
  totalCommitted: 210000000, totalCalled: 161500000, totalDistributed: 49500000, totalNAV: 254000000,
  grossIRR: 28.4, netIRR: 24.1, grossMOIC: 2.19, netMOIC: 1.88, dpi: 0.31, tvpi: 1.88, rvpi: 1.57,
  portfolioCompanies: 6, activeInvestments: 5, exits: 1,
  navByQuarter: [
    { quarter: 'Q1 2022', nav: 172000000 }, { quarter: 'Q2 2022', nav: 180000000 },
    { quarter: 'Q3 2022', nav: 188000000 }, { quarter: 'Q4 2022', nav: 198000000 },
    { quarter: 'Q1 2023', nav: 208000000 }, { quarter: 'Q2 2023', nav: 220000000 },
    { quarter: 'Q3 2023', nav: 235000000 }, { quarter: 'Q4 2023', nav: 242000000 },
    { quarter: 'Q1 2024', nav: 248000000 }, { quarter: 'Q2 2024', nav: 254000000 },
  ],
  sectorAllocation: [
    { sector: 'SaaS / B2B', percentage: 22 }, { sector: 'MedTech', percentage: 19 },
    { sector: 'CleanTech', percentage: 15 }, { sector: 'FinTech', percentage: 8 },
    { sector: 'AI', percentage: 12 }, { sector: 'Logistique', percentage: 14 }, { sector: 'Autres', percentage: 10 },
  ],
  geoAllocation: [
    { country: 'France', percentage: 34 }, { country: 'Germany', percentage: 22 },
    { country: 'Spain', percentage: 16 }, { country: 'Netherlands', percentage: 14 },
    { country: 'Belgium', percentage: 8 }, { country: 'Autres', percentage: 6 },
  ],
}

export const fetchPortfolio = async () => PORTFOLIO
export const fetchDeals = async () => DEALS
export const fetchLPs = async () => LPS
export const fetchMetrics = async () => METRICS
