import {
  createFileCategory,
  getAllFileCategories,
} from "../../lib/file_sharing/file-category.service";
import { ApiError } from "../../lib/utils/ApiError";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";

export const GET = asyncHandler(async () => {
  const categories = await getAllFileCategories();
  return Response.json(
    new ApiResponse(200, categories, "Categories fetched Successfully"),
  );
});

export const POST = asyncHandler(async (req) => {
  const body = await req.json();
  if (!body.name?.trim()) throw new ApiError(400, "Name is Required");

  const category = await createFileCategory(body);
  return Response.json(
    new ApiResponse(201, category, "Category created successfully"),
    { status: 201 },
  );
});
