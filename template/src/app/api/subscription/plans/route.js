import { getPublicPlans } from "@/src/app/lib/services/subscription/subscription.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async () => {
  const plans = await getPublicPlans();

  return Response.json(
    new ApiResponse(200, plans, "Plans fetched successfully"),
  );
});
