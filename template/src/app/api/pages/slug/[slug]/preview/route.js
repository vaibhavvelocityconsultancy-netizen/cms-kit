import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
// import { requireAuth }  from "@/src/lib/withPermission";
// import { getPageBySlug } from "@/lib/services/page.service";
import { requireAuth } from "@/src/app/lib/withPermission";
import { getPageBySlug } from "@/src/app/lib/services/pages/page.service";

// GET /api/pages/slug/[slug]/preview

export const GET = asyncHandler(async (req, { params }) => {
  // Must be logged in to preview drafts
  await requireAuth();

  const page = await getPageBySlug(params.slug, {
    preview: true,
  });

  if (!page) {
    return Response.json(new ApiResponse(404, null, "Page not found"), {
      status: 404,
    });
  }

  return Response.json(
    new ApiResponse(200, page, "Page fetched successfully"),
    {
      status: 200,
    },
  );
});
