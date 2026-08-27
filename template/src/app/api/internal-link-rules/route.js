import {
  createInternalLinkRule,
  getInternalLinkRules,
} from "../../lib/services/seo/internal-link.service";
import { ApiError } from "../../lib/utils/ApiError";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";

export const GET = asyncHandler(async (req) => {
  const rules = await getInternalLinkRules();
  if (!rules) throw new ApiError(404, "No internal link rules found");

  return Response.json(
    new ApiResponse(200, rules, "Internal link rules fetched successfully"),
  );
});

export const POST = asyncHandler(async (req) => {
  const input = await req.json();
  if (!input.keyword) throw new ApiError(400, "Keyword is required");

  const rule = await createInternalLinkRule(input);
  return Response.json(
    new ApiResponse(200, rule, "Internal link rule created successfully"),
    { status: 201 },
  );
});
