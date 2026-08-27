import { verifySharePassword } from "@/src/app/lib/file_sharing/file-sharing.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const POST = asyncHandler(async (req, { params }) => {
  const { token } = await params;
  if (!token) throw new ApiError(400, "Token is required");

  const { password } = await req.json();
  if (!password) throw new ApiError(400, "Password is required");

  const result = await verifySharePassword(token, password);
  return Response.json(new ApiResponse(200, result, "Unlocked successfully"));
});