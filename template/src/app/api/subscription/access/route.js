// import { requireAuth } from "@/src/app/lib/withPermission";
import { getUserCourseAccess } from "@/src/app/lib/services/subscription/subscription.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { requireAuth } from "@/src/app/lib/withPermission";

export const GET = asyncHandler(async (req) => {
  const { user } = await requireAuth();

  const { searchParams } = new URL(req.url);

  const courseId = searchParams.get("courseId");

  if (!courseId) {
    throw new ApiError(400, "Course ID is required");
  }

  const access = await getUserCourseAccess(user.id, Number(courseId));

  if (access.type === null) {
    throw new ApiError(404, "No access record found for this course");
  }

  return Response.json(
    new ApiResponse(200, access, "Course access fetched successfully"),
  );
});
