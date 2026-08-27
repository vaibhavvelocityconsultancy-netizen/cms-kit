import { getAdminComments } from "@/src/app/lib/services/posts/comment.service";

import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";

export const dynamic = "force-dynamic";

export const GET = asyncHandler(async (req) => {
  const { searchParams } = new URL(req.url);

  const status = searchParams.get("status") || "all";

  const postId = searchParams.get("postId") || null;

  const search = searchParams.get("search") || null;

  const page = parseInt(searchParams.get("page") || "1");

  const perPage = parseInt(searchParams.get("perPage") || "20");

  const result = await getAdminComments({
    status,
    postId,
    search,
    page,
    perPage,
  });

  return Response.json(
    new ApiResponse(200, result, "Comments fetched successfully"),
  );
});
