import { isSlugAvailable } from "../../../../lib/services/pages/page.service.js";
import { ApiError } from "../../../../lib/utils/ApiError.js";
import { ApiResponse } from "../../../../lib/utils/ApiResponse.js";
import { asyncHandler } from "../../../../lib/utils/asyncHandler.js";

export const POST = asyncHandler(async (request) => {
  const body = await request.json();
  if (typeof body.slug !== "string") {
    throw new ApiError(400, "Slug is required");
  }

  const available = await isSlugAvailable(body.slug.trim(), body.excludeId);
  return Response.json(
    new ApiResponse(
      200,
      { available },
      available ? "Slug is available" : "Slug is already taken",
    ),
  );
});
