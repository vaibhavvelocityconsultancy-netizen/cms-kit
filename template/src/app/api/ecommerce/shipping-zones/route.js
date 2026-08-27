import {
  createZone,
  getAllZones,
} from "@/src/app/lib/services/ecommerce/ecom.shipping.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async () => {
  const zones = await getAllZones();
  return Response.json(new ApiResponse(200, { zones }, "OK"));
});

export const POST = asyncHandler(async (req) => {
  return Response.json(
    new ApiResponse(201, await createZone(await req.json()), "Zone created"),
  );
});
