import {
  getSettings,
  updateSettings,
} from "@/src/app/lib/services/settings/setting.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async () => {
  const settings = await getSettings();

  return Response.json(
    new ApiResponse(
      200,
      { showAdminToolbar: settings.showAdminToolbar },
      "Admin toolbar setting fetched successfully",
    ),
    { status: 200 },
  );
});

export const PATCH = asyncHandler(async (req) => {
  const { showAdminToolbar } = await req.json();

  const updated = await updateSettings({
    showAdminToolbar: Boolean(showAdminToolbar),
  });

  return Response.json(
    new ApiResponse(
      200,
      { showAdminToolbar: updated.showAdminToolbar },
      "Admin toolbar setting updated successfully",
    ),
    { status: 200 },
  );
});
