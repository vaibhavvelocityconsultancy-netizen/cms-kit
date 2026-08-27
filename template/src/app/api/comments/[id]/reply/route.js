import { requireAuth } from "@/src/app/lib/withPermission";
import { adminReplyToComment } from "@/src/app/lib/services/posts/comment.service";

import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";

export const POST = asyncHandler(async (req, { params }) => {
  const { id } = await params;

  const session = await requireAuth();

  const { content } = await req.json();

  if (!content?.trim()) {
    throw new ApiError(400, "Reply content required");
  }

  const comment = await adminReplyToComment({
    commentId: id,
    content,

    adminUser: {
      id: Number(session.user.id),
      email: session.user.email,
      name: session.user.name || "Admin",
    },
  });

  return Response.json(
    new ApiResponse(201, comment, "Reply added successfully"),
    {
      status: 201,
    },
  );
});
