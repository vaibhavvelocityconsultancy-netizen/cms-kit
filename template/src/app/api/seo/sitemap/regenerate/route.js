import { regenerateSitemap } from "@/src/app/lib/services/seo/sitemap.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { requirePermission } from "@/src/app/lib/withPermission";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const POST = asyncHandler(async () => {
  const { session } = await requirePermission("settings_manage");

  const data = await regenerateSitemap(session.user.tenantId);

  return Response.json(
    new ApiResponse(200, data, "Sitemap regenerated successfully"),
    { status: 200 },
  );
});
