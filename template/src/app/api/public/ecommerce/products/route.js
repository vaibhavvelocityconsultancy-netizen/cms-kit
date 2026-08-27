import { getPublicProducts } from "@/src/app/lib/services/ecommerce/ecom.public.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const result = await getPublicProducts(
    Object.fromEntries(searchParams.entries()),
  );
  return Response.json(
    new ApiResponse(200, result, "Public products fetched successfully"),
  );
});

export const dynamic = "force-dynamic";
