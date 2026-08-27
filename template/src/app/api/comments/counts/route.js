import { getCommentCounts } from "@/src/app/lib/services/posts/comment.service";

import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";

export const GET = asyncHandler(async () => {
  const counts = await getCommentCounts();

  return Response.json(
    new ApiResponse(200, counts, "Comment counts fetched successfully"),
  );
});
