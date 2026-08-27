import { NextResponse } from "next/server";
import { getRedirectHealth } from "@/src/app/lib/services/seo/redirects.service";

export async function GET() {
  try {
    const health = await getRedirectHealth();
    return NextResponse.json({
      success: true,
      status: "healthy",
      data: health,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: "unhealthy",
        error: "Database connection failed",
      },
      { status: 500 },
    );
  }
}
