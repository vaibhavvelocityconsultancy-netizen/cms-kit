import {
  getRobotsSettings,
  updateRobotsSettings,
} from "@/src/app/lib/services/settings/setting.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async (req, res) => {
  const robotsSettings = await getRobotsSettings();

  return Response.json(
    new ApiResponse(
      200,
      robotsSettings,
      "Robots settings fetched successfully",
    ),
  );
});

// update

export const PUT = asyncHandler(async (req, res) => {
  const body = await req.json();

  const setting = await updateRobotsSettings(body);

  return Response.json(
    new ApiResponse(200, setting, "Robots settings updated successfully"),
  );
});
