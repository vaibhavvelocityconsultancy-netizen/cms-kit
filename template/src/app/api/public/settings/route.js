import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { getPublicSettings } from "@/src/app/lib/services/common_urls/public.service";

export const GET = asyncHandler(async () => {
  const settings = await getPublicSettings();
  return Response.json(
    new ApiResponse(200, settings, "Public settings fetched successfully"),
  );
});
