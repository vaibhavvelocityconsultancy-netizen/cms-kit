import { getMenuByLocation } from "../../../../lib/services/pages/menu.service.js";
import { asyncHandler } from "../../../../lib/utils/asyncHandler.js";
import { ApiError } from "../../../../lib/utils/ApiError.js";
import { ApiResponse } from "../../../../lib/utils/ApiResponse.js";

const VALID_LOCATIONS = ["header", "footer"];

// GET /api/menus/location/:location
// used in public layout to render header/footer nav
export const GET = asyncHandler(async (req, { params }) => {
  const { location } = await params;

  if (!VALID_LOCATIONS.includes(location)) {
    throw new ApiError(400, "Location must be header or footer");
  }

  const menu = await getMenuByLocation(location);

  if (!menu) {
    throw new ApiError(404, `No menu found for location: ${location}`);
  }

  return Response.json(
    new ApiResponse(200, menu, `${location} menu fetched successfully`),
  );
});
