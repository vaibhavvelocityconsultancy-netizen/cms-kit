import { prisma } from "../../prisma";
import { requireAuth, requirePermission } from "../../withPermission";
import { generateLlmsTxtContent, writeLlmsTxtFile } from "./llmsTxtContent";

export async function getAICrawlSettings() {
  // permission check
  await requirePermission("settings_view");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  // get settings as per tenant
  let settings = await prisma.AICrawlSettings.findUnique({
    where: {
      tenantId,
    },
  });

  if (!settings) {
    settings = await prisma.AICrawlSettings.create({
      data: {
        tenantId,
        enableMarkdownGeneration: true,
        includePages: true,
        includePosts: true,
        excludeDrafts: true,
      },
    });
  }

  return settings;
}

export async function updateAICrawlSettings(input) {
  await requirePermission("settings_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const {
    enableMarkdownGeneration,
    includePages,
    includePosts,
    excludeDrafts,
  } = input;

  const settings = await prisma.AICrawlSettings.upsert({
    where: { tenantId },
    create: {
      tenantId,
      enableMarkdownGeneration: enableMarkdownGeneration ?? true,
      includePages: includePages ?? true,
      includePosts: includePosts ?? true,
      excludeDrafts: excludeDrafts ?? true,
    },
    update: {
      enableMarkdownGeneration: enableMarkdownGeneration ?? undefined,
      includePages: includePages ?? undefined,
      includePosts: includePosts ?? undefined,
      excludeDrafts: excludeDrafts ?? undefined,
    },
  });

  // Auto-generate files if enabled
  if (settings.enableMarkdownGeneration) {
    // Generate llms.txt
    await generateLlmsTxt(tenantId, settings);

    // Generate individual markdown files
    await generateMarkdownFiles(tenantId, settings);
  }

  return settings;
}

export async function regenerateAICrawlMarkdown() {
  await requirePermission("settings_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;
  const settings = await prisma.AICrawlSettings.findUnique({
    where: { tenantId },
  });

  const resolvedSettings =
    settings ??
    (await prisma.AICrawlSettings.create({
      data: {
        tenantId,
        enableMarkdownGeneration: true,
        includePages: true,
        includePosts: true,
        excludeDrafts: true,
      },
    }));

  await generateLlmsTxt(tenantId, resolvedSettings);
  const stats = await generateMarkdownFiles(tenantId, resolvedSettings);

  return {
    settings: resolvedSettings,
    ...stats,
  };
}

// ─────────────────────────────────────────────────────────

async function generateLlmsTxt(tenantId, settings) {
  try {
    // Get site settings for base URL
    const siteSettings = await prisma.sitesettings.findFirst({
      where: { tenantId },
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

    // Fetch pages if enabled
    let pages = [];
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

    // Fetch posts if enabled
    let posts = [];
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
        },
        orderBy: { publishedAt: "desc" },
      });
    }

    const content = generateLlmsTxtContent(baseUrl, pages, posts);
    writeLlmsTxtFile(content);

    console.log(
      `✅ llms.txt generated: ${pages.length} pages + ${posts.length} posts`,
    );
    return {
      success: true,
      pagesCount: pages.length,
      postsCount: posts.length,
      totalCount: pages.length + posts.length,
    };
  } catch (error) {
    console.error("❌ Failed to generate llms.txt:", error);
    throw new Error("Failed to generate llms.txt");
  }
}

// ─────────────────────────────────────────────────────────

async function generateMarkdownFiles(tenantId, settings) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
    const siteSettings = await prisma.sitesettings.findFirst({
      where: { tenantId },
      select: {
        defaultMetaTitle: true,
        defaultMetaDescription: true,
      },
    });

    let stats = {
      pagesCount: 0,
      postsCount: 0,
      totalGenerated: 0,
    };

    // Generate markdown for pages
    if (settings.includePages) {
      const pageWhere = { tenantId };
      if (settings.excludeDrafts) {
        pageWhere.status = "PUBLISHED";
      }

      const pages = await prisma.page.findMany({
        where: pageWhere,
        select: {
          id: true,
          title: true,
          slug: true,
          html: true,
          seoData: true,
          updatedAt: true,
        },
      });

      for (const page of pages) {
        const mdContent = generatePageMarkdown(page, baseUrl, siteSettings);
        const wordCount = mdContent.split(/\s+/).length;

        // Upsert to database
        await prisma.AICrawlContent.upsert({
          where: {
            tenantId_contentType_contentId: {
              tenantId,
              contentType: "page",
              contentId: String(page.id),
            },
          },
          create: {
            tenantId,
            contentType: "page",
            contentId: String(page.id),
            slug: page.slug,
            title: page.title,
            markdown: mdContent,
            wordCount,
          },
          update: {
            markdown: mdContent,
            wordCount,
            updatedAt: new Date(),
          },
        });
      }

      stats.pagesCount = pages.length;
    }

    // Generate markdown for posts
    if (settings.includePosts) {
      const postWhere = { tenantId };
      if (settings.excludeDrafts) {
        postWhere.status = "PUBLISHED";
      }

      const posts = await prisma.post.findMany({
        where: postWhere,
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          excerpt: true,
          seoData: true,
          updatedAt: true,
        },
      });

      for (const post of posts) {
        const mdContent = generatePostMarkdown(post, baseUrl, siteSettings);
        const wordCount = mdContent.split(/\s+/).length;

        // Upsert to database
        await prisma.AICrawlContent.upsert({
          where: {
            tenantId_contentType_contentId: {
              tenantId,
              contentType: "post",
              contentId: post.id,
            },
          },
          create: {
            tenantId,
            contentType: "post",
            contentId: post.id,
            slug: post.slug,
            title: post.title,
            markdown: mdContent,
            wordCount,
          },
          update: {
            markdown: mdContent,
            wordCount,
            updatedAt: new Date(),
          },
        });
      }

      stats.postsCount = posts.length;
    }

    // Delete markdown for pages that no longer exist
    if (settings.includePages) {
      const pageWhere = { tenantId };
      if (settings.excludeDrafts) {
        pageWhere.status = "PUBLISHED";
      }

      const existingPages = await prisma.page.findMany({
        where: pageWhere,
        select: { id: true },
      });

      const existingPageIds = existingPages.map((p) => String(p.id));

      await prisma.AICrawlContent.deleteMany({
        where: {
          tenantId,
          contentType: "page",
          contentId: {
            notIn: existingPageIds,
          },
        },
      });
    }

    // Delete markdown for posts that no longer exist
    if (settings.includePosts) {
      const postWhere = { tenantId };
      if (settings.excludeDrafts) {
        postWhere.status = "PUBLISHED";
      }

      const existingPosts = await prisma.post.findMany({
        where: postWhere,
        select: { id: true },
      });

      const existingPostIds = existingPosts.map((p) => p.id);

      await prisma.AICrawlContent.deleteMany({
        where: {
          tenantId,
          contentType: "post",
          contentId: {
            notIn: existingPostIds,
          },
        },
      });
    }

    stats.totalGenerated = stats.pagesCount + stats.postsCount;

    console.log(
      `✅ Markdown stored in DB: ${stats.pagesCount} pages + ${stats.postsCount} posts`,
    );
    return stats;
  } catch (error) {
    console.error("❌ Failed to generate markdown:", error);
    throw new Error("Failed to generate markdown");
  }
}
// ─────────────────────────────────────────────────────────

function frontmatterValue(value) {
  return JSON.stringify(String(value ?? ""));
}

function buildFrontmatter(fields) {
  const lines = Object.entries(fields).map(
    ([key, value]) => `${key}: ${frontmatterValue(value)}`,
  );

  return `---\n${lines.join("\n")}\n---\n\n`;
}

function getSeoDataValue(seoData, key) {
  return seoData && typeof seoData === "object" ? seoData[key] : null;
}

function generatePageMarkdown(page, baseUrl, siteSettings) {
  const url = `${baseUrl}/${page.slug}`;
  const date = new Date(page.updatedAt).toISOString().split("T")[0];
  const metaTitle =
    getSeoDataValue(page.seoData, "metaTitle") ||
    page.title ||
    siteSettings?.defaultMetaTitle ||
    "";
  const metaDescription =
    getSeoDataValue(page.seoData, "metaDescription") ||
    siteSettings?.defaultMetaDescription ||
    "Page from CMS";

  // Strip HTML tags from content
  const plainText = stripHtmlTags(page.html || "");

  let content = buildFrontmatter({
    title: page.title,
    metaTitle,
    metaDescription,
    slug: page.slug,
    url,
    type: "page",
    updated: date,
  });
  content += `# ${page.title}\n\n`;
  content += `**URL:** ${url}\n\n`;
  content += `**Updated:** ${date}\n\n`;
  content += `**Meta Title:** ${metaTitle}\n\n`;
  content += `**Meta Description:** ${metaDescription}\n\n`;
  content += `---\n\n`;
  content += `## Content\n\n`;
  content += `${plainText}\n\n`;
  content += `---\n\n`;
  content += `**Canonical:** ${url}\n`;
  content += `**Type:** Page\n`;

  return content;
}

// ─────────────────────────────────────────────────────────

function generatePostMarkdown(post, baseUrl, siteSettings) {
  const url = `${baseUrl}/blog/${post.slug}`;
  const date = new Date(post.updatedAt).toISOString().split("T")[0];
  const metaTitle =
    getSeoDataValue(post.seoData, "metaTitle") ||
    post.title ||
    siteSettings?.defaultMetaTitle ||
    "";
  const metaDescription =
    getSeoDataValue(post.seoData, "metaDescription") ||
    post.excerpt ||
    siteSettings?.defaultMetaDescription ||
    "Blog post";

  // Strip HTML tags from content
  const plainText = stripHtmlTags(post.content || "");

  let content = buildFrontmatter({
    title: post.title,
    metaTitle,
    metaDescription,
    slug: post.slug,
    url,
    type: "post",
    updated: date,
  });
  content += `# ${post.title}\n\n`;
  content += `**URL:** ${url}\n\n`;
  content += `**Updated:** ${date}\n\n`;
  content += `**Meta Title:** ${metaTitle}\n\n`;
  content += `**Meta Description:** ${metaDescription}\n\n`;
  content += `---\n\n`;
  content += `## Content\n\n`;
  content += `${plainText}\n\n`;
  content += `---\n\n`;
  content += `**Canonical:** ${url}\n`;
  content += `**Type:** Post\n`;

  return content;
}

// ─────────────────────────────────────────────────────────

function stripHtmlTags(html) {
  if (!html) return "";

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\n\n+/g, "\n\n")
    .trim();
}
