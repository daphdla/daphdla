import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-helpers";
import { calculateDPI, calculateMOIC, calculateRVPI, calculateTVPI } from "@/lib/financial";

// ─── GET /api/lp/dashboard ────────────────────────────────────────────────
// Only accessible to LP role users

export async function GET() {
  const { session, error } = await requireRole("LP");
  if (error) return error;

  const lpRelation = await prisma.limitedPartner.findUnique({
    where: { userId: session!.user.id },
    include: {
      fund: {
        include: {
          investments: {
            include: { company: { select: { name: true, sector: true } } },
          },
          distributions: {
            orderBy: { distributionDate: "desc" },
          },
        },
      },
      capitalCalls: {
        orderBy: { callDate: "desc" },
        take: 5,
      },
      distributions: {
        orderBy: { distributionDate: "desc" },
        take: 5,
      },
    },
  });

  if (!lpRelation) {
    return NextResponse.json({ error: "Relation LP introuvable" }, { status: 404 });
  }

  const { fund } = lpRelation;
  const fundTotalInvested = fund.investments.reduce((s, i) => s + i.investedAmount, 0);
  const fundNAV = fund.investments.reduce((s, i) => s + i.currentValue, 0);
  const totalDistributed = fund.distributions.reduce((s, d) => s + d.amount, 0);

  // LP's pro-rata share
  const lpSharePct =
    fund.committedCapital > 0
      ? lpRelation.commitmentSize / fund.committedCapital
      : 0;

  const lpNAV = fundNAV * lpSharePct;
  const lpDistributed = lpRelation.distributedAmount;
  const lpCalled = lpRelation.calledAmount;

  const dpi = calculateDPI(lpDistributed, lpCalled);
  const rvpi = calculateRVPI(lpNAV, lpCalled);
  const tvpi = calculateTVPI(dpi, rvpi);

  return NextResponse.json({
    lp: {
      commitmentSize: lpRelation.commitmentSize,
      calledAmount: lpCalled,
      distributedAmount: lpDistributed,
      remainingCommitment: lpRelation.commitmentSize - lpCalled,
    },
    fund: {
      id: fund.id,
      name: fund.name,
      vintage: fund.vintage,
      strategy: fund.strategy,
      totalCommitted: fund.committedCapital,
      totalCalled: fund.calledCapital,
    },
    metrics: { nav: lpNAV, dpi, rvpi, tvpi },
    recentCapitalCalls: lpRelation.capitalCalls,
    recentDistributions: lpRelation.distributions,
    portfolioCompanies: fund.investments.map((i) => ({
      name: i.company.name,
      sector: i.company.sector,
      investedAmount: i.investedAmount * lpSharePct,
      currentValue: i.currentValue * lpSharePct,
    })),
  });
}
