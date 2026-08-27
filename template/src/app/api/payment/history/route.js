import { getPaymentHistory } from "@/src/app/lib/services/common_urls/payment.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { requireAuth } from "@/src/app/lib/withPermission";

export const GET = asyncHandler(async () => {
  const { user } = await requireAuth();
  const payments = await getPaymentHistory(user.id);
  return Response.json(
    new ApiResponse(200, payments, "Payment history fetched successfully"),
  );
});
