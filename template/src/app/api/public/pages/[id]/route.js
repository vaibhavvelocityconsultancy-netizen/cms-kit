import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { getPublicPageById } from "@/src/app/lib/services/common_urls/public.service";

export const GET = asyncHandler(async (req, { params }) => {
  const { id } = await params;

  if (!id) {
    throw new ApiError(400, "Page ID is required");
  }

  const page = await getPublicPageById(id);

  if (!page) {
    throw new ApiError(404, "Page not found");
  }

  return Response.json(
    new ApiResponse(200, page, "Page retrieved successfully"),
  );
});
