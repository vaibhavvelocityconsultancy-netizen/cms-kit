import { createTag, getAllTags } from "../../lib/services/posts/tag.service";
import { ApiError } from "../../lib/utils/ApiError";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";

// GET /api/tags
export const GET = asyncHandler(async () => {
  const tags = await getAllTags();
  return Response.json(new ApiResponse(200, tags, "Tags fetched successfully"));
});

// POST /api/tags
export const POST = asyncHandler(async (req) => {
  const body = await req.json();
  if (!body.name?.trim()) throw new ApiError(400, "Name is required");

  const tag = await createTag(body);
  return Response.json(new ApiResponse(201, tag, "Tag created successfully"), {
    status: 201,
  });
});
