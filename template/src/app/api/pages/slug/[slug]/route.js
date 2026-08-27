import {
  getPageBySlug,
  isSlugAvailable,
} from "../../../../lib/services/pages/page.service.js";
import { ApiError } from "../../../../lib/utils/ApiError.js";
import { ApiResponse } from "../../../../lib/utils/ApiResponse.js";
import { asyncHandler } from "../../../../lib/utils/asyncHandler.js";

// GET page by slug for Next.js 15+
export const GET = asyncHandler(async (request, { params }) => {
  const { slug } = await params; // Need to await params in Next.js 15+

  if (!slug) {
    throw new ApiError(400, "Slug is required");
  }

  const findPage = await getPageBySlug(slug);

  if (!findPage) {
    throw new ApiError(404, "Page not found");
  }

  if (findPage.status !== "PUBLISHED") {
    throw new ApiError(403, "This page is not published yet");
  }

  return Response.json(
    new ApiResponse(200, findPage, "Page fetched successfully"),
  );
});

// POST check slug availability for Next.js 15+
export const POST = asyncHandler(async (request, { params }) => {
  const { slug } = await params; // Need to await params in Next.js 15+
  const body = await request.json();

  if (!slug) {
    throw new ApiError(400, "Slug is required");
  }

  const available = await isSlugAvailable(slug, body.excludeId);

  return Response.json(
    new ApiResponse(
      200,
      { available },
      available ? "Slug is available" : "Slug is already taken",
    ),
  );
});
