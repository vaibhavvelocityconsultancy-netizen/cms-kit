import {
  getCommentById,
  updateCommentStatus,
  deleteComment,
} from "@/src/app/lib/services/posts/comment.service";

import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";

export const GET = asyncHandler(async (req, { params }) => {
  const { id } = await params;

  const comment = await getCommentById(id);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  return Response.json(
    new ApiResponse(200, comment, "Comment fetched successfully"),
  );
});

export const PATCH = asyncHandler(async (req, { params }) => {
  const { id } = await params;

  const { status } = await req.json();

  if (!status) {
    throw new ApiError(400, "Status is required");
  }

  const comment = await updateCommentStatus(id, status);

  return Response.json(
    new ApiResponse(200, comment, "Comment updated successfully"),
  );
});

export const DELETE = asyncHandler(async (req, { params }) => {
  const { id } = await params;

  await deleteComment(id);

  return Response.json(
    new ApiResponse(200, null, "Comment deleted successfully"),
  );
});
