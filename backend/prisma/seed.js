const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Portfolio Companies ───────────────────────────────────────────────────
  await prisma.portfolioCompany.createMany({
    data: [
      { name: 'TechVision SAS', sector: 'SaaS / B2B', country: 'France', entryDate: new Date('2021-03-15'), entryValuation: 45000000, currentValuation: 112000000, equity: 35, revenue: 18500000, ebitda: 4200000, employees: 142, stage: 'Growth', status: 'Active', irr: 42.5, moic: 2.49 },
      { name: 'MedTech Innovations', sector: 'MedTech', country: 'Germany', entryDate: new Date('2020-06-01'), entryValuation: 28000000, currentValuation: 95000000, equity: 42, revenue: 22000000, ebitda: 6800000, employees: 210, stage: 'Growth', status: 'Active', irr: 38.2, moic: 3.39 },
      { name: 'GreenEnergy Co', sector: 'CleanTech', country: 'Spain', entryDate: new Date('2022-01-10'), entryValuation: 62000000, currentValuation: 78000000, equity: 28, revenue: 31000000, ebitda: 9200000, employees: 380, stage: 'Mature', status: 'Active', irr: 14.8, moic: 1.26 },
      { name: 'FinFlow Technologies', sector: 'FinTech', country: 'Netherlands', entryDate: new Date('2019-09-20'), entryValuation: 15000000, currentValuation: 0, equity: 51, revenue: 0, ebitda: 0, employees: 0, stage: 'Exit', status: 'Exited', irr: 55.1, moic: 5.2, exitDate: new Date('2023-11-30'), exitValuation: 78000000 },
      { name: 'DataSphere AI', sector: 'Intelligence Artificielle', country: 'France', entryDate: new Date('2023-02-14'), entryValuation: 35000000, currentValuation: 52000000, equity: 30, revenue: 8200000, ebitda: 1100000, employees: 68, stage: 'Early Growth', status: 'Active', irr: 28.4, moic: 1.49 },
      { name: 'LogiChain Europe', sector: 'Logistique / Supply Chain', country: 'Belgium', entryDate: new Date('2021-11-05'), entryValuation: 40000000, currentValuation: 58000000, equity: 38, revenue: 54000000, ebitda: 7800000, employees: 520, stage: 'Growth', status: 'Active', irr: 22.1, moic: 1.45 },
    ],
    skipDuplicates: true,
  });

  // ── LPs ──────────────────────────────────────────────────────────────────
  const lp1 = await prisma.lP.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: 'Fonds de Retraite AXA', type: 'Fonds de Pension', country: 'France', commitment: 50000000, called: 38500000, distributed: 12000000, nav: 62000000, dpi: 0.31, tvpi: 1.92, irr: 24.5, vintage: 2019 } });
  const lp2 = await prisma.lP.upsert({ where: { id: 2 }, update: {}, create: { id: 2, name: 'Sovereign Capital GmbH', type: 'Family Office', country: 'Germany', commitment: 25000000, called: 20000000, distributed: 8500000, nav: 31000000, dpi: 0.43, tvpi: 1.98, irr: 26.1, vintage: 2019 } });
  await prisma.lP.upsert({ where: { id: 3 }, update: {}, create: { id: 3, name: 'Nordic Pension Fund', type: 'Fonds de Pension', country: 'Sweden', commitment: 40000000, called: 30000000, distributed: 6000000, nav: 48000000, dpi: 0.20, tvpi: 1.80, irr: 21.3, vintage: 2021 } });
  await prisma.lP.upsert({ where: { id: 4 }, update: {}, create: { id: 4, name: 'BNP Paribas AM', type: 'Asset Manager', country: 'France', commitment: 35000000, called: 28000000, distributed: 5000000, nav: 42000000, dpi: 0.18, tvpi: 1.68, irr: 18.9, vintage: 2021 } });
  await prisma.lP.upsert({ where: { id: 5 }, update: {}, create: { id: 5, name: 'AlpInvest Partners', type: 'Fonds de Fonds', country: 'Netherlands', commitment: 60000000, called: 45000000, distributed: 18000000, nav: 71000000, dpi: 0.40, tvpi: 1.98, irr: 25.7, vintage: 2019 } });

  // ── Users ─────────────────────────────────────────────────────────────────
  const adminHash   = await bcrypt.hash('Admin2024!',   12);
  const analystHash = await bcrypt.hash('Analyst2024!', 12);
  const lpHash      = await bcrypt.hash('LP2024!',      12);

  await prisma.user.upsert({ where: { email: 'admin@fund.eu' },   update: {}, create: { email: 'admin@fund.eu',      passwordHash: adminHash,   name: 'Marie Dubois',   role: 'ADMIN',   initials: 'MD' } });
  await prisma.user.upsert({ where: { email: 'analyst@fund.eu' }, update: {}, create: { email: 'analyst@fund.eu',    passwordHash: analystHash, name: 'Thomas Laurent', role: 'ANALYST', initials: 'TL' } });
  await prisma.user.upsert({ where: { email: 'lp@axafund.eu' },   update: {}, create: { email: 'lp@axafund.eu',      passwordHash: lpHash,      name: 'Jean Moreau',    role: 'LP',      initials: 'JM', lpId: lp1.id } });
  await prisma.user.upsert({ where: { email: 'lp@sovereign.de' }, update: {}, create: { email: 'lp@sovereign.de',   passwordHash: lpHash,      name: 'Hans Mueller',   role: 'LP',      initials: 'HM', lpId: lp2.id } });

  // ── Deals ─────────────────────────────────────────────────────────────────
  const deals = [
    { id: 1, company: 'CyberShield Security', sector: 'Cybersécurité', country: 'UK', stage: 'Due Diligence', targetValuation: 55000000, targetEquity: 40, revenue: 12000000, ebitda: 3200000, contactDate: new Date('2026-01-10'), owner: 'Marie Dubois', priority: 'High', notes: 'Leader sur le marché UK, forte croissance ARR +85% YoY', thesis: "CyberShield est le leader de la cybersécurité SMB en UK avec une plateforme SaaS MDR (Managed Detection & Response) entièrement propriétaire. La société bénéficie d'une croissance ARR de +85% YoY grâce à un modèle de distribution indirect (500+ revendeurs) et d'un NRR de 128%. La thèse d'investissement repose sur trois piliers : (1) accélération de la croissance internationale via expansion en Europe continentale (DACH + Benelux), (2) montée en gamme vers le segment Mid-Market avec lancement d'une offre Enterprise, et (3) croissance externe via acquisitions de MSSP régionaux." },
    { id: 2, company: 'BioLab Diagnostics', sector: 'BioTech', country: 'Switzerland', stage: 'Term Sheet', targetValuation: 80000000, targetEquity: 35, revenue: 19000000, ebitda: 5400000, contactDate: new Date('2025-11-20'), owner: 'Thomas Laurent', priority: 'High', notes: 'Pipeline produits très solide, brevets exclusifs', thesis: "BioLab Diagnostics est un acteur de référence dans le diagnostic in vitro de précision en Suisse et en Autriche. La société dispose d'un portefeuille de 12 brevets exclusifs sur des biomarqueurs oncologiques et bénéficie de contrats long terme avec 47 hôpitaux universitaires." },
    { id: 3, company: 'EduTech Platform', sector: 'EdTech', country: 'France', stage: 'Initial Contact', targetValuation: 22000000, targetEquity: 45, revenue: 5500000, ebitda: 900000, contactDate: new Date('2026-02-28'), owner: 'Sophie Martin', priority: 'Medium', notes: 'Fort potentiel sur le marché B2B corporate training', thesis: "EduTech Platform adresse le marché du corporate learning & development avec une plateforme IA-first de création et déploiement de contenus de formation." },
    { id: 4, company: 'AgriSmart IoT', sector: 'AgriTech', country: 'Denmark', stage: 'Screening', targetValuation: 18000000, targetEquity: 50, revenue: 3200000, ebitda: 400000, contactDate: new Date('2026-03-05'), owner: 'Pierre Moreau', priority: 'Low', notes: 'Technologie innovante mais marché encore émergent', thesis: "AgriSmart IoT développe des capteurs connectés et une plateforme d'analyse prédictive pour l'agriculture de précision." },
    { id: 5, company: 'CloudOps Pro', sector: 'DevOps / Cloud', country: 'Germany', stage: 'LOI Signed', targetValuation: 48000000, targetEquity: 33, revenue: 16800000, ebitda: 4900000, contactDate: new Date('2025-10-15'), owner: 'Marie Dubois', priority: 'High', notes: 'Top 3 en Europe, SLA 99.99%, NRR > 130%', thesis: "CloudOps Pro est l'un des trois leaders européens de la plateforme DevSecOps cloud-native, avec une position dominante en DACH." },
  ];

  const lboData = [
    { dealId: 1, entryEBITDA: 3200000, exitEBITDA: 7800000, entryMultiple: 17.2, exitMultiple: 15.0, leverageRatio: 0.45, holdingPeriod: 5, ebitdaGrowthRate: 19.5 },
    { dealId: 2, entryEBITDA: 5400000, exitEBITDA: 14200000, entryMultiple: 14.8, exitMultiple: 14.0, leverageRatio: 0.40, holdingPeriod: 5, ebitdaGrowthRate: 21.3 },
    { dealId: 3, entryEBITDA: 900000, exitEBITDA: 3200000, entryMultiple: 24.4, exitMultiple: 18.0, leverageRatio: 0.30, holdingPeriod: 5, ebitdaGrowthRate: 28.8 },
    { dealId: 4, entryEBITDA: 400000, exitEBITDA: 2100000, entryMultiple: 45.0, exitMultiple: 20.0, leverageRatio: 0.20, holdingPeriod: 5, ebitdaGrowthRate: 39.3 },
    { dealId: 5, entryEBITDA: 4900000, exitEBITDA: 11500000, entryMultiple: 9.8, exitMultiple: 12.0, leverageRatio: 0.50, holdingPeriod: 5, ebitdaGrowthRate: 18.6 },
  ];

  const milestonesData = [
    { dealId: 1, items: [{ date: '2026-01-10', label: 'Premier contact', status: 'done', type: 'contact' }, { date: '2026-01-28', label: 'NDA signé', status: 'done', type: 'legal' }, { date: '2026-02-10', label: 'Management presentation', status: 'done', type: 'meeting' }, { date: '2026-03-05', label: 'Entrée en Due Diligence', status: 'done', type: 'diligence' }, { date: '2026-04-15', label: 'Rapport DD financière', status: 'upcoming', type: 'diligence' }, { date: '2026-05-20', label: 'Term Sheet', status: 'upcoming', type: 'legal' }, { date: '2026-07-01', label: 'Closing prévu', status: 'upcoming', type: 'closing' }] },
    { dealId: 2, items: [{ date: '2025-11-20', label: 'Premier contact', status: 'done', type: 'contact' }, { date: '2025-12-05', label: 'NDA et accès à la dataroom', status: 'done', type: 'legal' }, { date: '2026-01-15', label: 'Présentation management', status: 'done', type: 'meeting' }, { date: '2026-03-10', label: 'Due Diligence financière', status: 'done', type: 'diligence' }, { date: '2026-03-20', label: 'Term Sheet soumis', status: 'done', type: 'legal' }, { date: '2026-04-05', label: 'Négociation Term Sheet', status: 'upcoming', type: 'legal' }, { date: '2026-06-01', label: 'Closing', status: 'upcoming', type: 'closing' }] },
    { dealId: 3, items: [{ date: '2026-02-28', label: 'Premier contact', status: 'done', type: 'contact' }, { date: '2026-03-15', label: 'Call exploratoire', status: 'upcoming', type: 'meeting' }, { date: '2026-05-01', label: 'Décision Go / No-Go', status: 'upcoming', type: 'diligence' }] },
    { dealId: 4, items: [{ date: '2026-03-05', label: 'Sourcing via réseau agricole', status: 'done', type: 'contact' }, { date: '2026-04-01', label: 'Analyse marché & tech screening', status: 'upcoming', type: 'diligence' }] },
    { dealId: 5, items: [{ date: '2025-10-15', label: 'Premier contact', status: 'done', type: 'contact' }, { date: '2025-11-01', label: 'NDA signé', status: 'done', type: 'legal' }, { date: '2025-11-20', label: 'Management presentation', status: 'done', type: 'meeting' }, { date: '2026-02-05', label: 'IC — accord de principe', status: 'done', type: 'meeting' }, { date: '2026-03-01', label: 'LOI signée', status: 'done', type: 'legal' }, { date: '2026-04-10', label: 'Négociation SHA & SPA', status: 'upcoming', type: 'legal' }, { date: '2026-06-01', label: 'Closing', status: 'upcoming', type: 'closing' }] },
  ];

  for (const d of deals) {
    const deal = await prisma.deal.upsert({ where: { id: d.id }, update: {}, create: d });
    const lbo = lboData.find(l => l.dealId === d.id);
    if (lbo) {
      await prisma.dealLBO.upsert({ where: { dealId: deal.id }, update: {}, create: { ...lbo, dealId: deal.id } });
    }
    const ms = milestonesData.find(m => m.dealId === d.id);
    if (ms) {
      await prisma.dealMilestone.deleteMany({ where: { dealId: deal.id } });
      await prisma.dealMilestone.createMany({ data: ms.items.map(m => ({ ...m, dealId: deal.id, date: new Date(m.date) })) });
    }
  }

  // ── Fund Config ───────────────────────────────────────────────────────────
  await prisma.fundConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1, fundName: 'European Growth Fund III', fundSize: 350000000, vintage: 2019,
      totalCommitted: 210000000, totalCalled: 161500000, totalDistributed: 49500000, totalNAV: 254000000,
      grossIRR: 28.4, netIRR: 24.1, grossMOIC: 2.19, netMOIC: 1.88, dpi: 0.31, tvpi: 1.88, rvpi: 1.57,
      navByQuarter: [
        { quarter: 'Q1 2020', nav: 42000000 }, { quarter: 'Q2 2020', nav: 68000000 },
        { quarter: 'Q3 2020', nav: 75000000 }, { quarter: 'Q4 2020', nav: 92000000 },
        { quarter: 'Q1 2021', nav: 108000000 }, { quarter: 'Q2 2021', nav: 134000000 },
        { quarter: 'Q3 2021', nav: 148000000 }, { quarter: 'Q4 2021', nav: 165000000 },
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
    },
  });

  console.log('✅ Seed complete.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
