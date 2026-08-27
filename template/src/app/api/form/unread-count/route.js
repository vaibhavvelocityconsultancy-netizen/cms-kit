export const dynamic = 'force-dynamic'
import { prisma } from "../../../lib/prisma.js";
import { ApiResponse } from "../../../lib/utils/ApiResponse.js";
import { asyncHandler } from "../../../lib/utils/asyncHandler.js";

export const GET = asyncHandler(async () => {
  const count = await prisma.formSubmission.count({
    where: { read: false },
  });
  return Response.json(new ApiResponse(200, { count }, "Unread count fetched"));
});
