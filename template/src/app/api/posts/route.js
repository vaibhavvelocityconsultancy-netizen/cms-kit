import { createPost, getAllPosts } from "../../lib/services/posts/post.service";
import { ApiError } from "../../lib/utils/ApiError";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";

export const GET = asyncHandler(async (req) => {
  const posts = await getAllPosts();
  return Response.json(
    new ApiResponse(200, posts, "Posts fetched successfully"),
  );
});

// create post
export const POST = asyncHandler(async (req) => {
  const body = await req.json();

  if (!body.title?.trim()) throw new ApiError(400, "Title is required");
  if (!body.content?.trim()) throw new ApiError(400, "Content is required");

  const post = await createPost(body);
  return Response.json(
    new ApiResponse(200, post, "Post created successfully"),
    {
      status: 201,
    },
  );
});
