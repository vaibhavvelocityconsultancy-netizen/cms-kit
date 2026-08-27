import {
  createCategory,
  getAllCategories,
} from "@/src/app/lib/services/ecommerce/ecom.categories.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async () => {
  const rows = await getAllCategories();
  return Response.json(
    new ApiResponse(200, { categories: rows }, "Categories fetched"),
  );
});

export const POST = asyncHandler(async (req) => {
  const body = await req.json();
  const row = await createCategory(body);
  return Response.json(new ApiResponse(201, row, "Category created"));
});
