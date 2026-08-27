import { prisma } from "../../../../../lib/prisma.js";
import { ApiResponse } from "../../../../../lib/utils/ApiResponse.js";
import { asyncHandler } from "../../../../../lib/utils/asyncHandler.js";
import { requirePermission } from "../../../../../lib/withPermission.js";

export const PATCH = asyncHandler(async (req, context) => {
  await requirePermission("settings_manage");

  const { id } = await context.params;
  const formId = Number(id);
  if (!Number.isInteger(formId) || formId <= 0) {
    return Response.json(
      new ApiResponse(400, null, "Missing or invalid form ID"),
      { status: 400 },
    );
  }

  await prisma.formSubmission.updateMany({
    where: { formId, read: false },
    data: { read: true, readAt: new Date() },
  });
  return Response.json(new ApiResponse(200, null, "Marked as read"));
});
