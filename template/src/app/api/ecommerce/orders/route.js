import {
  getAllOrders,
  createOrder,
} from "@/src/app/lib/services/ecommerce/ecom.orders.service.js";
import { ApiError } from "@/src/app/lib/utils/ApiError.js";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse.js";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler.js";

export const GET = asyncHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const query = Object.fromEntries(searchParams.entries());
  const result = await getAllOrders(query);

  return Response.json(
    new ApiResponse(200, result, "Orders fetched successfully"),
  );
});

export const POST = asyncHandler(async (req) => {
  const data = await req.json();
  if (!data.items?.length) throw new ApiError(400, "Order must have items");

  const order = await createOrder(data);
  return Response.json(
    new ApiResponse(201, order, "Order created successfully"),
  );
});
