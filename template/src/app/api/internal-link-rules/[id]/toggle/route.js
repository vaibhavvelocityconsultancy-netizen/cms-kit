import { toggleInternalLinkRule } from "@/src/app/lib/services/seo/internal-link.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const PATCH = asyncHandler(async (req, { params }) => {
  const { id } = await params;

  const rule = await toggleInternalLinkRule(id);
  return Response.json(
    new ApiResponse(
      200,
      rule,
      `Rule ${rule.enabled ? "enabled" : "disabled"} successfully`,
    ),
  );
});
