import {
  createBrand,
  getAllBrands,
} from "@/src/app/lib/services/ecommerce/ecom.brands.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async () => {
  const brands = await getAllBrands();
  return Response.json(new ApiResponse(200, { brands }, "Brands fetched"));
});

export const POST = asyncHandler(async (req) => {
  const body = await req.json();
  const row = await createBrand(body);
  return Response.json(new ApiResponse(201, row, "Brand created"));
});
