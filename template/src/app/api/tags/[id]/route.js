import {
  deleteTag,
  getTagById,
  updateTag,
} from "@/src/app/lib/services/posts/tag.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

// GET /api/tags/[id]
export const GET = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const tag = await getTagById(id);
  if (!tag) throw new ApiError(404, "Tag not found");
  return Response.json(new ApiResponse(200, tag, "Tag fetched successfully"));
});

// PUT /api/tags/[id]
export const PUT = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const body = await req.json();

  const existing = await getTagById(id);
  if (!existing) throw new ApiError(404, "Tag not found");

  const tag = await updateTag(id, body);
  return Response.json(new ApiResponse(200, tag, "Tag updated successfully"));
});

// DELETE /api/tags/[id]
export const DELETE = asyncHandler(async (req, { params }) => {
  const { id } = await params;

  const existing = await getTagById(id);
  if (!existing) throw new ApiError(404, "Tag not found");

  await deleteTag(id);
  return Response.json(new ApiResponse(200, null, "Tag deleted successfully"));
});
