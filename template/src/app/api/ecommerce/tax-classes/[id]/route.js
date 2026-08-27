import {
  deleteTaxClass,
  getTaxClassById,
  updateTaxClass,
} from "@/src/app/lib/services/ecommerce/ecom.taxes.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async (_r, { params }) => {
  const { id } = await params;
  return Response.json(new ApiResponse(200, await getTaxClassById(id), "OK"));
});
export const PATCH = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  return Response.json(
    new ApiResponse(
      200,
      await updateTaxClass(id, await req.json()),
      "Tax class updated",
    ),
  );
});
export const DELETE = asyncHandler(async (_r, { params }) => {
  const { id } = await params;
  return Response.json(
    new ApiResponse(200, await deleteTaxClass(id), "Tax class deleted"),
  );
});
