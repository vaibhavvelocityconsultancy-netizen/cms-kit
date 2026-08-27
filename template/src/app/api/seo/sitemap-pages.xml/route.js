// import { getPagesSitemap } from "@/services/sitemap.js";

import { getPagesSitemap } from "@/src/app/lib/services/seo/sitemap.service";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    const xml = await getPagesSitemap(tenantId);

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return new Response("Sitemap not found", { status: 404 });
  }
}