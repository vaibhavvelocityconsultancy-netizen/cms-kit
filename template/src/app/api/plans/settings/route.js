import {
  getPlanSettings,
  updatePlanSettings,
} from "@/src/app/lib/services/subscription/subscription.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { requirePermission } from "@/src/app/lib/withPermission";

export const GET = asyncHandler(async () => {
  const { session } = await requirePermission("plans_update");
  const settings = await getPlanSettings(session.user.tenantId);
  return Response.json(new ApiResponse(200, settings, "Plan settings fetched"));
});

export const PATCH = asyncHandler(async (req) => {
  const { session } = await requirePermission("plans_update");
  const body = await req.json();
  const settings = await updatePlanSettings(session.user.tenantId, body);
  return Response.json(new ApiResponse(200, settings, "Plan settings updated"));
});
