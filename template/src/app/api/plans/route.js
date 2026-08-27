import {
  createPlan,
  getAllPlans,
} from "../../lib/services/subscription/subscription.service";
import { ApiError } from "../../lib/utils/ApiError";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";
import { requirePermission } from "../../lib/withPermission";

export const GET = asyncHandler(async () => {
  const plans = await getAllPlans();
  return Response.json(
    new ApiResponse(200, plans, "Plans fetched successfully"),
  );
});

export const POST = asyncHandler(async (req) => {
  const { session } = await requirePermission("plans_create");
  const body = await req.json();

  if (!body.title) throw new ApiError(400, "Title is required");

  const plan = await createPlan(session.user.tenantId, body);
  return Response.json(
    new ApiResponse(201, plan, "Plan created successfully"),
    {
      status: 201,
    },
  );
});
