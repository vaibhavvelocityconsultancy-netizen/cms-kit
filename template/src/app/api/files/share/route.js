import { shareFiles } from "@/src/app/lib/file_sharing/file-sharing.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const POST = asyncHandler(async (req) => {
  const { fileIds, email, message, password } = await req.json();

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    throw new ApiError(400, "At least one file ID is required");
  }

  if (!email || !String(email).trim()) {
    throw new ApiError(400, "Recipient email is required");
  }

  const { share } = await shareFiles(fileIds, {
    email: String(email).trim(),
    message: message?.toString?.() ?? null,
    password: password?.toString?.() || undefined,
  });

  return Response.json(
    new ApiResponse(201, { id: share.id }, "File shared successfully"),
    { status: 201 },
  );
});
