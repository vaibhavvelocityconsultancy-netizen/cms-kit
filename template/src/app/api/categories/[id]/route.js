import {
  deleteCategory,
  getCategoryById,
  updateCategory,
} from "@/src/app/lib/services/posts/category.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

// GET /api/categories/[id]
export const GET = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const category = await getCategoryById(id);
  if (!category) throw new ApiError(404, "Category not found");
  return Response.json(
    new ApiResponse(200, category, "Category fetched successfully"),
  );
});

// PUT /api/categories/[id]
export const PUT = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const body = await req.json();

  const existing = await getCategoryById(id);
  if (!existing) throw new ApiError(404, "Category not found");

  const category = await updateCategory(id, body);
  return Response.json(
    new ApiResponse(200, category, "Category updated successfully"),
  );
});

// DELETE /api/categories/[id]
export const DELETE = asyncHandler(async (req, { params }) => {
  const { id } = await params;

  const existing = await getCategoryById(id);
  if (!existing) throw new ApiError(404, "Category not found");

  await deleteCategory(id);
  return Response.json(
    new ApiResponse(200, null, "Category deleted successfully"),
  );
});
