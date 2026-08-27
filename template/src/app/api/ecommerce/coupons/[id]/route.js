import {
  deleteCoupon,
  getCouponById,
  updateCoupon,
} from "@/src/app/lib/services/ecommerce/ecom.coupons.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async (_r, { params }) => {
  const { id } = await params;
  return Response.json(new ApiResponse(200, await getCouponById(id), "OK"));
});
export const PATCH = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  return Response.json(
    new ApiResponse(
      200,
      await updateCoupon(id, await req.json()),
      "Coupon updated",
    ),
  );
});
export const DELETE = asyncHandler(async (_r, { params }) => {
  const { id } = await params;
  return Response.json(
    new ApiResponse(200, await deleteCoupon(id), "Coupon deleted"),
  );
});
