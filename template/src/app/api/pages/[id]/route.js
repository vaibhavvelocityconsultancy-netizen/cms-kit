// import { ApiError } from "next/dist/server/api-utils";
import { asyncHandler } from "../../../lib/utils/asyncHandler.js";
import { ApiResponse } from "../../../lib/utils/ApiResponse.js";
import {
  deletePage,
  getPageById,
  publishPage,
  unpublishPage,
  updatePage,
} from "../../../lib/services/pages/page.service.js";
import { ApiError } from "../../../lib/utils/ApiError.js";
import {
  slugToComponentName,
  transformHtmlToReact,
} from "../../../../lib/html-to-react";

// get page by id
export const GET = asyncHandler(async (req, { params }) => {
  const { id } = await params;

  if (!id) {
    throw new ApiError(400, "Page ID is required");
  }

  const findPage = await getPageById(id);

  if (!findPage) {
    throw new ApiError(404, "Page not found");
  }

  return Response.json(
    new ApiResponse(200, findPage, "Page fetched successfully"),
  );
});

// update page by id
export const PUT = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const pageData = await req.json();

  if (!id) {
    throw new ApiError(400, "Page ID is required");
  }

  // handle publish and unpublish status
  if (pageData.action === "publish") {
    const page = await publishPage(id);
    return Response.json(
      new ApiResponse(200, page, "Page Published successfully"),
    );
  }

  if (pageData.action === "unpublish") {
    const page = await unpublishPage(id);
    return Response.json(
      new ApiResponse(200, page, "Page unpublished successfully"),
    );
  }

  const updateData = { ...pageData };

  if (typeof updateData.html === "string" && updateData.html.trim()) {
    const existingPage = await getPageById(id);

    if (!existingPage) {
      throw new ApiError(404, "Page not found");
    }

    const componentName = slugToComponentName(
      updateData.slug || existingPage.slug,
    );
    const conversion = transformHtmlToReact(updateData.html, componentName);

    if (!conversion.success) {
      throw new ApiError(422, "Fix all JSX conversion errors before saving", [
        ...conversion.errors,
        ...conversion.warnings
          .filter((warning) => warning.type === "critical")
          .map((warning) => warning.message),
      ]);
    }

    updateData.jsxCode = conversion.jsxCode;
    updateData.pageType = "jsx";
  }

  const page = await updatePage(id, updateData);
  return Response.json(new ApiResponse(200, page, "Page updated successfully"));
});

// delete page by id
export const DELETE = asyncHandler(async (req, { params }) => {
  const { id } = await params;

  if (!id) {
    throw new ApiError(400, "Page ID is required");
  }

  const page = await deletePage(id);

  if (!page) {
    throw new ApiError(404, "Page not found");
  }

  //   await deletePage(id);

  return Response.json(new ApiResponse(200, page, "Page deleted successfully"));
});
