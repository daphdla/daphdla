import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-helpers";
import { calculateMOIC, calculateDPI, calculateIRR } from "@/lib/financial";

export async function GET() {
  const { error } = await requireRole("PARTNER", "ANALYST", "CFO");
  if (error) return error;

  const funds = await prisma.fund.findMany({
    include: {
      investments: true,
      distributions: true,
    },
    orderBy: { vintage: "asc" },
  });

  const vintagePerf = funds.map((fund) => {
    const totalInvested = fund.investments.reduce((s, i) => s + i.investedAmount, 0);
    const totalCurrent = fund.investments.reduce((s, i) => s + i.currentValue, 0);
    const totalDistributed = fund.distributions.reduce((s, d) => s + d.amount, 0);

    const moic = calculateMOIC(totalInvested, totalCurrent + totalDistributed);
    const dpi = calculateDPI(totalDistributed, fund.calledCapital || totalInvested);

    // IRR from fund-level cashflows
    const cashflows = [
      ...fund.investments.map((i) => ({
        date: i.entryDate,
        amount: -i.investedAmount,
      })),
      ...fund.distributions.map((d) => ({
        date: d.distributionDate,
        amount: d.amount,
      })),
      // Current value as terminal cashflow
      {
        date: new Date(),
        amount: totalCurrent,
      },
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    const irr = cashflows.length > 1 ? calculateIRR(cashflows) : null;

    return {
      vintage: fund.vintage,
      fundName: fund.name,
      moic,
      irr: irr ?? 0,
      dpi,
    };
  });

  return NextResponse.json(vintagePerf);
}
