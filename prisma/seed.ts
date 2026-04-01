/**
 * Seed script — realistic PE platform demo data
 * Run: npm run db:seed
 */

import { PrismaClient, UserRole, FundStrategy, FundStatus, Sector, CompanyStatus, InstrumentType, DealStage, DealPriority, SourceType, DDWorkstream, DDStatus, LpType, DistributionType, ValuationMethod } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PE Platform database...");

  // ─── Users ────────────────────────────────────────────────────────────────

  const passwordHash = await bcrypt.hash("password123", 12);

  const [partner, analyst, cfo, lpUser] = await Promise.all([
    prisma.user.upsert({
      where: { email: "partner@pe-platform.com" },
      update: {},
      create: {
        email: "partner@pe-platform.com",
        name: "Alexandre Moreau",
        passwordHash,
        role: UserRole.PARTNER,
      },
    }),
    prisma.user.upsert({
      where: { email: "analyst@pe-platform.com" },
      update: {},
      create: {
        email: "analyst@pe-platform.com",
        name: "Sophie Laurent",
        passwordHash,
        role: UserRole.ANALYST,
      },
    }),
    prisma.user.upsert({
      where: { email: "cfo@pe-platform.com" },
      update: {},
      create: {
        email: "cfo@pe-platform.com",
        name: "Marc Dupont",
        passwordHash,
        role: UserRole.CFO,
      },
    }),
    prisma.user.upsert({
      where: { email: "lp@pension-fund.com" },
      update: {},
      create: {
        email: "lp@pension-fund.com",
        name: "Capital Fund III",
        passwordHash,
        role: UserRole.LP,
      },
    }),
  ]);

  console.log("✅ Users created");

  // ─── Funds ────────────────────────────────────────────────────────────────

  const fund1 = await prisma.fund.upsert({
    where: { id: "fund-buyout-iv" },
    update: {},
    create: {
      id: "fund-buyout-iv",
      name: "Horizon Buyout IV",
      vintage: 2019,
      targetSize: 500,
      committedCapital: 480,
      calledCapital: 312,
      currency: "EUR",
      strategy: FundStrategy.BUYOUT,
      status: FundStatus.INVESTING,
      description: "Mid-market buyout fund focused on European B2B software and services",
    },
  });

  const fund2 = await prisma.fund.upsert({
    where: { id: "fund-growth-iii" },
    update: {},
    create: {
      id: "fund-growth-iii",
      name: "Horizon Growth III",
      vintage: 2021,
      targetSize: 300,
      committedCapital: 280,
      calledCapital: 140,
      currency: "EUR",
      strategy: FundStrategy.GROWTH_EQUITY,
      status: FundStatus.INVESTING,
    },
  });

  console.log("✅ Funds created");

  // ─── Portfolio Companies ──────────────────────────────────────────────────

  const companies = await Promise.all([
    prisma.company.upsert({
      where: { id: "company-saascore" },
      update: {},
      create: {
        id: "company-saascore",
        name: "SaasCore",
        sector: Sector.TECHNOLOGY,
        country: "France",
        website: "https://saascore.example.com",
        description: "ERP cloud leader for mid-market industrial companies",
        foundedYear: 2012,
        employeeCount: 340,
        revenue: 45.2,
        ebitda: 12.1,
        status: CompanyStatus.ACTIVE,
      },
    }),
    prisma.company.upsert({
      where: { id: "company-medtech" },
      update: {},
      create: {
        id: "company-medtech",
        name: "MedTech Solutions",
        sector: Sector.HEALTHCARE,
        country: "Germany",
        description: "Diagnostics software and connected devices for clinics",
        foundedYear: 2009,
        employeeCount: 520,
        revenue: 78.4,
        ebitda: 19.6,
        status: CompanyStatus.ACTIVE,
      },
    }),
    prisma.company.upsert({
      where: { id: "company-logipro" },
      update: {},
      create: {
        id: "company-logipro",
        name: "LogiPro",
        sector: Sector.INDUSTRIALS,
        country: "France",
        description: "Supply chain optimization SaaS for manufacturers",
        foundedYear: 2014,
        employeeCount: 180,
        revenue: 28.7,
        ebitda: 7.2,
        status: CompanyStatus.ACTIVE,
      },
    }),
    prisma.company.upsert({
      where: { id: "company-fintech-ex" },
      update: {},
      create: {
        id: "company-fintech-ex",
        name: "PayBridge",
        sector: Sector.FINANCIAL_SERVICES,
        country: "Netherlands",
        description: "B2B payments infrastructure — EXITED via trade sale",
        foundedYear: 2010,
        employeeCount: 95,
        status: CompanyStatus.EXITED,
      },
    }),
  ]);

  console.log("✅ Portfolio companies created");

  // ─── Investments ──────────────────────────────────────────────────────────

  await Promise.all([
    prisma.investment.upsert({
      where: { id: "inv-saascore" },
      update: {},
      create: {
        id: "inv-saascore",
        fundId: fund1.id,
        companyId: companies[0].id,
        entryDate: new Date("2020-03-15"),
        investedAmount: 42.0,
        currentValue: 98.5,
        ownershipPct: 72,
        instrumentType: InstrumentType.EQUITY,
        entryEvMultiple: 7.2,
      },
    }),
    prisma.investment.upsert({
      where: { id: "inv-medtech" },
      update: {},
      create: {
        id: "inv-medtech",
        fundId: fund1.id,
        companyId: companies[1].id,
        entryDate: new Date("2019-11-20"),
        investedAmount: 68.0,
        currentValue: 145.0,
        ownershipPct: 65,
        instrumentType: InstrumentType.EQUITY,
        entryEvMultiple: 8.5,
      },
    }),
    prisma.investment.upsert({
      where: { id: "inv-logipro" },
      update: {},
      create: {
        id: "inv-logipro",
        fundId: fund2.id,
        companyId: companies[2].id,
        entryDate: new Date("2022-06-10"),
        investedAmount: 35.0,
        currentValue: 52.0,
        ownershipPct: 45,
        instrumentType: InstrumentType.PREFERRED_EQUITY,
        entryEvMultiple: 11.2,
      },
    }),
    prisma.investment.upsert({
      where: { id: "inv-paybridge" },
      update: {},
      create: {
        id: "inv-paybridge",
        fundId: fund1.id,
        companyId: companies[3].id,
        entryDate: new Date("2018-04-01"),
        exitDate: new Date("2023-09-30"),
        investedAmount: 25.0,
        currentValue: 0,
        ownershipPct: 80,
        instrumentType: InstrumentType.EQUITY,
        entryEvMultiple: 6.0,
        exitEvMultiple: 12.5,
        notes: "Trade sale to Nordic Payments Group at 3.1x MOIC",
      },
    }),
  ]);

  console.log("✅ Investments created");

  // ─── Valuations ───────────────────────────────────────────────────────────

  const valuationDates = [
    new Date("2022-12-31"),
    new Date("2023-06-30"),
    new Date("2023-12-31"),
    new Date("2024-06-30"),
    new Date("2024-12-31"),
  ];

  const valuationNAVs = {
    "company-saascore": [55, 68, 78, 89, 98.5],
    "company-medtech": [85, 102, 118, 132, 145],
    "company-logipro": [38, 42, 46, 49, 52],
  };

  for (const [companyId, navs] of Object.entries(valuationNAVs)) {
    for (let i = 0; i < valuationDates.length; i++) {
      await prisma.valuation.create({
        data: {
          companyId,
          valuationDate: valuationDates[i],
          nav: navs[i],
          methodology: ValuationMethod.COMPARABLE_COMPANIES,
          evMultiple: 8 + Math.random() * 3,
        },
      });
    }
  }

  console.log("✅ Valuations created");

  // ─── KPI Snapshots ────────────────────────────────────────────────────────

  const kpiPeriods = [
    new Date("2023-12-31"),
    new Date("2024-03-31"),
    new Date("2024-06-30"),
    new Date("2024-09-30"),
    new Date("2024-12-31"),
  ];

  const saascoreKPIs = [
    { revenue: 38.1, ebitda: 9.5, ebitdaMargin: 24.9, revenueGrowth: 18.2, headcount: 290, arr: 40.2, nrr: 112 },
    { revenue: 40.8, ebitda: 10.2, ebitdaMargin: 25.0, revenueGrowth: 20.1, headcount: 310, arr: 43.1, nrr: 115 },
    { revenue: 42.5, ebitda: 11.1, ebitdaMargin: 26.1, revenueGrowth: 19.8, headcount: 320, arr: 44.8, nrr: 114 },
    { revenue: 44.1, ebitda: 11.8, ebitdaMargin: 26.8, revenueGrowth: 18.5, headcount: 335, arr: 46.2, nrr: 116 },
    { revenue: 45.2, ebitda: 12.1, ebitdaMargin: 26.8, revenueGrowth: 18.6, headcount: 340, arr: 47.5, nrr: 117 },
  ];

  for (let i = 0; i < kpiPeriods.length; i++) {
    await prisma.kpiSnapshot.upsert({
      where: {
        companyId_periodDate: {
          companyId: companies[0].id,
          periodDate: kpiPeriods[i],
        },
      },
      update: {},
      create: {
        companyId: companies[0].id,
        periodDate: kpiPeriods[i],
        ...saascoreKPIs[i],
      },
    });
  }

  console.log("✅ KPI snapshots created");

  // ─── Deals ────────────────────────────────────────────────────────────────

  const deals = await Promise.all([
    prisma.deal.upsert({
      where: { id: "deal-hrtech" },
      update: {},
      create: {
        id: "deal-hrtech",
        name: "TalentAI",
        stage: DealStage.DUE_DILIGENCE,
        priority: DealPriority.HIGH,
        sector: Sector.TECHNOLOGY,
        country: "France",
        targetRevenue: 32.0,
        targetEbitda: 8.5,
        askingPrice: 110.0,
        creatorId: analyst.id,
        sourceType: SourceType.INTERMEDIARY,
        sourceName: "Rothschild & Co",
        probability: 65,
        expectedCloseDate: new Date("2025-06-30"),
        notes: "HR automation platform with strong NRR of 118%. IC cleared first round.",
      },
    }),
    prisma.deal.upsert({
      where: { id: "deal-healthcare" },
      update: {},
      create: {
        id: "deal-healthcare",
        name: "CareConnect",
        stage: DealStage.FIRST_MEETING,
        priority: DealPriority.MEDIUM,
        sector: Sector.HEALTHCARE,
        country: "Spain",
        targetRevenue: 18.5,
        askingPrice: 65.0,
        creatorId: partner.id,
        sourceType: SourceType.PROPRIETARY,
        probability: 40,
        notes: "Digital care coordination platform. Needs revenue quality validation.",
      },
    }),
    prisma.deal.upsert({
      where: { id: "deal-manufacturing" },
      update: {},
      create: {
        id: "deal-manufacturing",
        name: "AutoMation GmbH",
        stage: DealStage.SCREENING,
        priority: DealPriority.LOW,
        sector: Sector.INDUSTRIALS,
        country: "Germany",
        targetRevenue: 55.0,
        targetEbitda: 8.8,
        askingPrice: 145.0,
        creatorId: analyst.id,
        sourceType: SourceType.INTERMEDIARY,
        sourceName: "Lincoln International",
        probability: 25,
      },
    }),
    prisma.deal.upsert({
      where: { id: "deal-edtech" },
      update: {},
      create: {
        id: "deal-edtech",
        name: "LearnPath",
        stage: DealStage.LOI,
        priority: DealPriority.HIGH,
        sector: Sector.EDUCATION,
        country: "France",
        targetRevenue: 22.0,
        askingPrice: 85.0,
        creatorId: partner.id,
        sourceType: SourceType.PROPRIETARY,
        probability: 75,
        expectedCloseDate: new Date("2025-04-30"),
      },
    }),
    prisma.deal.upsert({
      where: { id: "deal-passed" },
      update: {},
      create: {
        id: "deal-passed",
        name: "OldRetail Co",
        stage: DealStage.PASSED,
        priority: DealPriority.LOW,
        sector: Sector.CONSUMER,
        country: "France",
        targetRevenue: 120.0,
        askingPrice: 180.0,
        creatorId: analyst.id,
        sourceType: SourceType.INTERMEDIARY,
        probability: 0,
        notes: "Passed — declining revenue, no digital transformation roadmap",
      },
    }),
  ]);

  // Add DD items to TalentAI
  await Promise.all([
    prisma.dueDiligence.create({
      data: {
        dealId: deals[0].id,
        workstream: DDWorkstream.FINANCIAL,
        status: DDStatus.COMPLETED,
        findings: "Revenue quality confirmed. 85% recurring, strong cohort retention.",
        riskLevel: "LOW",
      },
    }),
    prisma.dueDiligence.create({
      data: {
        dealId: deals[0].id,
        workstream: DDWorkstream.COMMERCIAL,
        status: DDStatus.IN_PROGRESS,
        findings: "Market sizing ongoing. TAM estimated €4.2B in Europe.",
        riskLevel: "MEDIUM",
      },
    }),
    prisma.dueDiligence.create({
      data: {
        dealId: deals[0].id,
        workstream: DDWorkstream.LEGAL,
        status: DDStatus.NOT_STARTED,
        riskLevel: "MEDIUM",
      },
    }),
  ]);

  console.log("✅ Deals created");

  // ─── LP Relation ──────────────────────────────────────────────────────────

  const lpRelation = await prisma.limitedPartner.upsert({
    where: { userId: lpUser.id },
    update: {},
    create: {
      userId: lpUser.id,
      fundId: fund1.id,
      commitmentSize: 50,
      calledAmount: 32.5,
      distributedAmount: 8.2,
      lpType: LpType.PENSION_FUND,
      country: "France",
    },
  });

  // Capital calls
  await Promise.all([
    prisma.capitalCall.create({
      data: {
        fundId: fund1.id,
        lpId: lpRelation.id,
        callDate: new Date("2020-06-01"),
        dueDate: new Date("2020-06-15"),
        amount: 12.5,
        purpose: "Investment in SaasCore",
        paidAt: new Date("2020-06-14"),
        status: "PAID",
      },
    }),
    prisma.capitalCall.create({
      data: {
        fundId: fund1.id,
        lpId: lpRelation.id,
        callDate: new Date("2022-03-01"),
        dueDate: new Date("2022-03-15"),
        amount: 20.0,
        purpose: "Follow-on investments + fees",
        paidAt: new Date("2022-03-12"),
        status: "PAID",
      },
    }),
  ]);

  // Distributions
  await Promise.all([
    prisma.distribution.create({
      data: {
        fundId: fund1.id,
        lpId: lpRelation.id,
        distributionDate: new Date("2023-12-15"),
        amount: 5.2,
        type: DistributionType.RETURN_OF_CAPITAL,
        notes: "Partial realization from PayBridge exit",
      },
    }),
    prisma.distribution.create({
      data: {
        fundId: fund1.id,
        lpId: lpRelation.id,
        distributionDate: new Date("2024-06-30"),
        amount: 3.0,
        type: DistributionType.DIVIDEND,
        notes: "Interim distribution H1 2024",
      },
    }),
  ]);

  console.log("✅ LP relations, capital calls, distributions created");

  // ─── Notifications ────────────────────────────────────────────────────────

  await prisma.notification.createMany({
    data: [
      {
        userId: partner.id,
        title: "TalentAI — DD Commerciale en cours",
        message: "La DD commerciale sur TalentAI doit être finalisée avant le 15 avril.",
        type: "WARNING",
        link: "/deals",
      },
      {
        userId: partner.id,
        title: "SaasCore — Valorisation Q4 2024",
        message: "La valorisation trimestrielle de SaasCore est disponible.",
        type: "SUCCESS",
        link: "/portfolio/company-saascore",
      },
      {
        userId: analyst.id,
        title: "LearnPath — LOI signée",
        message: "La LOI pour LearnPath a été signée. Démarrer la DD.",
        type: "INFO",
        link: "/deals",
      },
    ],
  });

  console.log("✅ Notifications created");
  console.log("\n🎉 Seed complete!\n");
  console.log("─────────────────────────────");
  console.log("Test accounts:");
  console.log("  PARTNER  → partner@pe-platform.com / password123");
  console.log("  ANALYST  → analyst@pe-platform.com / password123");
  console.log("  CFO      → cfo@pe-platform.com / password123");
  console.log("  LP       → lp@pension-fund.com / password123");
  console.log("─────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
