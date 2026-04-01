import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-helpers";
import { calculateMOIC, calculateIRR } from "@/lib/financial";
import { CompanyStatus, Sector } from "@prisma/client";
import { z } from "zod";

// ─── GET /api/portfolio ───────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { session, error } = await requireRole("PARTNER", "ANALYST", "CFO");
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const sector = searchParams.get("sector") as Sector | null;
  const status = searchParams.get("status") as CompanyStatus | null;
  const search = searchParams.get("search");
  const fundId = searchParams.get("fundId");

  const companies = await prisma.company.findMany({
    where: {
      ...(sector && { sector }),
      ...(status && { status }),
      ...(search && {
        name: { contains: search, mode: "insensitive" },
      }),
      ...(fundId && {
        investments: { some: { fundId } },
      }),
    },
    include: {
      investments: {
        select: {
          id: true,
          fundId: true,
          investedAmount: true,
          currentValue: true,
          ownershipPct: true,
          entryDate: true,
          exitDate: true,
          instrumentType: true,
        },
      },
      valuations: {
        orderBy: { valuationDate: "desc" },
        take: 1,
        select: {
          nav: true,
          valuationDate: true,
          methodology: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Compute MOIC and IRR per company
  const enriched = companies.map((company) => {
    const totalInvested = company.investments.reduce((s, i) => s + i.investedAmount, 0);
    const totalCurrent = company.investments.reduce((s, i) => s + i.currentValue, 0);
    const moic = calculateMOIC(totalInvested, totalCurrent);

    // Use first investment for holding period IRR approximation
    const primaryInv = company.investments[0];
    const irr = primaryInv
      ? calculateIRR([
          { date: primaryInv.entryDate, amount: -totalInvested },
          { date: primaryInv.exitDate ?? new Date(), amount: totalCurrent },
        ])
      : null;

    return {
      ...company,
      moic,
      irr,
      latestValuation: company.valuations[0] ?? null,
    };
  });

  return NextResponse.json(enriched);
}

// ─── POST /api/portfolio ──────────────────────────────────────────────────

const createCompanySchema = z.object({
  name: z.string().min(1).max(200),
  sector: z.enum([
    "TECHNOLOGY", "HEALTHCARE", "FINANCIAL_SERVICES", "CONSUMER",
    "INDUSTRIALS", "ENERGY", "REAL_ESTATE", "MEDIA", "EDUCATION", "OTHER",
  ]),
  country: z.string().min(1),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  foundedYear: z.number().int().min(1800).max(2030).optional(),
  employeeCount: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("PARTNER", "ANALYST");
  if (error) return error;

  const body = await req.json();
  const parsed = createCompanySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const company = await prisma.company.create({
    data: parsed.data,
  });

  return NextResponse.json(company, { status: 201 });
}
