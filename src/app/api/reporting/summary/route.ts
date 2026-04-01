import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-helpers";
import {
  calculateAUM,
  calculateDPI,
  calculateMOIC,
  calculateRVPI,
  calculateTVPI,
} from "@/lib/financial";

// ─── GET /api/reporting/summary ───────────────────────────────────────────

export async function GET() {
  const { error } = await requireRole("PARTNER", "ANALYST", "CFO");
  if (error) return error;

  const [investments, funds, deals] = await Promise.all([
    prisma.investment.findMany({
      select: {
        investedAmount: true,
        currentValue: true,
        entryDate: true,
        exitDate: true,
        fund: { select: { calledCapital: true } },
      },
    }),
    prisma.fund.findMany({
      select: {
        id: true,
        name: true,
        vintage: true,
        calledCapital: true,
        targetSize: true,
        committedCapital: true,
        _count: { select: { investments: true } },
        distributions: { select: { amount: true } },
      },
    }),
    prisma.deal.groupBy({
      by: ["stage"],
      _count: { stage: true },
    }),
  ]);

  const totalInvested = investments.reduce((s, i) => s + i.investedAmount, 0);
  const totalCurrentValue = investments.reduce((s, i) => s + i.currentValue, 0);
  const totalDistributions = funds.reduce(
    (s, f) => s + f.distributions.reduce((ds, d) => ds + d.amount, 0),
    0
  );
  const totalCalledCapital = funds.reduce((s, f) => s + f.calledCapital, 0);

  const aum = calculateAUM(investments);
  const moic = calculateMOIC(totalInvested, totalCurrentValue);
  const dpi = calculateDPI(totalDistributions, totalCalledCapital);
  const rvpi = calculateRVPI(totalCurrentValue, totalCalledCapital);
  const tvpi = calculateTVPI(dpi, rvpi);

  const activeInvestments = investments.filter((i) => !i.exitDate).length;
  const exits = investments.filter((i) => i.exitDate).length;

  const activeDealsByStage = deals.reduce(
    (acc, d) => {
      acc[d.stage] = d._count.stage;
      return acc;
    },
    {} as Record<string, number>
  );

  return NextResponse.json({
    totalAUM: aum,
    totalInvested,
    totalCurrentValue,
    totalDistributions,
    moic,
    dpi,
    rvpi,
    tvpi,
    activeInvestments,
    exits,
    fundCount: funds.length,
    activeDealsByStage,
    funds: funds.map((f) => ({
      id: f.id,
      name: f.name,
      vintage: f.vintage,
      calledCapital: f.calledCapital,
      targetSize: f.targetSize,
      committedCapital: f.committedCapital,
      companyCount: f._count.investments,
    })),
  });
}
