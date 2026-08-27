import { getAllFilesAdmin } from "@/src/app/lib/file_sharing/file-sharing.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async () => {
  const files = await getAllFilesAdmin();
  return Response.json(new ApiResponse(200, files, "Files fetched successfully"));
});


