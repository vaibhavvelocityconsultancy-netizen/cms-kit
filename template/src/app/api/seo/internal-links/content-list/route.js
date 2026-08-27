import { NextResponse } from "next/server";
import { getLinkableContentList } from "@/src/app/lib/services/seo/internal-link.service";

export async function GET() {
  try {
    const list = await getLinkableContentList();
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch content list" },
      { status: err.status ?? 400 },
    );
  }
}
