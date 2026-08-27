import { prisma } from "@/src/app/lib/prisma";

/**
 * Get all linkable content (pages and posts) for a given tenant
 */
export async function getLinkableContentList(tenantId?: number) {
  try {
    // Get tenant ID from context or env
    const currentTenantId = tenantId || parseInt(process.env.TENANT_ID || "1");

    // Fetch both pages and posts
    const [pages, posts] = await Promise.all([
      prisma.page.findMany({
        where: {
          tenantId: currentTenantId,
          status: "PUBLISHED",
        },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.post.findMany({
        where: {
          tenantId: currentTenantId,
          status: "PUBLISHED",
        },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    // Transform to common format
    const content = [
      ...pages.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        published: p.status === "PUBLISHED",
        updatedAt: p.updatedAt,
        type: "page" as const,
      })),
      ...posts.map((p) => ({
        id: parseInt(p.id),
        title: p.title,
        slug: p.slug,
        published: p.status === "PUBLISHED",
        updatedAt: p.updatedAt,
        type: "post" as const,
      })),
    ];

    return content;
  } catch (error) {
    console.error("Error fetching linkable content:", error);
    throw {
      status: 500,
      message: "Failed to fetch content",
    };
  }
}

/**
 * Suggest internal link targets based on content keywords
 * Analyzes source content and finds matching keywords in other content
 */
export async function suggestInternalLinkTargets(
  sourceType: "page" | "post",
  sourceId: string | number,
  tenantId?: number,
) {
  try {
    const currentTenantId = tenantId || parseInt(process.env.TENANT_ID || "1");

    // Get source content
    let sourceContent = null;
    if (sourceType === "page") {
      sourceContent = await prisma.page.findUnique({
        where: { id: parseInt(sourceId as string) },
        select: { title: true, html: true, slug: true },
      });
    } else {
      sourceContent = await prisma.post.findUnique({
        where: { id: sourceId as string },
        select: { title: true, content: true, slug: true },
      });
    }

    if (!sourceContent) {
      return [];
    }

    // Combine text content from source
    const sourceText =
      `${sourceContent.title} ${sourceType === "page" ? sourceContent.html : sourceContent.content}`.toLowerCase();

    // Get all other linkable content
    const [otherPages, otherPosts] = await Promise.all([
      prisma.page.findMany({
        where: {
          tenantId: currentTenantId,
          status: "PUBLISHED",
          slug: { not: sourceContent.slug },
        },
        select: {
          id: true,
          title: true,
          slug: true,
        },
      }),
      prisma.post.findMany({
        where: {
          tenantId: currentTenantId,
          status: "PUBLISHED",
          slug: { not: sourceContent.slug },
        },
        select: {
          id: true,
          title: true,
          slug: true,
        },
      }),
    ]);

    // Find matches: keywords from other content titles that appear in source content
    const suggestions: Array<{
      keyword: string;
      destinationType: string;
      destinationId: number | string;
      resolvedUrl: string;
    }> = [];

    // Check pages
    for (const page of otherPages) {
      const keyword = page.title.toLowerCase();
      if (
        sourceText.includes(keyword) &&
        keyword.length > 2 &&
        !suggestions.some((s) => s.keyword === keyword)
      ) {
        suggestions.push({
          keyword: page.title,
          destinationType: "page",
          destinationId: page.id,
          resolvedUrl: `/${page.slug}`,
        });
      }
    }

    // Check posts
    for (const post of otherPosts) {
      const keyword = post.title.toLowerCase();
      if (
        sourceText.includes(keyword) &&
        keyword.length > 2 &&
        !suggestions.some((s) => s.keyword === keyword)
      ) {
        suggestions.push({
          keyword: post.title,
          destinationType: "post",
          destinationId: post.id,
          resolvedUrl: `/posts/${post.slug}`,
        });
      }
    }

    // Sort by keyword length (longer, more specific keywords first)
    return suggestions.sort((a, b) => b.keyword.length - a.keyword.length);
  } catch (error) {
    console.error("Error suggesting internal links:", error);
    throw {
      status: 500,
      message: "Failed to suggest links",
    };
  }
}
