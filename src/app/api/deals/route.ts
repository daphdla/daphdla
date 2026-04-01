import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, writeAuditLog } from "@/lib/api-helpers";
import { DealPriority, DealStage, Sector, SourceType } from "@prisma/client";
import { z } from "zod";

// ─── GET /api/deals ───────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { session, error } = await requireRole("PARTNER", "ANALYST");
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const stage = searchParams.get("stage") as DealStage | null;
  const priority = searchParams.get("priority") as DealPriority | null;
  const sector = searchParams.get("sector") as Sector | null;
  const search = searchParams.get("search");

  const deals = await prisma.deal.findMany({
    where: {
      ...(stage && { stage }),
      ...(priority && { priority }),
      ...(sector && { sector }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sourceName: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      creator: { select: { id: true, name: true } },
      assignments: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { dueDiligences: true, documents: true } },
    },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(deals);
}

// ─── POST /api/deals ──────────────────────────────────────────────────────

const createDealSchema = z.object({
  name: z.string().min(1).max(200),
  stage: z.nativeEnum(DealStage).default("SCREENING"),
  priority: z.nativeEnum(DealPriority).default("MEDIUM"),
  sector: z.nativeEnum(Sector).optional(),
  country: z.string().optional(),
  targetRevenue: z.number().positive().optional(),
  targetEbitda: z.number().optional(),
  askingPrice: z.number().positive().optional(),
  sourceType: z.nativeEnum(SourceType),
  sourceName: z.string().optional(),
  probability: z.number().int().min(0).max(100).default(50),
  expectedCloseDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { session, error } = await requireRole("PARTNER", "ANALYST");
  if (error) return error;

  const body = await req.json();
  const parsed = createDealSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const deal = await prisma.deal.create({
    data: {
      ...parsed.data,
      creatorId: session!.user.id,
      expectedCloseDate: parsed.data.expectedCloseDate
        ? new Date(parsed.data.expectedCloseDate)
        : undefined,
    },
  });

  await writeAuditLog(session!.user.id, "CREATE", "deal", deal.id, { name: deal.name });

  return NextResponse.json(deal, { status: 201 });
}
