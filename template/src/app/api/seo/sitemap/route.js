// import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
// import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
// import { requirePermission } from "../../lib/withPermission";
// import {
//   getSitemapSettings,
//   updateSitemapSettings,
// } from "../../lib/seo/sitemap.service";

import {
  getSitemapSettings,
  updateSitemapSettings,
} from "@/src/app/lib/services/seo/sitemap.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { requirePermission } from "@/src/app/lib/withPermission";

export const GET = asyncHandler(async () => {
  const { session } = await requirePermission("settings_manage");

  const data = await getSitemapSettings(session.user.tenantId);

  return Response.json(new ApiResponse(200, data, "Sitemap settings fetched"), {
    status: 200,
  });
});

export const PUT = asyncHandler(async (request) => {
  const { session } = await requirePermission("settings_manage");

  const body = await request.json();

  const data = await updateSitemapSettings(body, session.user.tenantId);

  return Response.json(new ApiResponse(200, data, "Sitemap settings updated"), {
    status: 200,
  });
});
