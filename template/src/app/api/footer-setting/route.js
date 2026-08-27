import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import {
  getAllSettings,
  upsertSetting,
} from "../../lib/services/settings/footersettings.service";
// import { getAllSettings, upsertSetting } from "@/app/lib/services/settings.service.js";

// GET /api/settings — get all settings
export const GET = asyncHandler(async () => {
  const settings = await getAllSettings();
  return Response.json(new ApiResponse(200, settings, "Settings fetched"));
});

// POST /api/settings — create or update a setting
export const POST = asyncHandler(async (req) => {
  const { key, value } = await req.json();
  if (!key) throw new ApiError(400, "Key is required");
  if (value === undefined) throw new ApiError(400, "Value is required");

  const setting = await upsertSetting(key, value);
  return Response.json(new ApiResponse(200, setting, "Setting saved"));
});
