import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, writeAuditLog } from "@/lib/api-helpers";
import { z } from "zod";

// ─── GET /api/kpis?companyId=xxx ──────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { error } = await requireRole("PARTNER", "ANALYST", "CFO");
  if (error) return error;

  const companyId = req.nextUrl.searchParams.get("companyId");
  if (!companyId) {
    return NextResponse.json({ error: "companyId requis" }, { status: 400 });
  }

  const kpis = await prisma.kpiSnapshot.findMany({
    where: { companyId },
    orderBy: { periodDate: "asc" },
  });

  return NextResponse.json(kpis);
}

// ─── POST /api/kpis ───────────────────────────────────────────────────────

const kpiSchema = z.object({
  companyId: z.string().cuid(),
  periodDate: z.string().datetime(),
  revenue: z.number().positive().optional(),
  ebitda: z.number().optional(),
  ebitdaMargin: z.number().optional(),
  revenueGrowth: z.number().optional(),
  headcount: z.number().int().positive().optional(),
  arr: z.number().positive().optional(),
  nrr: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("PARTNER", "ANALYST", "CFO");
  if (error) return error;

  const body = await req.json();
  const parsed = kpiSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const snapshot = await prisma.kpiSnapshot.upsert({
    where: {
      companyId_periodDate: {
        companyId: parsed.data.companyId,
        periodDate: new Date(parsed.data.periodDate),
      },
    },
    update: { ...parsed.data, periodDate: new Date(parsed.data.periodDate) },
    create: { ...parsed.data, periodDate: new Date(parsed.data.periodDate) },
  });

  await writeAuditLog(session!.user.id, "UPSERT", "kpi_snapshot", snapshot.id);

  return NextResponse.json(snapshot, { status: 201 });
}
