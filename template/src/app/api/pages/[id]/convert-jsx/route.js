import { prisma } from "../../../../lib/prisma";
import { ApiError } from "../../../../lib/utils/ApiError";
import { ApiResponse } from "../../../../lib/utils/ApiResponse";
import { asyncHandler } from "../../../../lib/utils/asyncHandler";
import {
  slugToComponentName,
  transformHtmlToReact,
} from "../../../../../lib/html-to-react";

// POST — validate only OR validate + save
export const POST = asyncHandler(async (req, { params }) => {
  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);

  if (!rawId || Number.isNaN(id)) {
    throw new ApiError(400, "Invalid page ID");
  }

  const { html, save } = await req.json();

  if (!html?.trim()) {
    throw new ApiError(400, "HTML is required");
  }

  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) {
    throw new ApiError(404, "Page not found");
  }

  // Run pipeline
  const componentName = slugToComponentName(page.slug);
  const result = transformHtmlToReact(html, componentName);

  // Block save if errors exist
  if (save && !result.success) {
    throw new ApiError(422, "Fix all errors before saving", result.errors);
  }

  // Save to DB
  if (save && result.success) {
    await prisma.page.update({
      where: { id },
      data: {
        jsxCode: result.jsxCode,
        pageType: "jsx",
      },
    });
  }

  return Response.json(
    new ApiResponse(
      200,
      {
        success: result.success,
        jsxCode: result.jsxCode,
        errors: result.errors,
        warnings: result.warnings,
        saved: save && result.success,
      },
      "Conversion completed",
    ),
  );
});
