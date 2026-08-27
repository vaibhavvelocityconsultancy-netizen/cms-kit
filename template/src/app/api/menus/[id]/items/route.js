import {
  addMenuItem,
  reorderMenuItems,
} from "@/src/app/lib/services/pages/menu.service.js";
import { ApiError } from "@/src/app/lib/utils/ApiError.js";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse.js";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler.js";

// POST /api/menus/:id/items - add item to menu
export const POST = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const itemData = await req.json();

  if (!itemData.label) {
    throw new ApiError(400, "Item label is required");
  }

  const item = await addMenuItem(id, itemData).catch((err) => {
    if (err.statusCode) {
      throw err;
    }

    if (err.message === "Menu not found") {
      throw new ApiError(404, "Menu not found");
    }

    throw new ApiError(400, err.message);
  });

  return Response.json(
    new ApiResponse(201, item, "Menu item added successfully"),
    { status: 201 },
  );
});

// PUT /api/menus/:id/items - reorder menu items
export const PUT = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const { items } = await req.json();

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Items must be a non-empty array");
  }

  const updatedItems = await reorderMenuItems(Number(id), items).catch(
    (err) => {
      if (err.statusCode) {
        throw err;
      }

      throw new ApiError(400, err.message);
    },
  );

  return Response.json(
    new ApiResponse(200, updatedItems, "Menu items reordered successfully"),
  );
});
