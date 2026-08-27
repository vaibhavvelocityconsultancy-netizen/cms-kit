// import { ApiError } from "next/dist/server/api-utils";
import { createPage, getAllPages } from "../../lib/services/pages/page.service";
import { asyncHandler } from "../../lib/utils/asyncHandler";
import { ApiResponse } from "../../lib/utils/ApiResponse.js";
import { ApiError } from "../../lib/utils/ApiError.js";

export const GET = asyncHandler(async (req, res) => {
  const pages = await getAllPages();
  // console.log("DB RESULT:", pages);

  if (!pages) {
    throw new ApiError(404, "No pages found");
  }

  return Response.json(
    new ApiResponse(200, pages, "Pages fetched successfully"),
  );
});

// create pages
export const POST = asyncHandler(async (req, res) => {
  const pageData = await req.json();

  if (!pageData.title) throw new ApiError(400, "Title is required");
  // if (!pageData.html)

  const page = await createPage(pageData);
  return Response.json(
    new ApiResponse(200, page, "Page created successfully"),
    { status: 201 },
  );
});
