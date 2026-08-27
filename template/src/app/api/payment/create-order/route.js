import { createPayment } from "@/src/app/lib/services/common_urls/payment.service";
import { getPlanById } from "@/src/app/lib/services/subscription/subscription.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { requireAuth } from "@/src/app/lib/withPermission";

export const POST = asyncHandler(async (req) => {
  const { user } = await requireAuth();

  const { planId, billingCycle } = await req.json();
  if (!planId) throw new ApiError(400, "Plan ID is required");

  const plan = await getPlanById(planId);
  if (!plan) throw new ApiError(404, "Plan not found");
  if (billingCycle === "MONTHLY" && !plan.allowMonthly) {
    throw new ApiError(400, "Monthly billing is not available for this plan.");
  }

  if (billingCycle === "YEARLY" && !plan.allowYearly) {
    throw new ApiError(400, "Yearly billing is not available for this plan.");
  }

  const amount =
    billingCycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;

  if (!amount || Number(amount) <= 0) {
    throw new ApiError(
      400,
      `${billingCycle} price is not configured for this plan.`,
    );
  }

  const order = await createPayment({
    userId: user.id,
    amount: Number(amount),
    currency: "USD",
    billingCycle: billingCycle || "MONTHLY",
    paymentType: "PLAN",
    referenceId: planId,
  });

  return Response.json(
    new ApiResponse(200, order, "Order created successfully"),
  );
});
