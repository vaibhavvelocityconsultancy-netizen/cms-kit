import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { getPublicFooterSettings } from "@/src/app/lib/services/common_urls/public.service";

export const GET = asyncHandler(async () => {
  const footerSettings = await getPublicFooterSettings();
  return Response.json(
    new ApiResponse(
      200,
      footerSettings,
      "Public footer settings fetched successfully",
    ),
  );
});
