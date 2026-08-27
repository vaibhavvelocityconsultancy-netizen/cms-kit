// import { getSitemapIndex } from "../lib/services/seo/sitemap.service";

import { getSitemapIndex } from "../lib/services/seo/sitemap.service";

export async function GET() {
  try {
    const xml = await getSitemapIndex();

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Sitemap Error:", error);

    return new Response("Unable to generate sitemap.", {
      status: 500,
    });
  }
}