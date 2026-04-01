import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Health check endpoint — used by Docker, load balancers, and uptime monitors
 * Public route — no auth required
 */
export async function GET() {
  const start = Date.now();

  try {
    // Verify DB connectivity with a lightweight query
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        db: "connected",
        responseTime: `${Date.now() - start}ms`,
      },
      {
        status: 200,
        headers: {
          // Never cache health checks
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        db: "unreachable",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
