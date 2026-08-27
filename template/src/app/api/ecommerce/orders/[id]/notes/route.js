import { addOrderNote } from "@/src/app/lib/services/ecommerce/ecom.orders.service.js";
import { ApiError } from "@/src/app/lib/utils/ApiError.js";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse.js";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler.js";

export const POST = asyncHandler(async (req, { params }) => {
  const { id } = params;
  const { note, isCustomerVisible } = await req.json();
  if (!note) throw new ApiError(400, "Note text is required");

  const result = await addOrderNote(id, { note, isCustomerVisible });
  return Response.json(new ApiResponse(201, result, "Note added"));
});
