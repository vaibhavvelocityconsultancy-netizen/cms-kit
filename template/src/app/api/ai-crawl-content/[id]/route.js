import { prisma } from "../../../lib/prisma";
import { requireAuth, requirePermission } from "../../../lib/withPermission";
import { ApiError } from "../../../lib/utils/ApiError";
import { ApiResponse } from "../../../lib/utils/ApiResponse";
import { asyncHandler } from "../../../lib/utils/asyncHandler";

export const GET = asyncHandler(async (_req, context) => {
  await requirePermission("settings_manage");

  const session = await requireAuth();
  const tenantId = Number(session.user.tenantId);
  const resolvedParams = await context.params;
  const rawId = resolvedParams?.id;
  const contentId = Number(rawId);

  if (!rawId || !Number.isInteger(contentId) || contentId <= 0) {
    throw new ApiError(400, "Invalid AI Crawl Content id");
  }

  const content = await prisma.AICrawlContent.findFirst({
    where: {
      id: contentId,
      tenantId,
    },
  });

  if (!content) {
    throw new ApiError(404, "AI Crawl Content not found");
  }

  return Response.json(
    new ApiResponse(200, content, "AI Crawl Content fetched successfully"),
  );
});
