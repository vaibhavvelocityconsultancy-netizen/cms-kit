import { BulkDeleteCategories } from "@/src/app/lib/services/posts/category.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const DELETE = asyncHandler(async (req) => {
  const body = await req.json();

  const ids = body.ids;

  if (!Array.isArray(ids) || !ids.length) {
    throw new ApiError(400, "Ids array is required");
  }

  const result = await BulkDeleteCategories(ids);

  return Response.json(
    new ApiResponse(200, result, "Categories deleted successfully"),
  );
});
