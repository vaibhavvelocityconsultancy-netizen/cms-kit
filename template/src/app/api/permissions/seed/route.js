import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { seedRolePermissions } from "@/src/app/lib/services/user & permissions/permission.service";
import { requirePermission } from "@/src/app/lib/withPermission";
// import { requirePermission }   from "@/src/lib/withPermission";
// import { seedRolePermissions } from "@/lib/services/permission.service";

// POST /api/permissions/seed
export const POST = asyncHandler(async () => {
  await requirePermission("settings_manage");
  const result = await seedRolePermissions();
  return Response.json(
    new ApiResponse(200, result, "Permissions seeded successfully"),
    {
      status: 200,
    },
  );
});
