import { createEcommercePayment } from "@/src/app/lib/services/ecommerce/ecom.checkout.service.js";
import { ApiError } from "@/src/app/lib/utils/ApiError.js";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse.js";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler.js";

export const POST = asyncHandler(async (req) => {
  const { provider } = await req.json();
  if (!provider) throw new ApiError(400, "Payment provider is required");
  return Response.json(
    new ApiResponse(
      200,
      await createEcommercePayment(provider),
      "Ecommerce payment created",
    ),
  );
});

export const dynamic = "force-dynamic";