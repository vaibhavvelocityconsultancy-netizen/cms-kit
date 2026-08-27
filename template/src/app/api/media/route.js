import { getAllMedia } from "../../lib/services/media/media.service";
import { ApiError } from "../../lib/utils/ApiError";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";

export const runtime = "nodejs";

export const GET = asyncHandler(async (req) => {
  const { searchParams } = new URL(req.url);

  const page = searchParams.get("page") || 1;
  const limit = searchParams.get("limit") || 10;
  const search = searchParams.get("search") || "";

  const media = await getAllMedia({
    page,
    limit,
    search,
  });

  return Response.json(
    new ApiResponse(200, media, "Media fetched successfully"),
  );
});
