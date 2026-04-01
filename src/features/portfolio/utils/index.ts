import { calculateMOIC, calculateIRR, holdingPeriodYears } from "@/lib/financial";

export type InvestmentWithDates = {
  entryDate: Date;
  exitDate?: Date | null;
  investedAmount: number;
  currentValue: number;
};

/**
 * Compute MOIC and IRR for a single investment
 */
export function computeInvestmentMetrics(inv: InvestmentWithDates) {
  const moic = calculateMOIC(inv.investedAmount, inv.currentValue);

  // Simple 2-cashflow IRR: initial investment + current value
  const irr = calculateIRR([
    { date: inv.entryDate, amount: -inv.investedAmount },
    { date: inv.exitDate ?? new Date(), amount: inv.currentValue },
  ]);

  const holdingYears = holdingPeriodYears(inv.entryDate, inv.exitDate ?? undefined);

  return { moic, irr, holdingYears };
}

/**
 * Sector label in French
 */
export const SECTOR_LABELS: Record<string, string> = {
  TECHNOLOGY: "Technologie",
  HEALTHCARE: "Santé",
  FINANCIAL_SERVICES: "Services Financiers",
  CONSUMER: "Consommation",
  INDUSTRIALS: "Industrie",
  ENERGY: "Énergie",
  REAL_ESTATE: "Immobilier",
  MEDIA: "Médias",
  EDUCATION: "Éducation",
  OTHER: "Autre",
};

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  EXITED: "Cédé",
  WRITTEN_OFF: "Déprécié",
  WATCHLIST: "Surveillance",
};

export const INSTRUMENT_LABELS: Record<string, string> = {
  EQUITY: "Capital",
  PREFERRED_EQUITY: "Capital Préférentiel",
  CONVERTIBLE_NOTE: "Obligation Convertible",
  DEBT: "Dette",
  MEZZANINE: "Mezzanine",
  WARRANT: "Bon de Souscription",
};
