import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { getPublicMenus } from "@/src/app/lib/services/common_urls/public.service";

export const GET = asyncHandler(async () => {
  const menus = await getPublicMenus();
  return Response.json(
    new ApiResponse(200, menus, "Public menus fetched successfully"),
  );
});
