import { getUserDetails } from "@/src/app/lib/services/subscription/subscription.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { requirePermission } from "@/src/app/lib/withPermission";

export const GET = asyncHandler(async (req, { params }) => {
  await requirePermission("subscriber_upload_files_info");

  const { id: userId } = await params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const details = await getUserDetails(userId);

  if (!details) {
    throw new ApiError(404, "User not found");
  }

  return Response.json(
    new ApiResponse(200, details, "User details fetched successfully"),
  );
});
