import {
  deleteInternalLinkRule,
  getInternalLinkRule,
  updateInternalLinkRule,
} from "@/src/app/lib/services/seo/internal-link.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const rule = await getInternalLinkRule(id);
  return Response.json(
    new ApiResponse(200, rule, "Internal link rule fetched successfully"),
  );
});

export const PATCH = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const input = await req.json();

  const rule = await updateInternalLinkRule(id, input);
  return Response.json(
    new ApiResponse(200, rule, "Internal link rule updated successfully"),
  );
});

export const DELETE = asyncHandler(async (req, { params }) => {
  const { id } = await params;

  const rule = await deleteInternalLinkRule(id);
  return Response.json(
    new ApiResponse(200, rule, "Internal link rule deleted successfully"),
  );
});
