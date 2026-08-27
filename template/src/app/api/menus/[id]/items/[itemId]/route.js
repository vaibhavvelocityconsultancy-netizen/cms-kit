import {
  deleteMenuItem,
  updateMenuItem,
} from "@/src/app/lib/services/pages/menu.service.js";
import { ApiError } from "@/src/app/lib/utils/ApiError.js";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse.js";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler.js";

// PUT /api/menus/:id/items/:itemId — update single item
export const PUT = asyncHandler(async (req, { params }) => {
  const { id, itemId } = await params;
  const itemUpdates = await req.json();

  if (!itemUpdates.label) {
    throw new ApiError(400, "Item label is required");
  }

  const item = await updateMenuItem(id, itemId, itemUpdates).catch((err) => {
    if (err.message === "Menu item not found") {
      throw new ApiError(404, "Menu item not found");
    }

    throw new ApiError(400, err.message);
  });

  return Response.json(
    new ApiResponse(200, item, "Menu item updated successfully"),
  );
});

// DELETE /api/menus/:id/items/:itemId — delete single item
export const DELETE = asyncHandler(async (req, { params }) => {
  const { id, itemId } = await params;

  await deleteMenuItem(id, itemId).catch((err) => {
    if (err.statusCode) {
      throw err;
    }

    if (err.message === "Menu item not found") {
      throw new ApiError(404, "Menu item not found");
    }

    throw new ApiError(400, err.message);
  });

  return Response.json(
    new ApiResponse(200, null, "Menu item deleted successfully"),
  );
});
