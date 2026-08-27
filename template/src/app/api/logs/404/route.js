// app/api/logs/404/route.js

// import { prisma } from "@/src/lib/prisma";
import { prisma } from "@/src/app/lib/prisma";
import { requirePermission } from "@/src/app/lib/withPermission";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { path, referrer, userAgent } = body;

    console.log("📝 Logging 404:", path);

    const { session } = await requirePermission("settings_manage");

    const tenantId = session.user.tenantId;

    const result = await prisma.notFoundLog.create({
      data: {
        path: (path || "").toLowerCase().replace(/\/$/, "") || "/",
        referrer: referrer || null,
        userAgent: userAgent || null,
        ipAddress: request.headers.get("x-forwarded-for") || null,
        tenantId,
      },
    });

    console.log("✅ 404 logged:", result.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Failed to log 404:", error);

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    );
  }
}
