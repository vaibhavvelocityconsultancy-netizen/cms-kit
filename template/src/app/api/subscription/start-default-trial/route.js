import { startDefaultTrial } from "@/src/app/lib/services/subscription/subscription.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { requireAuth } from "@/src/app/lib/withPermission";

export const POST = asyncHandler(async () => {
  const { user } = await requireAuth();
  const subscription = await startDefaultTrial(user.id, user.tenantId);
  return Response.json(new ApiResponse(200, subscription, "Trial started"));
});
