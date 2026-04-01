import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, writeAuditLog } from "@/lib/api-helpers";
import { DealStage } from "@prisma/client";
import { z } from "zod";

// ─── GET /api/deals/[id] ──────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireRole("PARTNER", "ANALYST");
  if (error) return error;

  const deal = await prisma.deal.findUnique({
    where: { id: params.id },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignments: { include: { user: { select: { id: true, name: true } } } },
      dueDiligences: true,
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
      documents: { orderBy: { uploadedAt: "desc" } },
      company: { select: { id: true, name: true, sector: true } },
    },
  });

  if (!deal) {
    return NextResponse.json({ error: "Deal introuvable" }, { status: 404 });
  }

  return NextResponse.json(deal);
}

// ─── PATCH /api/deals/[id] ────────────────────────────────────────────────

const updateDealSchema = z.object({
  stage: z.nativeEnum(DealStage).optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  notes: z.string().optional(),
  askingPrice: z.number().positive().optional(),
  expectedCloseDate: z.string().datetime().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireRole("PARTNER", "ANALYST");
  if (error) return error;

  const body = await req.json();
  const parsed = updateDealSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { stage, ...rest } = parsed.data;

  const deal = await prisma.deal.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(stage && { stage }),
      ...(parsed.data.expectedCloseDate && {
        expectedCloseDate: new Date(parsed.data.expectedCloseDate),
      }),
    },
  });

  // Create activity log for stage changes
  if (stage) {
    await prisma.dealActivity.create({
      data: {
        dealId: params.id,
        type: "stage_change",
        description: `Stage modifié vers ${stage}`,
        metadata: { previousStage: deal.stage, newStage: stage },
      },
    });
  }

  await writeAuditLog(session!.user.id, "UPDATE", "deal", params.id, parsed.data);

  return NextResponse.json(deal);
}

// ─── DELETE /api/deals/[id] ───────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireRole("PARTNER");
  if (error) return error;

  await prisma.deal.delete({ where: { id: params.id } });
  await writeAuditLog(session!.user.id, "DELETE", "deal", params.id);

  return new NextResponse(null, { status: 204 });
}
