import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, writeAuditLog } from "@/lib/api-helpers";
import { calculateMOIC, calculateIRR } from "@/lib/financial";
import { z } from "zod";

// ─── GET /api/portfolio/[id] ──────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireRole("PARTNER", "ANALYST", "CFO");
  if (error) return error;

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      investments: {
        include: { fund: { select: { id: true, name: true, vintage: true } } },
        orderBy: { entryDate: "desc" },
      },
      valuations: {
        orderBy: { valuationDate: "desc" },
        take: 12,
      },
      kpiSnapshots: {
        orderBy: { periodDate: "desc" },
        take: 8,
      },
      documents: {
        orderBy: { uploadedAt: "desc" },
      },
    },
  });

  if (!company) {
    return NextResponse.json({ error: "Entreprise introuvable" }, { status: 404 });
  }

  const totalInvested = company.investments.reduce((s, i) => s + i.investedAmount, 0);
  const totalCurrent = company.investments.reduce((s, i) => s + i.currentValue, 0);
  const moic = calculateMOIC(totalInvested, totalCurrent);

  const primaryInv = company.investments[0];
  const irr = primaryInv
    ? calculateIRR([
        { date: primaryInv.entryDate, amount: -totalInvested },
        { date: primaryInv.exitDate ?? new Date(), amount: totalCurrent },
      ])
    : null;

  return NextResponse.json({ ...company, moic, irr });
}

// ─── PATCH /api/portfolio/[id] ────────────────────────────────────────────

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "EXITED", "WRITTEN_OFF", "WATCHLIST"]).optional(),
  revenue: z.number().optional(),
  ebitda: z.number().optional(),
  employeeCount: z.number().int().positive().optional(),
  description: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireRole("PARTNER", "ANALYST", "CFO");
  if (error) return error;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const company = await prisma.company.update({
    where: { id: params.id },
    data: parsed.data,
  });

  await writeAuditLog(session!.user.id, "UPDATE", "company", params.id, parsed.data);

  return NextResponse.json(company);
}
