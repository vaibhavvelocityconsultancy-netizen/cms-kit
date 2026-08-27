import { NextResponse } from "next/server";
// import { applyRedirectMiddleware } from "@/src/lib/middleware/redirectMiddleware";
import type { NextRequest } from "next/server";
import { applyRedirectMiddleware } from "./lib/redirectMiddleware";

export async function proxy(request: NextRequest) {
  const redirect = await applyRedirectMiddleware(request);

  if (redirect) {
    return redirect;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};