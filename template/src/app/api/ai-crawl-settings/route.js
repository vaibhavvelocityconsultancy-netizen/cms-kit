import {
  getAICrawlSettings,
  updateAICrawlSettings,
} from "../../lib/services/seo/ai-crawl-settings.service";
import { ApiError } from "../../lib/utils/ApiError";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";

export const GET = asyncHandler(async () => {
  const settings = await getAICrawlSettings();

  if (!settings) {
    throw new ApiError(404, "AI Crawl Settings not found");
  }

  return Response.json(
    new ApiResponse(200, settings, "AI Crawl Settings fetched successfully"),
  );
});

export const POST = asyncHandler(async (req) => {
  const data = await req.json();
  const settings = await updateAICrawlSettings(data);

  return Response.json(
    new ApiResponse(200, settings, "AI Crawl Settings updated successfully"),
  );
});
