// import {
//   getFooterConfig,
//   updateFooterConfig,
//   resetFooterConfig,
// } from "../../lib/services/footer-config.service";
// import { asyncHandler } from "../../lib/utils/asyncHandler";
// import { ApiResponse } from "../../lib/utils/ApiResponse.js";
// import { ApiError } from "../../lib/utils/ApiError.js";

import {
  getFooterConfig,
  resetFooterConfig,
  updateFooterConfig,
} from "../../lib/services/settings/footer-config.service";
import { ApiError } from "../../lib/utils/ApiError";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";

export const GET = asyncHandler(async (req, res) => {
  const config = await getFooterConfig();
  if (!config) throw new ApiError(404, "Footer config not found");
  return Response.json(
    new ApiResponse(200, config, "Footer config fetched successfully"),
  );
});

export const PUT = asyncHandler(async (req, res) => {
  const body = await req.json();
  const config = await updateFooterConfig(body);
  return Response.json(
    new ApiResponse(200, config, "Footer config updated successfully"),
  );
});

export const DELETE = asyncHandler(async (req, res) => {
  const config = await resetFooterConfig();
  return Response.json(
    new ApiResponse(200, config, "Footer config reset to defaults"),
  );
});
