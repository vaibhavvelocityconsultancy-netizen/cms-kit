import { prisma } from "../../../lib/prisma";
import { requireAuth } from "../../../lib/withPermission";
import { ApiResponse } from "../../../lib/utils/ApiResponse";
import { asyncHandler } from "../../../lib/utils/asyncHandler";

export const GET = asyncHandler(async () => {
  const { user } = await requireAuth();

  const categories = await prisma.fileCategory.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      parentId: true,
    },
    
  });

  return Response.json(
    new ApiResponse(200, categories, "Categories fetched successfully"),
  );
});
