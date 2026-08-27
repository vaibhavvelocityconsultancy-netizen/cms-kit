import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
// import { requirePermission } from "@/src/lib/withPermission";
import { getAllPermissions } from "../../lib/services/user & permissions/permission.service";
import { requirePermission } from "../../lib/withPermission";
// import { getAllPermissionsWithRoles } from "@/lib/services/permission.service";

// GET /api/permissions
export const GET = asyncHandler(async () => {
  // await requirePermission("settings_manage");
  const data = await getAllPermissions();
  return Response.json(new ApiResponse(200, data, "Permissions fetched"), {
    status: 200,
  });
});
