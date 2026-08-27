// import {
//   getNavbarConfig,
//   updateNavbarConfig,
//   resetNavbarConfig,
// } from "../../lib/services/navbar-config.service";
// import { asyncHandler } from "../../lib/utils/asyncHandler";
// import { ApiResponse } from "../../lib/utils/ApiResponse.js";
// import { ApiError } from "../../lib/utils/ApiError.js";

import {
  getNavbarConfig,
  resetNavbarConfig,
  updateNavbarConfig,
} from "../../lib/services/settings/navbar-config.service";
import { ApiError } from "../../lib/utils/ApiError";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";

export const GET = asyncHandler(async (req, res) => {
  const config = await getNavbarConfig();

  if (!config) {
    throw new ApiError(404, "Navbar config not found");
  }

  return Response.json(
    new ApiResponse(200, config, "Navbar config fetched successfully"),
  );
});

export const PUT = asyncHandler(async (req, res) => {
  const body = await req.json();

  const config = await updateNavbarConfig(body);

  return Response.json(
    new ApiResponse(200, config, "Navbar config updated successfully"),
  );
});

export const DELETE = asyncHandler(async (req, res) => {
  const config = await resetNavbarConfig();

  return Response.json(
    new ApiResponse(200, config, "Navbar config reset to defaults"),
  );
});
