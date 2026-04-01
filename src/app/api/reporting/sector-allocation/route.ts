import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireRole("PARTNER", "ANALYST", "CFO");
  if (error) return error;

  const investments = await prisma.investment.findMany({
    include: {
      company: { select: { sector: true } },
    },
  });

  // Aggregate by sector
  const sectorMap = investments.reduce(
    (acc, inv) => {
      const sector = inv.company.sector;
      if (!acc[sector]) acc[sector] = 0;
      acc[sector] += inv.currentValue;
      return acc;
    },
    {} as Record<string, number>
  );

  const total = Object.values(sectorMap).reduce((s, v) => s + v, 0);

  const result = Object.entries(sectorMap)
    .map(([sector, value]) => ({
      sector,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return NextResponse.json(result);
}
