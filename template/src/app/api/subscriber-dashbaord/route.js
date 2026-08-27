// src/app/api/dashboard/route.js

import { getSubscriberDashboard } from "../../lib/services/common_urls/dashboard.service";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";
import { requireAuth } from "../../lib/withPermission";

// import { getSubscriberDashboard } from "@/src/app/lib/services/dashboard.service";
// import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
// import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
// import { requireAuth } from "@/src/app/lib/withPermission";

export const GET = asyncHandler(async () => {
  const { user } = await requireAuth();

  const dashboard = await getSubscriberDashboard(user.id);

  return Response.json(
    new ApiResponse(200, dashboard, "Dashboard fetched successfully"),
  );
});
