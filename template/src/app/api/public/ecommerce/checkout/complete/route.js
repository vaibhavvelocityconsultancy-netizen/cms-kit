import { completeEcommercePayment } from "@/src/app/lib/services/ecommerce/ecom.checkout.service.js";
import { ApiError } from "@/src/app/lib/utils/ApiError.js";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse.js";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler.js";

export const POST = asyncHandler(async (req) => {
  const { paypalOrderId, shippingAddress, billingAddress } = await req.json();
  if (!paypalOrderId) throw new ApiError(400, "PayPal order ID is required");
  if (!shippingAddress?.country)
    throw new ApiError(400, "Shipping address is required");
  const order = await completeEcommercePayment(
    paypalOrderId,
    shippingAddress,
    billingAddress,
  );
  return Response.json(new ApiResponse(200, order, "Ecommerce order created"));
});

export const dynamic = "force-dynamic";
