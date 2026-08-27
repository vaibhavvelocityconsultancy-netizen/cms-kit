import { deleteOrder, getCustomerById } from "@/src/app/lib/services/common_urls/customer.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async (req, { params }) => {
  const { userId: id } = await params;

  const customer = await getCustomerById(id);

  if (!customer) {
    const errorResponse = new ApiError(404, null, "Customer not found");
    return Response.json(errorResponse, { status: errorResponse.statusCode });
  }
  
  const response = new ApiResponse(
    200,
    customer,
    "Customer fetched successfully",
  );
  return Response.json(response, { status: response.statusCode });
});

