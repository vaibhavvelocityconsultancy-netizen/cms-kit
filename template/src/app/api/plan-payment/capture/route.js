import { capturePayment } from "@/src/app/lib/services/common_urls/payment.service";
import {
  createEnrollment,
  createSubscription,
} from "@/src/app/lib/services/subscription/subscription.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { requireAuth } from "@/src/app/lib/withPermission";

export const POST = asyncHandler(async (req) => {
  const { user } = await requireAuth();
  const { paypalOrderId, planId, billingCycle = "MONTHLY", provider = "PAYPAL" } = await req.json();

  if (!paypalOrderId) throw new ApiError(400, "Missing payment order ID");
  if (!planId) throw new ApiError(400, "Plan ID is required");

  await capturePayment(paypalOrderId, provider);

  const result =
    billingCycle === "LIFETIME"
      ? await createEnrollment(user.id, planId)
      : await createSubscription(user.id, planId, billingCycle);

  return Response.json(
    new ApiResponse(200, result, "Payment captured and subscription created"),
  );
});
