import { requireAuth, requirePermission } from "@/src/app/lib/withPermission";

import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";

import { changeUserRole } from "@/src/app/lib/services/user & permissions/user.service";

// PATCH /api/users/[id]/role
export const PATCH = asyncHandler(async (req, { params }) => {
  await requirePermission("users_change_role");

  const session = await requireAuth();

  const actorRole = session.user.role;

  const { role } = await req.json();

  const updated = await changeUserRole(params.id, role, actorRole);

  return Response.json(
    new ApiResponse(200, updated, "Role updated successfully"),
    { status: 200 },
  );
});
