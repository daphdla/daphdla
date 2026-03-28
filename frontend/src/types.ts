export interface PortfolioCompany {
  id: number
  name: string
  sector: string
  country: string
  entryDate: string
  entryValuation: number
  currentValuation: number
  equity: number
  revenue: number
  ebitda: number
  employees: number
  stage: string
  status: string
  irr: number
  moic: number
  exitDate?: string
  exitValuation?: number
  currency: string
}

export interface Deal {
  id: number
  company: string
  sector: string
  country: string
  stage: string
  targetValuation: number
  targetEquity: number
  revenue: number
  ebitda: number
  contactDate: string
  owner: string
  priority: string
  notes: string
}

export interface LP {
  id: number
  name: string
  type: string
  country: string
  commitment: number
  called: number
  distributed: number
  nav: number
  dpi: number
  tvpi: number
  irr: number
  vintage: number
  currency: string
}

export interface FundMetrics {
  fundName: string
  fundSize: number
  vintage: number
  currency: string
  totalCommitted: number
  totalCalled: number
  totalDistributed: number
  totalNAV: number
  grossIRR: number
  netIRR: number
  grossMOIC: number
  netMOIC: number
  dpi: number
  tvpi: number
  rvpi: number
  portfolioCompanies: number
  activeInvestments: number
  exits: number
  navByQuarter: { quarter: string; nav: number }[]
  sectorAllocation: { sector: string; percentage: number }[]
  geoAllocation: { country: string; percentage: number }[]
}
