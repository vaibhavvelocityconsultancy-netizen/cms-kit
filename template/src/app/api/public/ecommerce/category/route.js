import { getPublicCategories } from "@/src/app/lib/services/ecommerce/ecom.public.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const categories = await getPublicCategories(searchParams.get("tenantId"));
  return Response.json(
    new ApiResponse(
      200,
      { categories },
      "Public categories fetched successfully",
    ),
  );
});

export const dynamic = "force-dynamic";
