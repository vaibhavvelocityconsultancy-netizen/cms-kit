import {
  bulkUpdateCommentStatus,
  bulkDeleteComments,
} from "@/src/app/lib/services/posts/comment.service";

import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";

export const POST = asyncHandler(async (req) => {
  const { ids, action } = await req.json();

  if (!ids?.length || !action) {
    throw new ApiError(400, "ids and action are required");
  }

  if (action === "delete") {
    await bulkDeleteComments(ids);
  } else {
    await bulkUpdateCommentStatus(ids, action);
  }

  return Response.json(
    new ApiResponse(
      200,
      null,
      action === "delete"
        ? "Comments deleted successfully"
        : "Comments updated successfully",
    ),
  );
});
