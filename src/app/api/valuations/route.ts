import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, writeAuditLog } from "@/lib/api-helpers";
import { ValuationMethod } from "@prisma/client";
import { z } from "zod";

// ─── GET /api/valuations?companyId=xxx ────────────────────────────────────

export async function GET(req: NextRequest) {
  const { error } = await requireRole("PARTNER", "ANALYST", "CFO");
  if (error) return error;

  const companyId = req.nextUrl.searchParams.get("companyId");

  const valuations = await prisma.valuation.findMany({
    where: { ...(companyId && { companyId }) },
    orderBy: { valuationDate: "asc" },
  });

  return NextResponse.json(valuations);
}

// ─── POST /api/valuations ─────────────────────────────────────────────────

const createSchema = z.object({
  companyId: z.string().cuid(),
  valuationDate: z.string().datetime(),
  nav: z.number().positive(),
  methodology: z.nativeEnum(ValuationMethod),
  evMultiple: z.number().positive().optional(),
  ltmEbitda: z.number().optional(),
  ltmRevenue: z.number().positive().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("PARTNER", "ANALYST", "CFO");
  if (error) return error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const valuation = await prisma.valuation.create({
    data: {
      ...parsed.data,
      valuationDate: new Date(parsed.data.valuationDate),
    },
  });

  // Update company's current investment value based on ownership
  const investments = await prisma.investment.findMany({
    where: { companyId: parsed.data.companyId },
  });

  // Pro-rata update based on ownership percentage
  for (const inv of investments) {
    await prisma.investment.update({
      where: { id: inv.id },
      data: { currentValue: parsed.data.nav * (inv.ownershipPct / 100) },
    });
  }

  await writeAuditLog(
    session!.user.id,
    "CREATE",
    "valuation",
    valuation.id,
    { companyId: parsed.data.companyId, nav: parsed.data.nav }
  );

  return NextResponse.json(valuation, { status: 201 });
}
