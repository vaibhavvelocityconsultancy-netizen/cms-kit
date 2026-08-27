import { getDashboardData } from "../../lib/services/common_urls/dashboard.service";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";

export const GET = asyncHandler(async () => {
  const dashboardData = await getDashboardData();

  return Response.json(
    new ApiResponse(200, dashboardData, "Dashboard data fetched successfully"),
    { status: 200 },
  );
});
