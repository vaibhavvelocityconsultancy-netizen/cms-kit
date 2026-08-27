import { cancelSubscription } from "@/src/app/lib/services/subscription/subscription.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { requireAuth } from "@/src/app/lib/withPermission";

const cancelSubscriptionHandler = asyncHandler(async (req) => {
  const { user } = await requireAuth();

  const body = await req.json().catch(() => ({}));
  const { courseId, planId } = body;
  const targetPlanId = planId ?? courseId;

  if (!targetPlanId) {
    throw new ApiError(400, "Plan ID is required");
  }

  const subscription = await cancelSubscription(user.id, targetPlanId);

  return Response.json(
    new ApiResponse(200, subscription, "Subscription canceled successfully"),
  );
});

export const POST = cancelSubscriptionHandler;
export const DELETE = cancelSubscriptionHandler;
