import { deleteProduct, getProductById, updateProduct } from "../../../../lib/services/ecommerce/ecom.product.service";
import { ApiError } from "../../../../lib/utils/ApiError";
import { ApiResponse } from "../../../../lib/utils/ApiResponse";
import { asyncHandler } from "../../../../lib/utils/asyncHandler";

export const GET = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return Response.json(
    new ApiResponse(200, product, "Product fetched successfully"),
  );
});

export const PATCH = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const data = await req.json();

  const product = await updateProduct(id, data);

  return Response.json(
    new ApiResponse(200, product, "Product updated successfully"),
  );
});

export const DELETE = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const result = await deleteProduct(id);

  return Response.json(
    new ApiResponse(200, result, "Product deleted successfully"),
  );
});