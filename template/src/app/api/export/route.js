import { exportAll } from "../../lib/services/settings/importexport.service";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";

export const GET = asyncHandler(async () => {
  const data = await exportAll();

  return Response.json(new ApiResponse(200, data, "Export successful"));
});
