import { NextResponse } from "next/server";
import { suggestInternalLinkTargetsWithPhrases } from "@/src/app/lib/services/seo/internal-link.service";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceType = searchParams.get("type") || searchParams.get("sourceType");
    const sourceId = searchParams.get("id") || searchParams.get("sourceId");
    const sourceTitle = searchParams.get("sourceTitle") || "";

    if (!sourceType || !sourceId) {
      return NextResponse.json(
        { error: "type/sourceType and id/sourceId query params are required" },
        { status: 400 },
      );
    }

    if (!["page", "post"].includes(sourceType)) {
      return NextResponse.json(
        { error: "type must be 'page' or 'post'" },
        { status: 400 },
      );
    }

    const suggestions = await suggestInternalLinkTargetsWithPhrases(
      sourceType,
      sourceId,
      sourceTitle,
    );

    return NextResponse.json(suggestions);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to get suggestions" },
      { status: err.status ?? 400 },
    );
  }
}
