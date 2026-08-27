import { expireSubscriptions } from "@/src/app/lib/services/subscription/subscription.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { requireAuth } from "@/src/app/lib/withPermission";

/**
 * POST /api/subscription/expires
 *
 * Manual endpoint to expire subscriptions for the current user.
 * Useful for testing and debugging subscription expiration flow.
 *
 * Authentication: Required (uses current user's ID)
 *
 * Returns: Count of subscriptions expired
 */
export const POST = asyncHandler(async (req) => {
  const { user } = await requireAuth();

  const result = await expireSubscriptions(user.id);

  return Response.json(
    new ApiResponse(
      200,
      result,
      `Subscription expiry check completed for user ${user.id}`,
    ),
  );
});
