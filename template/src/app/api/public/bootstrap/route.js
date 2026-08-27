import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { getPublicBootstrapData } from "@/src/app/lib/services/common_urls/public.service";

export const GET = asyncHandler(async () => {
  const bootstrap = await getPublicBootstrapData();
  return Response.json(
    new ApiResponse(
      200,
      bootstrap,
      "Public bootstrap data fetched successfully",
    ),
  );
});
