import { createEcommercePayment } from "@/src/app/lib/services/ecommerce/ecom.checkout.service.js";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse.js";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler.js";

export const POST = asyncHandler(async () =>
  Response.json(
    new ApiResponse(
      200,
      await createEcommercePayment(),
      "Ecommerce payment created",
    ),
  ),
);

export const dynamic = "force-dynamic";
