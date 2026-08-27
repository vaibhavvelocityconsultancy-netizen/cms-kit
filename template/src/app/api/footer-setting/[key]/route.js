import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import {
  deleteSetting,
  getSetting,
  upsertSetting,
} from "@/src/app/lib/services/settings/footersettings.service.js";
// import { getSetting, upsertSetting, deleteSetting } from "@/app/lib/services/settings.service.js";

// GET /api/settings/[key]
export const GET = asyncHandler(async (req, { params }) => {
  const { key } = await params;
  const value = await getSetting(key);
  if (value === null) throw new ApiError(404, "Setting not found");
  return Response.json(new ApiResponse(200, value, "Setting fetched"));
});

// PUT /api/settings/[key]
export const PUT = asyncHandler(async (req, { params }) => {
  const { key } = await params;
  const { value } = await req.json();
  if (value === undefined) throw new ApiError(400, "Value is required");

  const setting = await upsertSetting(key, value);
  return Response.json(new ApiResponse(200, setting, "Setting updated"));
});

// DELETE /api/settings/[key]
export const DELETE = asyncHandler(async (req, { params }) => {
  const { key } = await params;
  const existing = await getSetting(key);
  if (existing === null) throw new ApiError(404, "Setting not found");

  await deleteSetting(key);
  return Response.json(new ApiResponse(200, null, "Setting deleted"));
});
