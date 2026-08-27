// ──────────────────────────────────────────────
// GET GLOBAL CSS

import {
  getSettings,
  updateSettings,
} from "@/src/app/lib/services/settings/setting.service";
import { getPublicSettings } from "@/src/app/lib/services/common_urls/public.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

// ──────────────────────────────────────────────
export const GET = asyncHandler(async () => {
  const settings = await getPublicSettings();

  if (!settings) throw new ApiError(404, "Global CSS not found");

  return Response.json(
    new ApiResponse(
      200,
      {
        css: settings.globalCss || "",
      },
      "Global CSS fetched successfully",
    ),
    {
      status: 200,
    },
  );
});

// ──────────────────────────────────────────────
// UPDATE GLOBAL CSS
// ──────────────────────────────────────────────
export const PUT = asyncHandler(async (req) => {
  const { css } = await req.json();

  const updated = await updateSettings({ globalCss: css ?? "" });

  if (!updated) throw new ApiError(500, "Failed to update global CSS");

  return Response.json(
    new ApiResponse(
      200,
      {
        css: updated.globalCss || "",
      },
      "Global CSS updated successfully",
    ),
    {
      status: 200,
    },
  );
});
