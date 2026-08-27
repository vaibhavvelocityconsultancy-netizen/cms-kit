import {
  createEnrollment,
  createSubscription,
  getUserCurrentAccess,
  getUserPlanAccess,
} from "../../lib/services/subscription/subscription.service";
import { ApiError } from "../../lib/utils/ApiError";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";
import { requireAuth } from "../../lib/withPermission";

export const GET = asyncHandler(async (req) => {
  const { user } = await requireAuth();
  const { searchParams } = new URL(req.url);
  const planId = searchParams.get("planId") || searchParams.get("courseId");

  if (!planId) {
    const access = await getUserCurrentAccess(user.id);

    if (!access.record) {
      return Response.json(
        new ApiResponse(200, null, "No subscription found for this user"),
      );
    }

    return Response.json(
      new ApiResponse(200, access.record, "Subscription fetched successfully"),
    );
  }

  const access = await getUserPlanAccess(user.id, Number(planId));

  if (access.type === null) {
    return Response.json(
      new ApiResponse(
        200,
        null,
        "No subscription found for this user and plan",
      ),
    );
  }

  return Response.json(
    new ApiResponse(200, access.record, "Subscription fetched successfully"),
  );
});

export const POST = asyncHandler(async (req) => {
  const { user } = await requireAuth();

  const body = await req.json();
  const { planId, billingCycle } = body;

  if (!planId) {
    throw new ApiError(400, "Plan ID is required");
  }

  const validCycle = ["MONTHLY", "YEARLY", "LIFETIME"];
  if (!validCycle.includes(billingCycle)) {
    throw new ApiError(400, "Invalid billing cycle");
  }

  const result =
    billingCycle === "LIFETIME"
      ? await createEnrollment(user.id, planId)
      : await createSubscription(user.id, planId, billingCycle);

  return Response.json(
    new ApiResponse(201, result, "Subscription created successfully"),
    { status: 201 },
  );
});
