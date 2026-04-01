/**
 * Financial calculations for PE metrics
 * IRR, MOIC, DPI, RVPI, TVPI
 */

// ─── MOIC ─────────────────────────────────────────────────────────────────────

/**
 * Multiple on Invested Capital
 * MOIC = Current Value / Invested Amount
 */
export function calculateMOIC(investedAmount: number, currentValue: number): number {
  if (investedAmount === 0) return 0;
  return currentValue / investedAmount;
}

// ─── IRR ──────────────────────────────────────────────────────────────────────

/**
 * Internal Rate of Return — Newton-Raphson method
 * cashFlows: array of { date: Date, amount: number }
 * Negative = investment (outflow), positive = return (inflow)
 */
export function calculateIRR(
  cashFlows: Array<{ date: Date; amount: number }>
): number | null {
  if (cashFlows.length < 2) return null;

  // Convert dates to years from first cashflow
  const t0 = cashFlows[0].date.getTime();
  const flows = cashFlows.map((cf) => ({
    t: (cf.date.getTime() - t0) / (365.25 * 24 * 3600 * 1000),
    amount: cf.amount,
  }));

  const npv = (rate: number): number =>
    flows.reduce((sum, { t, amount }) => sum + amount / Math.pow(1 + rate, t), 0);

  const dnpv = (rate: number): number =>
    flows.reduce(
      (sum, { t, amount }) => sum - (t * amount) / Math.pow(1 + rate, t + 1),
      0
    );

  let rate = 0.1; // Initial guess: 10%
  const MAX_ITER = 100;
  const TOLERANCE = 1e-7;

  for (let i = 0; i < MAX_ITER; i++) {
    const n = npv(rate);
    const d = dnpv(rate);

    if (Math.abs(d) < 1e-14) break;

    const newRate = rate - n / d;

    if (Math.abs(newRate - rate) < TOLERANCE) {
      return newRate;
    }
    rate = newRate;
  }

  return null; // Did not converge
}

// ─── Fund-level metrics ───────────────────────────────────────────────────────

/**
 * DPI — Distributions to Paid-In Capital
 * DPI = Total Distributions / Called Capital
 */
export function calculateDPI(distributions: number, calledCapital: number): number {
  if (calledCapital === 0) return 0;
  return distributions / calledCapital;
}

/**
 * RVPI — Residual Value to Paid-In Capital
 * RVPI = NAV / Called Capital
 */
export function calculateRVPI(nav: number, calledCapital: number): number {
  if (calledCapital === 0) return 0;
  return nav / calledCapital;
}

/**
 * TVPI — Total Value to Paid-In Capital
 * TVPI = DPI + RVPI
 */
export function calculateTVPI(dpi: number, rvpi: number): number {
  return dpi + rvpi;
}

// ─── Quarterly returns ─────────────────────────────────────────────────────────

export function quarterlyToAnnualReturn(quarterlyReturn: number): number {
  return Math.pow(1 + quarterlyReturn, 4) - 1;
}

// ─── Gross to net IRR (simplified management fee/carry model) ─────────────────

export function calculateNetIRR(
  grossIRR: number,
  managementFee = 0.02,
  carryRate = 0.2,
  hurdleRate = 0.08
): number {
  // Simplified: net IRR ≈ gross IRR - mgmt fee overhead
  // In practice this requires full cashflow modeling
  const postFeeIRR = grossIRR - managementFee;
  if (postFeeIRR <= hurdleRate) return postFeeIRR;
  return postFeeIRR - (postFeeIRR - hurdleRate) * carryRate;
}

// ─── Holding period ─────────────────────────────────────────────────────────

export function holdingPeriodYears(entryDate: Date, exitDate?: Date): number {
  const end = exitDate ?? new Date();
  return (end.getTime() - entryDate.getTime()) / (365.25 * 24 * 3600 * 1000);
}

// ─── AUM ────────────────────────────────────────────────────────────────────

export function calculateAUM(investments: Array<{ currentValue: number }>): number {
  return investments.reduce((sum, inv) => sum + inv.currentValue, 0);
}
