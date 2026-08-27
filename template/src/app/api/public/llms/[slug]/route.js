import { prisma } from "../../../../lib/prisma";
import { asyncHandler } from "../../../../lib/utils/asyncHandler";
import { ApiError } from "../../../../lib/utils/ApiError";

export const dynamic = "force-dynamic";

function frontmatterValue(value) {
  return JSON.stringify(String(value ?? ""));
}

function buildFrontmatter(fields) {
  return `---\n${Object.entries(fields)
    .map(([key, value]) => `${key}: ${frontmatterValue(value)}`)
    .join("\n")}\n---\n\n`;
}

function getSeoDataValue(seoData, key) {
  return seoData && typeof seoData === "object" ? seoData[key] : null;
}

function replaceDescriptionWithMeta(markdown, metaTitle, metaDescription) {
  const metaBlock = `**Meta Title:** ${metaTitle}\n\n**Meta Description:** ${metaDescription}`;

  if (/\*\*Meta Title:\*\*/i.test(markdown)) {
    return markdown;
  }

  if (/\*\*Description:\*\*.*?(?:\r?\n){2}/is.test(markdown)) {
    return markdown.replace(
      /\*\*Description:\*\*.*?(?:\r?\n){2}/is,
      `${metaBlock}\n\n`,
    );
  }

  return markdown.replace(/(#[^\r\n]+(?:\r?\n){2})/, `$1${metaBlock}\n\n`);
}

async function getSourceMetadata(content) {
  const siteSettings = await prisma.sitesettings.findFirst({
    where: { tenantId: content.tenantId },
    select: {
      defaultMetaTitle: true,
      defaultMetaDescription: true,
    },
  });

  if (content.contentType === "page") {
    const page = await prisma.page.findFirst({
      where: {
        tenantId: content.tenantId,
        id: Number(content.contentId),
      },
      select: {
        title: true,
        slug: true,
        seoData: true,
        updatedAt: true,
      },
    });

    if (!page) return null;

    return {
      title: page.title,
      metaTitle:
        getSeoDataValue(page.seoData, "metaTitle") ||
        page.title ||
        siteSettings?.defaultMetaTitle ||
        "",
      metaDescription:
        getSeoDataValue(page.seoData, "metaDescription") ||
        siteSettings?.defaultMetaDescription ||
        "Page from CMS",
      slug: page.slug,
      type: "page",
      updated: new Date(page.updatedAt).toISOString().split("T")[0],
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"}/${page.slug}`,
    };
  }

  if (content.contentType === "post") {
    const post = await prisma.post.findFirst({
      where: {
        tenantId: content.tenantId,
        id: content.contentId,
      },
      select: {
        title: true,
        slug: true,
        excerpt: true,
        seoData: true,
        updatedAt: true,
      },
    });

    if (!post) return null;

    return {
      title: post.title,
      metaTitle:
        getSeoDataValue(post.seoData, "metaTitle") ||
        post.title ||
        siteSettings?.defaultMetaTitle ||
        "",
      metaDescription:
        getSeoDataValue(post.seoData, "metaDescription") ||
        post.excerpt ||
        siteSettings?.defaultMetaDescription ||
        "Blog post",
      slug: post.slug,
      type: "post",
      updated: new Date(post.updatedAt).toISOString().split("T")[0],
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"}/blog/${post.slug}`,
    };
  }

  return null;
}

async function withMetadata(content) {
  if (/^---\r?\n[\s\S]*?\r?\n---\r?\n/.test(content.markdown)) {
    return content.markdown;
  }

  const metadata = await getSourceMetadata(content);
  if (!metadata) return content.markdown;

  return (
    buildFrontmatter(metadata) +
    replaceDescriptionWithMeta(
      content.markdown,
      metadata.metaTitle,
      metadata.metaDescription,
    )
  );
}

export const GET = asyncHandler(async (_req, context) => {
  const resolvedParams = await context.params;
  const rawSlug = resolvedParams?.slug;
  const slug = String(rawSlug ?? "")
    .trim()
    .replace(/\.md$/i, "")
    .replace(/^\/+|\/+$/g, "");

  if (!slug) {
    throw new ApiError(400, "Invalid markdown slug");
  }

  const content = await prisma.AICrawlContent.findFirst({
    where: {
      slug,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!content) {
    throw new ApiError(404, "Markdown not found");
  }

  const markdown = await withMetadata(content);

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
});
