import { getFormBySlug } from "../../../../lib/services/forms/form.service";
import { ApiError } from "../../../../lib/utils/ApiError";
import { ApiResponse } from "../../../../lib/utils/ApiResponse";
import { asyncHandler } from "../../../../lib/utils/asyncHandler";

export const GET = asyncHandler(async (req, context) => {
  const { slug } = await context.params;
  const form = await getFormBySlug(slug);
  if (!form) {
    throw new ApiError(404, "Form not found");
  }

  return Response.json(new ApiResponse(200, form, "Form fetched"), {
    status: 200,
  });
});
