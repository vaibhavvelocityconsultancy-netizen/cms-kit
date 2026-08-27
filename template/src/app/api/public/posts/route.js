import { getPublicPosts } from "@/src/app/lib/services/common_urls/public.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async () => {
  const posts = await getPublicPosts();

  return Response.json(
    new ApiResponse(200, posts, "Public posts fetched successfully"),
  );
});
