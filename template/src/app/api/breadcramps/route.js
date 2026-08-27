// ═══════════════════════════════════════════════════════════
// GET BREADCRUMB SETTINGS
// ═══════════════════════════════════════════════════════════

import {
  getBreadcrumbSettings,
  updateBreadcrumbSettings,
} from "../../lib/services/seo/breadcrumb.service";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";

export const GET = asyncHandler(async () => {
  const settings = await getBreadcrumbSettings();

  if (!settings) {
    throw new ApiError(404, "Breadcrumb settings not found");
  }

  return Response.json(
    new ApiResponse(200, settings, "Breadcrumb settings fetched successfully"),
  );
});

// ═══════════════════════════════════════════════════════════
// UPDATE BREADCRUMB SETTINGS
// ═══════════════════════════════════════════════════════════

export const PUT = asyncHandler(async (req) => {
  const body = await req.json();

  const settings = await updateBreadcrumbSettings(body);

  return Response.json(
    new ApiResponse(200, settings, "Breadcrumb settings updated successfully"),
  );
});
