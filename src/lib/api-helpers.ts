import { auth } from "./auth";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Get authenticated session or return 401
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }
  return { session, error: null };
}

/**
 * Require specific roles or return 403
 */
export async function requireRole(...roles: UserRole[]) {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };

  if (!roles.includes(session!.user.role)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }),
    };
  }

  return { session, error: null };
}

/**
 * Write audit log entry (non-blocking)
 */
export async function writeAuditLog(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entity, entityId, metadata: metadata as never },
    });
  } catch {
    // Audit log failure should never block the main operation
    console.error("[AuditLog] Failed to write:", { action, entity, entityId });
  }
}

/**
 * Standard paginated query helper
 */
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20")));
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}
