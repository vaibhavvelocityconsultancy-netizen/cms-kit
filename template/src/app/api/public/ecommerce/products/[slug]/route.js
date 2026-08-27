import { getPublicProductBySlug } from "@/src/app/lib/services/ecommerce/ecom.public.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async (req, { params }) => {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const product = await getPublicProductBySlug(
    slug,
    searchParams.get("tenantId"),
  );
  if (!product)
    return Response.json(new ApiResponse(404, null, "Product not found"), {
      status: 404,
    });
  return Response.json(
    new ApiResponse(200, product, "Public product fetched successfully"),
  );
});

export const dynamic = "force-dynamic";
