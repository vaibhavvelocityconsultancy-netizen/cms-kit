import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/src/app/lib/prisma";

let redirectsCache: Map<string, any> = new Map();
let cacheLastUpdated = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get base URL for API calls
 */
function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://ipdav.com/newweb";
}

/**
 * Fetch redirects from API (edge runtime safe)
 */
async function refreshRedirectCache() {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/redirects/active`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch redirects: ${response.status}`);
    }

    const { data: redirects } = await response.json();

    redirectsCache.clear();
    redirects.forEach((r: any) => {
      const key = (r.sourceUrl || "").toLowerCase().replace(/\/$/, "") || "/";
      redirectsCache.set(key, r);
    });

    cacheLastUpdated = Date.now();
    console.log(
      `✓ Redirect cache updated: ${redirects.length} active redirects`,
    );
  } catch (error) {
    console.error("Failed to refresh redirect cache:", error);
  }
}

/**
 * Get or refresh cache if expired
 */
async function getRedirects(forceRefresh = false) {
  if (forceRefresh || Date.now() - cacheLastUpdated > CACHE_DURATION) {
    await refreshRedirectCache();
  }
  return redirectsCache;
}

/**
 * Find exact redirect match
 */
function findRedirect(path: string) {
  const normalized = (path || "").toLowerCase().replace(/\/$/, "") || "/";
  return redirectsCache.get(normalized);
}

/**
 * Apply redirect middleware
 */
export async function applyRedirectMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip API routes and static files
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return undefined;
  }

  const redirects = await getRedirects(true);
  const redirect = findRedirect(pathname);

  if (redirect) {
    console.log(`[Redirect] ${pathname} → ${redirect.destinationUrl}`);
    return NextResponse.redirect(
      new URL(redirect.destinationUrl, request.url),
      { status: redirect.statusCode },
    );
  }

  return undefined;
}

/**
 * Clear the redirect cache (call after create/update/delete)
 */
export async function clearRedirectCache() {
  console.log("[Cache] Clearing redirect cache...");
  redirectsCache.clear();
  cacheLastUpdated = 0;
  await refreshRedirectCache();
}

/**
 * Log 404 errors (call from server-side code like notFound())
 */
export async function log404Error(
  path: string,
  request?: NextRequest,
  userAgent?: string,
) {
  try {
    const normalized = (path || "").toLowerCase().replace(/\/$/, "") || "/";

    // Check if we have a redirect for this path
    const existingRedirect = redirectsCache.get(normalized);

    await prisma.notFoundLog.create({
      data: {
        path: normalized,
        referrer: request?.headers.get("referer") || undefined,
        userAgent: userAgent || request?.headers.get("user-agent") || undefined,
        ipAddress: request?.headers.get("x-forwarded-for") || undefined,
        redirectId: existingRedirect?.id,
        isResolved: !!existingRedirect,
      },
    });
  } catch (error) {
    console.error("[404Log] Failed to log 404:", error);
  }
}
