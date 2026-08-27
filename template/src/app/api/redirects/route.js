import { NextResponse } from "next/server";
import {
  listRedirects,
  createRedirect,
  ServiceError,
} from "../../lib/services/seo/redirects.service";
import { requirePermission } from "../../lib/withPermission";
// import { listRedirects, createRedirect, ServiceError } from '@/lib/services/redirects.service';

export async function GET(request) {
  try {
    const { session } = await requirePermission("settings_manage");
    const tenantId = session.user.tenantId;
    const searchParams = request.nextUrl.searchParams;
    const redirects = await listRedirects({
      isActive: searchParams.get("isActive"),
      isAutoDetected: searchParams.get("isAutoDetected"),
      search: searchParams.get("search"),
      sortBy: searchParams.get("sortBy") || "createdAt",
      order: searchParams.get("order") || "desc",
      tenantId,
    });

    return NextResponse.json({ success: true, data: redirects });
  } catch (error) {
    console.error("Error fetching redirects:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch redirects" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { session } = await requirePermission("settings_manage");
    const tenantId = session.user.tenantId;
    const body = await request.json();
    const redirect = await createRedirect(body, tenantId);
    return NextResponse.json(
      { success: true, data: redirect },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating redirect:", error);
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create redirect" },
      { status: 500 },
    );
  }
}
