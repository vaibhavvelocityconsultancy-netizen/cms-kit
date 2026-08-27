import { exportRedirectsCsv } from "@/src/app/lib/services/seo/redirects.service";
import { NextResponse } from "next/server";
// import { exportRedirectsCsv } from '@src/app/lib/services/redirects.service';

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const csv = await exportRedirectsCsv({
      isActive: searchParams.get("isActive"),
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="redirects.csv"',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to export redirects" },
      { status: 500 },
    );
  }
}
