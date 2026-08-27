import { deleteFileAdmin } from "@/src/app/lib/file_sharing/file-sharing.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const DELETE = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  if (!id) throw new ApiError(400, "File ID is required");

  await deleteFileAdmin(id);
  return Response.json(new ApiResponse(200, null, "File deleted successfully"));
});
