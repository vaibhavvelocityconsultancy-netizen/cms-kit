import { prisma } from "../../lib/prisma";
import { requireAuth, requirePermission } from "../../lib/withPermission";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";

export const GET = asyncHandler(async () => {
  await requirePermission("settings_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const content = await prisma.AICrawlContent.findMany({
    where: { tenantId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      contentType: true,
      slug: true,
      title: true,
      wordCount: true,
      updatedAt: true,
    },
  });

  return Response.json(
    new ApiResponse(200, content, "AI Crawl Content fetched successfully"),
  );
});
