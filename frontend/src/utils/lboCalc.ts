export interface LBOInputs {
  entryEBITDA: number
  exitEBITDA: number
  entryMultiple: number
  exitMultiple: number
  leverageRatio: number   // 0–1
  holdingPeriod: number   // years
}

export interface LBOOutputs {
  entryEV: number
  equityInvested: number
  initialDebt: number
  exitEV: number
  remainingDebt: number
  debtRepaid: number
  exitEquity: number
  moic: number
  irr: number             // percentage
  equityMultiple: number
}

/**
 * Simplified LBO calculation (illustrative model).
 * Debt amortization: ~8% of initial debt per year (P&I sweep approximation).
 */
export function calculateLBO(inputs: LBOInputs): LBOOutputs {
  const { entryEBITDA, exitEBITDA, entryMultiple, exitMultiple, leverageRatio, holdingPeriod } = inputs

  const entryEV = entryEBITDA * entryMultiple
  const initialDebt = entryEV * leverageRatio
  const equityInvested = entryEV - initialDebt

  const exitEV = exitEBITDA * exitMultiple

  // Simplified annual debt paydown: 8% of initial debt per year (cash sweep)
  const annualPaydown = initialDebt * 0.08
  const debtRepaid = Math.min(annualPaydown * holdingPeriod, initialDebt)
  const remainingDebt = initialDebt - debtRepaid

  const exitEquity = Math.max(0, exitEV - remainingDebt)
  const moic = equityInvested > 0 ? exitEquity / equityInvested : 0
  const irr = moic > 0 ? (Math.pow(moic, 1 / holdingPeriod) - 1) * 100 : 0

  return {
    entryEV,
    equityInvested,
    initialDebt,
    exitEV,
    remainingDebt,
    debtRepaid,
    exitEquity,
    moic,
    irr,
    equityMultiple: moic
  }
}
