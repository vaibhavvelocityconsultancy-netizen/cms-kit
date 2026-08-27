import { importAll } from "../../lib/services/settings/importexport.service";
import { ApiError } from "../../lib/utils/ApiError";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";

export const POST = asyncHandler(async (req) => {
  const body = await req.json();

  if (!body.data) {
    throw new ApiError(400, "No import data provoided");
  }

  const validStrategies = ["skip", "overwrite", "rename"];

  if (body.strategy && !validStrategies.includes(body.strategy)) {
    throw new ApiError(
      400,
      `Invalid strategy. Use: ${validStrategies.join(", ")}`,
    );
  }

  const report = await importAll(body.data, body.strategy);

  return Response.json(new ApiResponse(200, report, "Import completed"));
});
