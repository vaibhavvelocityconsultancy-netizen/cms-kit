import { isPostSlugAvailable } from "@/src/app/lib/services/posts/post.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

// POST /api/posts/slug/[slug]/check
export const POST = asyncHandler(async (req, { params }) => {
  const { slug } = await params;
  const body = await req.json().catch(() => ({}));
  const excludeId = body.excludeId ?? null;

  const available = await isPostSlugAvailable(slug, excludeId);
  return Response.json(new ApiResponse(200, { available }, "Slug checked"));
});
