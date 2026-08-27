import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { requireAuth } from "@/src/app/lib/withPermission";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { prisma } from "@/src/app/lib/prisma";
import { ApiError } from "@/src/app/lib/utils/ApiError";

export const GET = asyncHandler(async (req, { params }) => {
  const { user } = await requireAuth();

  const resolvedParams = await params;
  const courseId = Number(resolvedParams.courseId);

  console.log("params =", resolvedParams);
  console.log("courseId =", courseId);

  if (!courseId || Number.isNaN(courseId)) {
    throw new ApiError(400, "Invalid course id");
  }

  const enrollment = await prisma.courseEnrollment.findFirst({
    where: {
      userId: Number(user.id),
      courseId,
    },
  });

  return Response.json(
    new ApiResponse(
      200,
      {
        enrolled: !!enrollment,
      },
      "Checked"
    )
  );
});