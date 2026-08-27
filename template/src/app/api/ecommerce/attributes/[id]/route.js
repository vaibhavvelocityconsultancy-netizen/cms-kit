import {
  deleteAttribute,
  getAttributeById,
  updateAttribute,
} from "@/src/app/lib/services/ecommerce/ecom.attributes.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async (_r, { params }) => {
  const { id } = await params;
  return Response.json(new ApiResponse(200, await getAttributeById(id), "OK"));
});

export const PATCH = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const body = await req.json();
  return Response.json(
    new ApiResponse(200, await updateAttribute(id, body), "Attribute updated"),
  );
});

export const DELETE = asyncHandler(async (_r, { params }) => {
  const { id } = await params;
  return Response.json(
    new ApiResponse(200, await deleteAttribute(id), "Attribute deleted"),
  );
});
