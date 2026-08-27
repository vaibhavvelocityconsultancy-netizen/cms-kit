import { deleteEnrollment } from "@/src/app/lib/services/common_urls/customer.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const DELETE = asyncHandler(async (req, { params }) => {
  const { enrollmentId: id } = await params;

  const enrollment = await deleteEnrollment(id);

  if (!enrollment) {
    const errorResponse = new ApiError(404, null, "Enrollment not found");
    return Response.json(errorResponse, { status: errorResponse.statusCode });
  }

  const response = new ApiResponse(
    200,
    enrollment,
    "Enrollment deleted successfully",
  );
  return Response.json(response, { status: response.statusCode });
});
