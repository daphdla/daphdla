import { CompanyStatus, InstrumentType, Sector, ValuationMethod } from "@prisma/client";

export type PortfolioFilters = {
  sector?: Sector;
  status?: CompanyStatus;
  fundId?: string;
  search?: string;
};

export type ValuationFormData = {
  companyId: string;
  valuationDate: string;
  nav: number;
  methodology: ValuationMethod;
  evMultiple?: number;
  ltmEbitda?: number;
  ltmRevenue?: number;
  notes?: string;
};

export type InvestmentFormData = {
  fundId: string;
  companyId: string;
  entryDate: string;
  investedAmount: number;
  ownershipPct: number;
  instrumentType: InstrumentType;
  entryEvMultiple?: number;
};

export type CompanyFormData = {
  name: string;
  sector: Sector;
  country: string;
  website?: string;
  description?: string;
  foundedYear?: number;
  employeeCount?: number;
};
