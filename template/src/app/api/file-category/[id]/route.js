import {
  deleteFileCategory,
  getFileCategoryById,
  updateFileCategory,
} from "@/src/app/lib/file_sharing/file-category.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async (req, { params }) => {
  const { id } = await params;

  const category = await getFileCategoryById(id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return Response.json(
    new ApiResponse(200, category, "Category fetched Successfully"),
  );
});

export const PUT = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const body = await req.json();

  const category = await updateFileCategory(id, body);
  if (!category) throw new ApiError(404, "Category not found");

  return Response.json(
    new ApiResponse(200, category, "Category updated successfully"),
  );
});


// DELETE /api/file-category/[id]
export const DELETE = asyncHandler(async (req, { params }) => {
  const { id } = await params;

  const deleted = await deleteFileCategory(id);
  if (!deleted) throw new ApiError(404, "Category not found");

  return Response.json(
    new ApiResponse(200, null, "Category deleted successfully"),
  );
});