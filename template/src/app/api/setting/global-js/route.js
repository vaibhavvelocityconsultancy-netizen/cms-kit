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

  if (!settings) throw new ApiError(404, "Global JS not found");

  return Response.json(
    new ApiResponse(
      200,
      {
        js: settings.globalJs || "",
      },
      "Global JS fetched successfully",
    ),
    {
      status: 200,
    },
  );
});

// ──────────────────────────────────────────────
// UPDATE GLOBAL JS
// ──────────────────────────────────────────────
export const PUT = asyncHandler(async (req) => {
  const { js } = await req.json();

  const updated = await updateSettings({ globalJs: js ?? "" });

  if (!updated) throw new ApiError(500, "Failed to update global JS");

  return Response.json(
    new ApiResponse(
      200,
      {
        js: updated.globalJs || "",
      },
      "Global JS updated successfully",
    ),
    {
      status: 200,
    },
  );
});
