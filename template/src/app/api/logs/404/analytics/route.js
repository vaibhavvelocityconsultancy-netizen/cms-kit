// app/api/logs/404/analytics/route.ts
// import { prisma } from "@/src/lib/prisma";
import { prisma } from "@/src/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [total, unresolved, topPaths] = await Promise.all([
      prisma.notFoundLog.count({
        where: { occurredAt: { gte: thirtyDaysAgo } },
      }),
      prisma.notFoundLog.count({
        where: {
          occurredAt: { gte: thirtyDaysAgo },
          isResolved: false,
        },
      }),
      prisma.notFoundLog.groupBy({
        by: ["path"],
        where: { occurredAt: { gte: thirtyDaysAgo } },
        _count: true,
        orderBy: { _count: { path: "desc" } },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      data: {
        total404s: total,
        unresolved,
        resolved: total - unresolved,
        topPaths: topPaths.map((p) => ({
          path: p.path,
          count: p._count,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to fetch 404 analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}