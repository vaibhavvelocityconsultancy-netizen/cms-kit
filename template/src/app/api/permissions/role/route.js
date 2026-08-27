import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
// import { requirePermission } from "@/src/lib/withPermission";
import { toggleRolePermission } from "@/src/app/lib/services/user & permissions/permission.service";
import { requirePermission } from "@/src/app/lib/withPermission";
// import { toggleRolePermission } from "@/lib/services/permission.service";

// PATCH /api/permissions/role
// Body: { role, permission, allowed }
export const PATCH = asyncHandler(async (req) => {
  await requirePermission("settings_manage");
  const { role, permission, allowed } = await req.json();

  if (!role || !permission || allowed === undefined) {
    return Response.json(
      { success: false, message: "role, permission and allowed are required" },
      { status: 400 },
    );
  }

  const result = await toggleRolePermission(role, permission, allowed);
  return Response.json(new ApiResponse(200, result, "Permission updated"), {
    status: 200,
  });
});
