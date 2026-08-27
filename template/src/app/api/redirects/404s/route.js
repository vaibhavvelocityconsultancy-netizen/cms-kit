// import { listNotFoundLogs } from '@/src/app/lib/services/redirects.service';
import { listNotFoundLogs } from "@/src/app/lib/services/seo/redirects.service";
import { NextResponse } from "next/server";
// import { listNotFoundLogs } from '@/lib/services/redirects.service';

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { logs, topMissing } = await listNotFoundLogs({
      isResolved: searchParams.get("isResolved"),
      limit: parseInt(searchParams.get("limit") || "50"),
    });

    return NextResponse.json({ success: true, data: logs, topMissing });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch 404 logs" },
      { status: 500 },
    );
  }
}
