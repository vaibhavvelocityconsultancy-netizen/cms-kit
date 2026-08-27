import {
  cancelSubscription,
  createEnrollment,
  createSubscription,
} from "@/src/app/lib/services/subscription/subscription.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { requireAuth } from "@/src/app/lib/withPermission";

export const PATCH = asyncHandler(async (req, { params }) => {
  const { user } = await requireAuth();
  const { id } = params;

  const body = await req.json().catch(() => ({}));
  const { planId, billingCycle } = body;

  if (!planId) {
    throw new ApiError(400, "Plan ID is required");
  }

  const validCycle = ["MONTHLY", "YEARLY", "LIFETIME"];
  if (!validCycle.includes(billingCycle)) {
    throw new ApiError(400, "Invalid billing cycle");
  }

  // Cancel the existing subscription tied to this id first.
  // cancelSubscription is keyed by (userId, planId) in the service,
  // so we need the OLD planId — pass it in the body as oldPlanId,
  // or look it up by subscription id if you'd rather key off `id`.
  const { oldPlanId } = body;
  if (oldPlanId) {
    await cancelSubscription(user.id, oldPlanId).catch(() => {
      // already canceled/expired — fine, proceed to create the new one
    });
  }

  const result =
    billingCycle === "LIFETIME"
      ? await createEnrollment(user.id, planId)
      : await createSubscription(user.id, planId, billingCycle);

  return Response.json(
    new ApiResponse(200, result, "Subscription updated successfully"),
  );
});

export const DELETE = asyncHandler(async (req, { params }) => {
  const { user } = await requireAuth();

  const body = await req.json().catch(() => ({}));
  const planId = body.planId ?? params.id;

  if (!planId) {
    throw new ApiError(400, "Plan ID is required");
  }

  const subscription = await cancelSubscription(user.id, planId);

  return Response.json(
    new ApiResponse(200, subscription, "Subscription canceled successfully"),
  );
});
