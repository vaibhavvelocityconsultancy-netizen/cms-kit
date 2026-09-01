import { completeEcommercePayment } from "@/src/app/lib/services/ecommerce/ecom.checkout.service.js";
import { ApiError } from "@/src/app/lib/utils/ApiError.js";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse.js";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler.js";

export const POST = asyncHandler(async (req) => {
  const { provider, providerOrderId, providerPaymentId, shippingAddress, billingAddress } = await req.json();
  if (!provider) throw new ApiError(400, "Payment provider is required");
  if (!providerOrderId) throw new ApiError(400, "Order ID is required");
  if (!shippingAddress?.country)
    throw new ApiError(400, "Shipping address is required");
  const order = await completeEcommercePayment(
    provider,
    providerOrderId,
    providerPaymentId,
    shippingAddress,
    billingAddress,
  );
  return Response.json(new ApiResponse(200, order, "Ecommerce order created"));
});

export const dynamic = "force-dynamic";