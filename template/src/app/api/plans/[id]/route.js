import {
  deletePlan,
  getPlanById,
  updatePlan,
} from "@/src/app/lib/services/subscription/subscription.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { requirePermission } from "@/src/app/lib/withPermission";

function getPlanId(params, body = {}) {
  const rawId = params?.id ?? body?.id ?? body?.planId;
  const numericId = Number(rawId);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new ApiError(400, "Valid plan ID is required");
  }

  return numericId;
}

export const GET = asyncHandler(async (req, context) => {
  const params = await context.params;
  const planId = getPlanId(params);
  const plan = await getPlanById(planId);
  if (!plan) throw new ApiError(404, "Plan not found");
  return Response.json(new ApiResponse(200, plan, "Plan fetched successfully"));
});

export const PATCH = asyncHandler(async (req, context) => {
  const { session } = await requirePermission("plans_update");

  const params = await context.params;
  const body = await req.json().catch(() => ({}));

  const planId = getPlanId(params, body);

  const { id, ...planData } = body;

  const plan = await updatePlan(planId, session.user.tenantId, planData);

  return Response.json(new ApiResponse(200, plan, "Plan updated successfully"));
});
export const DELETE = asyncHandler(async (req, context) => {
  const { session } = await requirePermission("plans_delete");
  const params = await context.params;
  const body = await req.json().catch(() => ({}));
  const planId = getPlanId(params, body);
  await deletePlan(planId, session.user.tenantId);
  return Response.json(new ApiResponse(200, null, "Plan deleted successfully"));
});
