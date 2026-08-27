import { requireAuth, requirePermission } from "../../lib/withPermission";
import { asyncHandler } from "../../lib/utils/asyncHandler";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { prisma } from "../../lib/prisma";
import { generateLlmsTxtContent } from "../../lib/services/seo/llmsTxtContent";

export const GET = asyncHandler(async (req, res) => {
  await requirePermission("settings_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  try {
    const settings =
      (await prisma.AICrawlSettings.findUnique({
        where: { tenantId },
      })) ??
      (await prisma.AICrawlSettings.create({
        data: {
          tenantId,
          enableMarkdownGeneration: true,
          includePages: true,
          includePosts: true,
          excludeDrafts: true,
        },
      }));

    const siteSettings = await prisma.sitesettings.findFirst({
      where: { tenantId },
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
    let pages = [];
    let posts = [];

    if (settings.includePages) {
      const pageWhere = { tenantId };
      if (settings.excludeDrafts) {
        pageWhere.status = "PUBLISHED";
      }

      pages = await prisma.page.findMany({
        where: pageWhere,
        select: {
          title: true,
          slug: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      });
    }

    if (settings.includePosts) {
      const postWhere = { tenantId };
      if (settings.excludeDrafts) {
        postWhere.status = "PUBLISHED";
      }

      posts = await prisma.post.findMany({
        where: postWhere,
        select: {
          title: true,
          slug: true,
          updatedAt: true,
          publishedAt: true,
        },
        orderBy: { publishedAt: "desc" },
      });
    }

    const content = generateLlmsTxtContent(baseUrl, pages, posts, siteSettings);
    const lastGenerated = [...pages, ...posts].reduce((latest, item) => {
      const updatedAt = new Date(item.updatedAt);
      return !latest || updatedAt > latest ? updatedAt : latest;
    }, null);

    return Response.json(
      new ApiResponse(
        200,
        {
          content,
          pagesCount: pages.length,
          postsCount: posts.length,
          totalCount: pages.length + posts.length,
          lastGenerated,
        },
        "llms.txt fetched successfully",
      ),
    );
  } catch (error) {
    console.error("Error fetching llms.txt:", error);
    return Response.json(
      new ApiResponse(500, null, "Failed to fetch llms.txt"),
      { status: 500 },
    );
  }
});
