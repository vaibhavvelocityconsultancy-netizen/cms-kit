import {
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
} from "@/src/app/lib/services/ecommerce/ecom.orders.service.js";
import { ApiError } from "@/src/app/lib/utils/ApiError.js";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse.js";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler.js";

export const GET = asyncHandler(async (_req, { params }) => {
  const { id } = params;
  const order = await getOrderById(id);
  if (!order) throw new ApiError(404, "Order not found");

  return Response.json(
    new ApiResponse(200, order, "Order fetched successfully"),
  );
});

export const PATCH = asyncHandler(async (req, { params }) => {
  const { id } = params;
  const { status, paymentStatus } = await req.json();
  if (!status && !paymentStatus) {
    throw new ApiError(400, "Status or payment status is required");
  }

  let order;
  if (status) order = await updateOrderStatus(id, status);
  if (paymentStatus) order = await updatePaymentStatus(id, paymentStatus);

  return Response.json(new ApiResponse(200, order, "Order updated"));
});

export const DELETE = asyncHandler(async (_req, { params }) => {
  const { id } = params;
  const result = await deleteOrder(id);
  if (!result) throw new ApiError(404, "Order not found");

  return Response.json(
    new ApiResponse(200, result, "Order deleted successfully"),
  );
});
