// import { shareFile } from "@/src/app/lib/file_sharing/file-sharing.service";
import { shareFiles } from "@/src/app/lib/file_sharing/file-sharing.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const POST = asyncHandler(async (req, { params }) => {
  const resolvedParams = await params;
  const fileId = resolvedParams?.id?.toString?.();
  
  if (!fileId) {
    throw new ApiError(400, "File ID is required");
  }

  const { email, message, password } = await req.json();
  const { share } = await shareFiles(fileId, { email, message, password });

  return Response.json(
    new ApiResponse(201, { id: share.id }, "File shared successfully"),
  );
});