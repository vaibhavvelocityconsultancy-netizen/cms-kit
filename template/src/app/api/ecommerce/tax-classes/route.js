import {
  createTaxClass,
  getAllTaxClasses,
} from "@/src/app/lib/services/ecommerce/ecom.taxes.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async () => {
  const taxClasses = await getAllTaxClasses();
  return Response.json(new ApiResponse(200, { taxClasses }, "OK"));
});
export const POST = asyncHandler(async (req) => {
  return Response.json(
    new ApiResponse(
      201,
      await createTaxClass(await req.json()),
      "Tax class created",
    ),
  );
});
