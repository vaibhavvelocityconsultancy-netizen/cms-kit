import {
  getPricingPageSettings,
  updatePricingPageSettings,
} from "../../lib/services/pages/pricingpage.service";
import { ApiError } from "../../lib/utils/ApiError";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";

// GET /api/pricing-page-settings
export const GET = asyncHandler(async () => {
  const settings = await getPricingPageSettings();

  return Response.json(
    new ApiResponse(
      200,
      settings,
      "Pricing page settings fetched successfully",
    ),
  );
});

// PUT /api/pricing-page-settings
export const PUT = asyncHandler(async (req) => {
  const body = await req.json();

  if (
    body.formId !== null &&
    body.formId !== undefined &&
    (!Number.isInteger(Number(body.formId)) || Number(body.formId) <= 0)
  ) {
    throw new ApiError(400, "Invalid formId");
  }

  const settings = await updatePricingPageSettings({
    formId:
      body.formId === null || body.formId === undefined
        ? null
        : Number(body.formId),
  });

  return Response.json(
    new ApiResponse(
      200,
      settings,
      "Pricing page settings updated successfully",
    ),
  );
});
