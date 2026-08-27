import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { getPublicPageBySlug } from "@/src/app/lib/services/common_urls/public.service";

export const GET = asyncHandler(async (req, { params }) => {
  const { slug } = await params;

  if (!slug) {
    throw new ApiError(400, "Slug is required");
  }

  const page = await getPublicPageBySlug(slug);

  if (!page) {
    throw new ApiError(404, "Page not found");
  }

  return Response.json(new ApiResponse(200, page, "Page fetched successfully"));
});
