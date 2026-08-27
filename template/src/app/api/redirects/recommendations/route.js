import { NextResponse } from "next/server";
import { getRedirectRecommendations } from "@/src/app/lib/services/seo/redirects.service";

export async function GET() {
  try {
    const recommendations = await getRedirectRecommendations();
    return NextResponse.json({ success: true, data: recommendations });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch recommendations" },
      { status: 500 },
    );
  }
}
