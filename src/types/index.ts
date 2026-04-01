import { UserRole } from "@prisma/client";

// ─── Common ────────────────────────────────────────────────────────────────

export type ApiResponse<T> = {
  data: T;
  error?: never;
} | {
  data?: never;
  error: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ─── Auth ──────────────────────────────────────────────────────────────────

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: UserRole;
};

// ─── Dashboard KPIs ────────────────────────────────────────────────────────

export type FundKPIs = {
  fundId: string;
  fundName: string;
  aum: number;                // EUR millions
  investedCapital: number;
  totalValue: number;
  moic: number;
  grossIrr: number;           // %
  dpi: number;
  rvpi: number;
  tvpi: number;
  numberOfCompanies: number;
  unrealizedValue: number;
  realizedValue: number;
};

export type PortfolioSummary = {
  totalAUM: number;
  totalInvested: number;
  totalCurrentValue: number;
  weightedMOIC: number;
  grossIRR: number;
  activeInvestments: number;
  exits: number;
  fundCount: number;
};

// ─── Portfolio ────────────────────────────────────────────────────────────

export type CompanyWithInvestments = {
  id: string;
  name: string;
  sector: string;
  country: string;
  status: string;
  logoUrl?: string | null;
  investments: Array<{
    id: string;
    fundId: string;
    investedAmount: number;
    currentValue: number;
    ownershipPct: number;
    entryDate: Date;
    exitDate?: Date | null;
    instrumentType: string;
  }>;
  latestValuation?: {
    nav: number;
    valuationDate: Date;
    methodology: string;
  } | null;
  moic?: number;
  irr?: number | null;
};

// ─── Deal Flow ────────────────────────────────────────────────────────────

export type DealWithDetails = {
  id: string;
  name: string;
  stage: string;
  priority: string;
  sector?: string | null;
  country?: string | null;
  targetRevenue?: number | null;
  askingPrice?: number | null;
  probability: number;
  expectedCloseDate?: Date | null;
  sourceType: string;
  sourceName?: string | null;
  createdAt: Date;
  creator: { id: string; name: string };
  assignments: Array<{ user: { id: string; name: string } }>;
  _count: { dueDiligences: number; documents: number };
};

export type PipelineStageCount = {
  stage: string;
  count: number;
  totalValue: number;
};

// ─── Reporting ────────────────────────────────────────────────────────────

export type ValuationTimeSeries = {
  date: string;
  nav: number;
  invested: number;
};

export type SectorAllocation = {
  sector: string;
  value: number;
  percentage: number;
};

export type PerformanceByVintage = {
  vintage: number;
  moic: number;
  irr: number;
  dpi: number;
};
