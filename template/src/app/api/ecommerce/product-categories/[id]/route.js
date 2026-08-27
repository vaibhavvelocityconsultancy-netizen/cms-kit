import {
  deleteCategory,
  getCategoryById,
  updateCategory,
} from "@/src/app/lib/services/ecommerce/ecom.categories.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async (_req, { params }) => {
  const { id } = await params;
  const row = await getCategoryById(id);
  return Response.json(new ApiResponse(200, row, "Category fetched"));
});

export const PATCH = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const body = await req.json();
  const row = await updateCategory(id, body);
  return Response.json(new ApiResponse(200, row, "Category updated"));
});

export const DELETE = asyncHandler(async (_req, { params }) => {
  const { id } = await params;
  const res = await deleteCategory(id);
  return Response.json(new ApiResponse(200, res, "Category deleted"));
});
