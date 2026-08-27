import {
  deletePost,
  getPostById,
  updatePost,
} from "@/src/app/lib/services/posts/post.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

// get post by id
export const GET = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) throw new ApiError(404, "Post not found");
  return Response.json(new ApiResponse(200, post, "Post fetched successfully"));
});

// update post
export const PUT = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const body = await req.json();

  const exisiting = await getPostById(id);
  if (!exisiting) throw new ApiError(404, "Post not found");

  const post = await updatePost(id, body);
  return Response.json(new ApiResponse(200, post, "Post updated successfully"));
});

export const DELETE = asyncHandler(async (req, { params }) => {
  // take post id
  const { id } = await params;

  // check if post exists
  const existing = await getPostById(id);
  if (!existing) throw new ApiError(404, "Post not found");

  // if post exists delete
  const delPosts = await deletePost(id);
  return Response.json(
    new ApiResponse(200, delPosts, "Post deleted successfully"),
  );
});
