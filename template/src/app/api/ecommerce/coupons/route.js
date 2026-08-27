import {
  createCoupon,
  getAllCoupons,
} from "@/src/app/lib/services/ecommerce/ecom.coupons.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async (req) => {
  const url = new URL(req.url);
  const params = {
    search: url.searchParams.get("search") || "",
    status: url.searchParams.get("status") || "",
    page: Number(url.searchParams.get("page") || 1),
    limit: Number(url.searchParams.get("limit") || 10),
  };
  return Response.json(new ApiResponse(200, await getAllCoupons(params), "OK"));
});

export const POST = asyncHandler(async (req) => {
  return Response.json(
    new ApiResponse(
      201,
      await createCoupon(await req.json()),
      "Coupon created",
    ),
  );
});
