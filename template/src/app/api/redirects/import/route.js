import { NextResponse } from "next/server";
import {
  bulkImportRedirects,
  ServiceError,
} from "@/src/app/lib/services/seo/redirects.service";
import { requirePermission } from "@/src/app/lib/withPermission";

export async function POST(request) {
  try {
    const { session } = await requirePermission("settings_manage");
    const tenantId = session.user.tenantId;
    const body = await request.json();
    const summary = await bulkImportRedirects(body.redirects, tenantId);
    return NextResponse.json({ success: true, summary });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to import redirects" },
      { status: 500 },
    );
  }
}
