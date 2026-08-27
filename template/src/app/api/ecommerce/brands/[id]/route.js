import {
  deleteBrand,
  getBrandById,
  updateBrand,
} from "@/src/app/lib/services/ecommerce/ecom.brands.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async (_r, { params }) => {
  const { id } = await params;
  return Response.json(new ApiResponse(200, await getBrandById(id), "OK"));
});

export const PATCH = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const body = await req.json();
  return Response.json(
    new ApiResponse(200, await updateBrand(id, body), "Brand updated"),
  );
});

export const DELETE = asyncHandler(async (_r, { params }) => {
  const { id } = await params;
  return Response.json(
    new ApiResponse(200, await deleteBrand(id), "Brand deleted"),
  );
});
