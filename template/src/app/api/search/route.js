// app/api/search/route.js
// import { NextResponse } from "next/server";
// import { searchPublishedContent } from "@/src/app/lib/services/search.service.js";

import { searchPublishedContent } from "../../lib/services/common_urls/search.service";
import { ApiResponse } from "../../lib/utils/ApiResponse";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  const results = await searchPublishedContent(query);

  return Response.json(
    new ApiResponse(200, results, "Search results retrieved successfully"),
  );
}
