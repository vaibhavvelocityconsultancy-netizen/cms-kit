import { regenerateAICrawlMarkdown } from "../../lib/services/seo/ai-crawl-settings.service";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";

export const POST = asyncHandler(async () => {
  const result = await regenerateAICrawlMarkdown();

  return Response.json(
    new ApiResponse(200, result, "Markdown files regenerated successfully"),
  );
});
