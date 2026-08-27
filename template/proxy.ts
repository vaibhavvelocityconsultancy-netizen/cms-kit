import type { NextRequest } from "next/server";
import { proxy as srcProxy } from "./src/proxy";

export function proxy(request: NextRequest) {
  return srcProxy(request);
}

export const config = {
  matcher:"/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
};
