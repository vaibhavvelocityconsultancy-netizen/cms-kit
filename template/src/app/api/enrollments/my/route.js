// import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
// import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
// import { requireAuth } from "@/src/app/lib/withPermission";
// import { prisma } from "@/src/app/lib/prisma";

import { prisma } from "@/src/app/lib/prisma";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { requireAuth } from "@/src/app/lib/withPermission";
export const GET = asyncHandler(async () => {
  const { user } = await requireAuth();

  const moduleInclude = {
    include: {
      materials: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
    orderBy: {
      sortOrder: "asc",
    },
  };

  const enrollments = await prisma.courseEnrollment.findMany({
    where: {
      userId: Number(user.id),
    },
    include: {
      course: {
        include: {
          courseContent: {
            include: {
              modules: {
                include: {
                  courseMaterials: {
                    orderBy: {
                      sortOrder: "asc",
                    },
                  },
                },
                orderBy: {
                  sortOrder: "asc",
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });
  return Response.json(
    new ApiResponse(200, enrollments, "Enrollments fetched"),
  );
});
