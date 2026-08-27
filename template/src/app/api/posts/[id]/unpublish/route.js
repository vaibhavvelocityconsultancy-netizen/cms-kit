import {
  getPostById,
  unpublishPost,
} from "@/src/app/lib/services/posts/post.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

// unpublish post
export const POST = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const existing = await getPostById(id);
  if (!existing) throw new ApiError(404, "Post not found");
  const post = await unpublishPost(id);
  return Response.json(
    new ApiResponse(200, post, "Post unpublished successfully"),
  );
});
