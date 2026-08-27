import { getPostBySlug } from "@/src/app/lib/services/posts/post.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async (req, { params }) => {
  const { slug } = await params;

  if (!slug) {
    throw new ApiError(400, "Slug is required");
  }

  const post = await getPostBySlug(slug);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  return Response.json(new ApiResponse(200, post, "Post fetched successfully"));
});
