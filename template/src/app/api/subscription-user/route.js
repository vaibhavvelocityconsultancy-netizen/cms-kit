import { asyncHandler } from "../../lib/utils/asyncHandler";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { ApiError } from "../../lib/utils/ApiError";
import { requirePermission } from "../../lib/withPermission";
import { getSubscriberUsers } from "../../lib/services/subscription/subscription.service";

export const GET = asyncHandler(async (req) => {
  await requirePermission("subscriber_upload_files_info");

  const user = await getSubscriberUsers();

  if (!user) {
    throw new ApiError(404, "No subscriber users found");
  }

  return Response.json(
    new ApiResponse(200, user, "Subscriber users fetched successfully"),
  );
});
