import { getShareMeta } from "@/src/app/lib/file_sharing/file-sharing.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";


export const GET = asyncHandler(async (req, { params }) => {
  const { token } = await params;
  if (!token) throw new ApiError(400, "Token is required");

  const meta = await getShareMeta(token);
  return Response.json(new ApiResponse(200, meta, "Share meta fetched successfully"));
});