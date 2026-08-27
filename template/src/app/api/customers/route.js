import { NextResponse } from "next/server";
// import { getCustomers } from "../../lib/services/customers.service";
import { asyncHandler } from "../../lib/utils/asyncHandler";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { getCustomers } from "../../lib/services/common_urls/customer.service";

export const GET = asyncHandler(async (req) => {
  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") || undefined;
  const filter = searchParams.get("filter") || "all";
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;

  const data = await getCustomers({ search, filter, page, pageSize });

  const response = new ApiResponse(200, data, "Customers fetched successfully");

  return NextResponse.json(response, { status: response.statusCode });
});