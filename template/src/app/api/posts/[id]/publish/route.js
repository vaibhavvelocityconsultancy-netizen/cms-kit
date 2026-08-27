import {
  getPostById,
  publishPost,
} from "@/src/app/lib/services/posts/post.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

// POST /api/posts/[id]/publish
export const POST = asyncHandler(async (req, { params }) => {
  const { id } = await params;

  const existing = await getPostById(id);
  if (!existing) throw new ApiError(404, "Post not found");

  const post = await publishPost(id);
  return Response.json(
    new ApiResponse(200, post, "Post published successfully"),
  );
});
