import { NextResponse } from "next/server";
import { getRedirectStats } from "@/src/app/lib/services/seo/redirects.service";

export async function GET() {
  try {
    const stats = await getRedirectStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching redirect stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
