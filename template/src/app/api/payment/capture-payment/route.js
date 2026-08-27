import {
  capturePayment,
  getPayment,
} from "@/src/app/lib/services/common_urls/payment.service";
import {
  createEnrollment,
  createSubscription,
} from "@/src/app/lib/services/subscription/subscription.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { requireAuth } from "@/src/app/lib/withPermission";

export const POST = asyncHandler(async (req) => {
  await requireAuth();

  const { orderId } = await req.json();
  if (!orderId) throw new ApiError(400, "Order ID is required");

  await capturePayment(orderId);
  const payment = await getPayment(orderId);
  if (!payment) throw new ApiError(404, "Payment not found");

  const access =
    payment.billingCycle === "LIFETIME"
      ? await createEnrollment(payment.userId, payment.planId)
      : await createSubscription(
          payment.userId,
          payment.planId,
          payment.billingCycle,
        );

  return Response.json(
    new ApiResponse(200, access, "Payment captured successfully"),
  );
});
