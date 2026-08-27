import {
  deleteZone,
  getZoneById,
  updateZone,
} from "@/src/app/lib/services/ecommerce/ecom.shipping.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async (_r, { params }) => {
  const { id } = await params;
  return Response.json(new ApiResponse(200, await getZoneById(id), "OK"));
});
export const PATCH = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  return Response.json(
    new ApiResponse(
      200,
      await updateZone(id, await req.json()),
      "Zone updated",
    ),
  );
});
export const DELETE = asyncHandler(async (_r, { params }) => {
  const { id } = await params;
  return Response.json(
    new ApiResponse(200, await deleteZone(id), "Zone deleted"),
  );
});
