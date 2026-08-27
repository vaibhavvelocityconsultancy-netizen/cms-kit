// import { asyncHandler } from "@/lib/utils/asyncHandler";
// import prisma from "@/lib/prisma";

import { asyncHandler } from "../lib/utils/asyncHandler";
import { getPublicSettings } from "../lib/services/common_urls/public.service.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const GET = asyncHandler(async () => {
  const settings = await getPublicSettings();

  const content =
    settings?.robotsEnabled && settings.robotsContent?.trim()
      ? settings.robotsContent
      : `User-agent: *
Allow: /

Sitemap: ${process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"}/sitemap.xml`;

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
});
