import { asyncHandler } from "../../../lib/utils/asyncHandler.js";
import { ApiError } from "../../../lib/utils/ApiError.js";
import { ApiResponse } from "../../../lib/utils/ApiResponse.js";
import {
  getMenuById,
  updateMenu,
  deleteMenu,
} from "../../../lib/services/pages/menu.service.js";

const VALID_LOCATIONS = ["header", "footer"];

// GET /api/menus/:id
export const GET = asyncHandler(async (req, { params }) => {
  const { id } = await params;

  const menu = await getMenuById(id);

  if (!menu) {
    throw new ApiError(404, "Menu not found");
  }

  return Response.json(new ApiResponse(200, menu, "Menu fetched successfully"));
});

// PUT /api/menus/:id
export const PUT = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const menuUpdates = await req.json();

  const menu = await getMenuById(id);

  if (!menu) {
    throw new ApiError(404, "Menu not found");
  }

  if (menuUpdates.location && !VALID_LOCATIONS.includes(menuUpdates.location)) {
    throw new ApiError(400, "Location must be header or footer");
  }

  const updatedMenu = await updateMenu(id, menuUpdates);

  return Response.json(
    new ApiResponse(200, updatedMenu, "Menu updated successfully"),
  );
});

// DELETE /api/menus/:id
export const DELETE = asyncHandler(async (req, { params }) => {
  const { id } = await params;

  const menu = await getMenuById(id);

  if (!menu) {
    throw new ApiError(404, "Menu not found");
  }

  await deleteMenu(id);

  return Response.json(new ApiResponse(200, null, "Menu deleted successfully"));
});
