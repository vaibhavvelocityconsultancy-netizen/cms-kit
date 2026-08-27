import { requireAuth } from "@/src/app/lib/withPermission";
import { getPlansWithCurrentSubscription } from "@/src/app/lib/services/subscription/subscription.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async () => {
  const { user } = await requireAuth();

  console.log(user); // <-- Check this

  const data = await getPlansWithCurrentSubscription(user.id);

  return Response.json(
    new ApiResponse(200, data, "Plans fetched successfully"),
  );
});
