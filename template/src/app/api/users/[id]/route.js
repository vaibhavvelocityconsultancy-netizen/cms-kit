import {
  requireAuth,
  requireCanManageUser,
  requirePermission,
} from "@/src/app/lib/withPermission";

import {
  getUserById,
  updateUser,
  deleteUser,
  updateOwnProfile,
} from "@/src/app/lib/services/user & permissions/user.service";

import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

// GET /api/users/[id]
export const GET = asyncHandler(async (req, { params }) => {
  await requirePermission("users_view");

  const { id } = await params;

  const user = await getUserById(id);
  return Response.json(
    new ApiResponse(200, user, "User fetched successfully"),
    { status: 200 },
  );
});

// PATCH /api/users/[id]
export const PATCH = asyncHandler(async (req, { params }) => {
  const session = await requireAuth();
  const actorId = Number(session.user.id);
  const { id } = await params;
  const targetId = Number(id);
  const body = await req.json();

  // Self-update — only allow name and password
  if (actorId === targetId) {
    const allowedFields = {};
    if (body.name !== undefined) allowedFields.name = body.name;
    if (body.password !== undefined) allowedFields.password = body.password;

    const updated = await updateOwnProfile(targetId, allowedFields);
    return Response.json(
      new ApiResponse(200, updated, "Profile updated successfully"),
      { status: 200 },
    );
  }
  // Updating someone else — require permission
  await requirePermission("users_edit");
  await requireCanManageUser(targetId);

  const updated = await updateUser(id, body);
  return Response.json(
    new ApiResponse(200, updated, "User updated successfully"),
    { status: 200 },
  );
});

// DELETE /api/users/[id]
export const DELETE = asyncHandler(async (req, { params }) => {
  await requirePermission("users_delete");

  const { id } = await params;
  await requireCanManageUser(Number(id));
  const session = await requireAuth();

  const actorRole = session.user.role;

  await deleteUser(params.id, actorRole);

  return Response.json(
    new ApiResponse(200, null, "User deleted successfully"),
    { status: 200 },
  );
});
