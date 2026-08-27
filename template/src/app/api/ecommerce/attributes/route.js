import {
  createAttribute,
  getAllAttributes,
} from "@/src/app/lib/services/ecommerce/ecom.attributes.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async () => {
  const attributes = await getAllAttributes();
  return Response.json(new ApiResponse(200, { attributes }, "OK"));
});

export const POST = asyncHandler(async (req) => {
  const row = await createAttribute(await req.json());
  return Response.json(new ApiResponse(201, row, "Attribute created"));
});
