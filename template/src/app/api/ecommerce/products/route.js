import { createProduct, getProducts } from "../../../lib/services/ecommerce/ecom.product.service";
import { ApiError } from "../../../lib/utils/ApiError";
import { ApiResponse } from "../../../lib/utils/ApiResponse";
import { asyncHandler } from "../../../lib/utils/asyncHandler";

export const GET = asyncHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const query = Object.fromEntries(searchParams.entries());

  const result = await getProducts(query);

  return Response.json(
    new ApiResponse(200, result, "Products fetched successfully"),
  );
});

export const POST = asyncHandler(async (req) => {
  const data = await req.json();

  if (!data.title) {
    throw new ApiError(400, "Title is required");
  }

  const product = await createProduct(data);

  return Response.json(
    new ApiResponse(201, product, "Product created successfully"),
  );
});
