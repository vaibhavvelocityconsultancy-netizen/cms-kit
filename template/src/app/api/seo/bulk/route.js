// ─────────────────────────────────────────────
// GET /api/seo/bulk
// ─────────────────────────────────────────────

import {
  getBulkSeo,
  updateBulkSeo,
} from "@/src/app/lib/services/seo/bulk-seo.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { requirePermission } from "@/src/app/lib/withPermission";
// import { requirePermission } from "@/src/app/lib/withPermission";

export const GET = asyncHandler(async () => {
  await requirePermission("settings_manage");

  const data = await getBulkSeo();

  return Response.json(
    new ApiResponse(200, data, "Bulk SEO data fetched successfully"),
    {
      status: 200,
    },
  );
});

// ─────────────────────────────────────────────
// PUT /api/seo/bulk
// ─────────────────────────────────────────────

export const PUT = asyncHandler(async (request) => {
  await requirePermission("settings_manage");

  const body = await request.json();

  const data = await updateBulkSeo(body.items);

  return Response.json(
    new ApiResponse(200, data, "Bulk SEO updated successfully"),
    {
      status: 200,
    },
  );
});
