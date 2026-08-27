// import {
//   getSettings,
//   updateSettings,
// } from "../../lib/services/settings.service";

import {
  getSettings,
  updateSettings,
} from "../../lib/services/settings/setting.service.js";
import { ApiResponse } from "../../lib/utils/ApiResponse.js";
import { asyncHandler } from "../../lib/utils/asyncHandler.js";

// import { ApiResponse } from "../../lib/utils/ApiResponse";
// import { asyncHandler } from "../../lib/utils/asyncHandler";

// ──────────────────────────────────────────────
// GET SETTINGS
// ──────────────────────────────────────────────
export const GET = asyncHandler(async () => {
  const settings = await getSettings();

  return Response.json(
    new ApiResponse(200, settings, "Settings fetched successfully"),
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    },
  );
});

// ──────────────────────────────────────────────
// UPDATE SETTINGS
// ──────────────────────────────────────────────
export const PATCH = asyncHandler(async (req) => {
  const body = await req.json();

  const updatedSettings = await updateSettings(body);

  return Response.json(
    new ApiResponse(200, updatedSettings, "Settings updated successfully"),
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    },
  );
});
