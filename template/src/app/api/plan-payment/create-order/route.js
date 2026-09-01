import { createPayment } from "@/src/app/lib/services/common_urls/payment.service";
import { prisma } from "@/src/app/lib/prisma";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { requireAuth } from "@/src/app/lib/withPermission";

export const POST = asyncHandler(async (req) => {
  const { user } = await requireAuth();
  const { planId, billingCycle = "MONTHLY", provider = "PAYPAL" } = await req.json();

  if (!planId) throw new ApiError(400, "Plan ID is required");

  const plan = await prisma.plan.findUnique({
    where: { id: Number(planId) },
  });

  if (!plan) throw new ApiError(404, "Plan not found");
  if (!plan.isPublished) {
    throw new ApiError(400, "This plan is not currently available");
  }
  if (!plan.price || Number(plan.price) <= 0) {
    throw new ApiError(400, "Free plans do not require PayPal payment");
  }

  const origin = new URL(req.url).origin;
  const order = await createPayment({
    userId: user.id,
    amount: plan.price,
    currency: "USD",
    billingCycle,
    paymentType: "PLAN",
    referenceId: planId,
    returnUrl: `${origin}/checkout?plan=${planId}&billingCycle=${billingCycle}&paypal=return`,
    cancelUrl: `${origin}/checkout?plan=${planId}&billingCycle=${billingCycle}&paypal=cancel`,
  });

  return Response.json(new ApiResponse(200, order, "PayPal order created"));
});
