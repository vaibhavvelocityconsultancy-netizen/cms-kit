import {
  createUser,
  getUsers,
} from "../../lib/services/user & permissions/user.service";
import { ApiError } from "../../lib/utils/ApiError";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";
import { requirePermission } from "../../lib/withPermission";

// GET /api/users
export const GET = asyncHandler(async () => {
  await requirePermission("users_view");
  const users = await getUsers();
  return Response.json(
    new ApiResponse(200, users, "Users fetched successfully"),
    {
      status: 200,
    },
  );
});

// POST /api/users
export const POST = asyncHandler(async (req) => {
  await requirePermission("users_create");
  const body = await req.json();
  const user = await createUser(body);
  return Response.json(
    new ApiResponse(201, user, "User created successfully"),
    { status: 201 },
  );
});
