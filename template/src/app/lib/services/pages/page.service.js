// import { generateArbitraryCss, mergePageCss } from "@/src/app/lib/tailwind-arbitrary-css.js";
import { prisma } from "../../prisma.js";
import {
  generateArbitraryCss,
  mergePageCss,
} from "../../tailwind-arbitrary-css";
import { normalizeURL } from "../../utils/redirectUtils";
import { requireAuth, requirePermission } from "../../withPermission.js";
import { extractSearchableText } from "../../search/extractText.js";
import { clearSitemapCache } from "../seo/sitemap.service.js";
import { processImageSeo } from "../seo/image-seo.service.js";
import { clearRedirectCache } from "../../../../lib/redirectMiddleware";

// ─── Helpers ──────────────────────────────────────────────

function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function isSlugTaken(slug, tenantId, excludeId = null) {
  const existing = await prisma.page.findFirst({
    where: {
      slug,
      tenantId,
    },
  });

  if (!existing) return false;
  if (excludeId && existing.id === Number(excludeId)) return false;
  return true;
}

function buildPageWhere(slug, status, tenantId) {
  const where = { slug };
  if (status) where.status = status;
  if (tenantId !== undefined) where.tenantId = tenantId;
  return where;
}

// ─── Services ─────────────────────────────────────────────

export async function getAllPages() {
  await requirePermission("pages_view");

  const { session } = await requirePermission("pages_view"); // ← use returned session
  const tenantId = session.user.tenantId;
  return prisma.page.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getPageById(id) {
  await requirePermission("pages_view");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  return prisma.page.findFirst({
    where: {
      id: Number(id),
      tenantId,
    },
  });
}

export async function getPageBySlug(slug, { preview = false } = {}) {
  const status = preview ? undefined : "PUBLISHED";
  let tenantId;
  if (preview) {
    const session = await requireAuth();
    tenantId = session.user.tenantId;
  }

  return prisma.page.findFirst({
    where: buildPageWhere(slug, status, tenantId),
  });
}

export async function getPublishedPages() {
  const publicPage = prisma.page.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      createdAt: true,
    },
  });
  return publicPage;
}

export async function createPage(input) {
  await requirePermission("pages_create");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const { id: _, createdAt, updatedAt, ...cleanInput } = input;

  const hasSlug = Object.prototype.hasOwnProperty.call(cleanInput, "slug");
  const slug = hasSlug
    ? cleanInput.slug.trim()
      ? generateSlug(cleanInput.slug)
      : ""
    : generateSlug(cleanInput.title);

  if (await isSlugTaken(slug, tenantId)) {
    throw new Error(`Slug "${slug}" is already taken`);
  }

  let pageHtml = cleanInput.html;
  if (typeof pageHtml === "string" && pageHtml.trim()) {
    pageHtml = await processImageSeo({
      html: pageHtml,
      pageTitle: cleanInput.title ?? "",
      seoData: cleanInput.seoData ?? {},
      tenantId,
    });
  }

  const arbitraryCss = generateArbitraryCss(pageHtml ?? "");
  const mergedCss = mergePageCss(cleanInput.css ?? "", arbitraryCss);
  const searchText = extractSearchableText(pageHtml ?? ""); // ← ADD

  const createdPage = await prisma.page.create({
    data: {
      title: cleanInput.title,
      slug,
      html: pageHtml,
      css: mergedCss, // ← was: cleanInput.css ?? ""
      js: cleanInput.js ?? "",
      searchText, // ← ADD
      seoData: cleanInput.seoData ?? null,
      componentSettings: cleanInput.componentSettings ?? null,
      status:
        cleanInput.status === "PUBLISHED" || cleanInput.status === "published"
          ? "PUBLISHED"
          : "DRAFT",
      tenantId,
    },
  });

  await clearSitemapCache(tenantId);

  return createdPage;
}

export async function updatePage(id, input) {
  await requirePermission("pages_edit_any");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const { id: _, createdAt, updatedAt, ...cleanInput } = input;

  const hasSlug = Object.prototype.hasOwnProperty.call(cleanInput, "slug");
  if (hasSlug) {
    cleanInput.slug = cleanInput.slug.trim()
      ? generateSlug(cleanInput.slug)
      : "";
  } else if (cleanInput.title) {
    const settings = await prisma.sitesettings.findUnique({
      where: { tenantId },
      select: { homepageType: true, homepagePageId: true },
    });
    cleanInput.slug =
      settings?.homepageType === "page" &&
      Number(settings.homepagePageId) === Number(id)
        ? ""
        : generateSlug(cleanInput.title);
  }

  const existingPage = await prisma.page.findFirst({
    where: {
      id: Number(id),
      tenantId,
    },
  });
  if (!existingPage) {
    throw new Error("Page not found");
  }

  // TRACK OLD SLUG FOR REDIRECT
  const oldSlug = existingPage.slug;

  if (hasSlug || cleanInput.slug) {
    if (await isSlugTaken(cleanInput.slug, tenantId, id)) {
      throw new Error(`Slug "${cleanInput.slug}" is already taken`);
    }
  }

  // Regenerate arbitrary CSS whenever HTML is being updated
  if (cleanInput.html !== undefined) {
    if (typeof cleanInput.html === "string" && cleanInput.html.trim()) {
      cleanInput.html = await processImageSeo({
        html: cleanInput.html,
        pageTitle: cleanInput.title ?? existingPage.title ?? "",
        seoData: cleanInput.seoData ?? existingPage.seoData ?? {},
        tenantId,
      });
    }
    const arbitraryCss = generateArbitraryCss(cleanInput.html);
    const userCss = (cleanInput.css ?? existingPage.css ?? "")
      .replace(/\/\* ── auto-generated arbitrary classes ── \*\/[\s\S]*/g, "")
      .trim();
    cleanInput.css = mergePageCss(userCss, arbitraryCss);
    cleanInput.searchText = extractSearchableText(cleanInput.html ?? "");
  }

  if (cleanInput.status) {
    cleanInput.status =
      cleanInput.status.toUpperCase() === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  }

  // UPDATE PAGE
  const updatedPage = await prisma.page.update({
    where: { id: Number(id) },
    data: cleanInput,
  });

  await clearSitemapCache(tenantId);

  // CREATE REDIRECT IF SLUG CHANGED
  if (cleanInput.slug && oldSlug !== cleanInput.slug) {
    try {
      const existingRedirect = await prisma.redirect.findUnique({
        where: { sourceUrl: normalizeURL(`/${oldSlug}`) },
      });

      if (!existingRedirect) {
        await prisma.redirect.create({
          data: {
            sourceUrl: normalizeURL(`/${oldSlug}`),
            destinationUrl: normalizeURL(`/${cleanInput.slug}`),
            statusCode: 301,
            description: `Page renamed: ${oldSlug} → ${cleanInput.slug}`,
            isAutoDetected: true,
            tenantId,
          },
        });
        await clearRedirectCache();
      }
    } catch (err) {
      if (!String(err?.message).includes("Unique constraint")) {
        console.error("Failed to create redirect:", err);
      }
    }
  }

  return updatedPage;
}

export async function deletePage(id) {
  await requirePermission("pages_delete");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const existingPage = await prisma.page.findFirst({
    where: {
      id: Number(id),
      tenantId,
    },
  });
  if (!existingPage) {
    throw new Error("Page not found");
  }
  // DELETE MARKDOWN
  await prisma.AICrawlContent.deleteMany({
    where: {
      tenantId,
      contentType: "page",
      contentId: String(id),
    },
  });

  const pagedelete = await prisma.page.delete({
    where: { id: Number(id) },
  });

  await clearSitemapCache(tenantId);

  return pagedelete;
}

export async function BulkDeletePages(ids) {
  await requirePermission("pages_delete");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const bulkDelete = await prisma.page.deleteMany({
    where: {
      id: { in: ids.map(Number) },
      tenantId,
    },
  });

  await clearSitemapCache(tenantId);

  return bulkDelete;
}
export async function publishPage(id) {
  await requirePermission("pages_edit_any");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const existingPage = await prisma.page.findFirst({
    where: {
      id: Number(id),
      tenantId,
    },
  });

  if (!existingPage) {
    throw new Error("Page not found");
  }

  const updatedPage = await prisma.page.update({
    where: { id: Number(id) },
    data: {
      status: "PUBLISHED",
    },
  });

  await clearSitemapCache(tenantId);

  return updatedPage;
}
export async function unpublishPage(id) {
  await requirePermission("pages_edit_any");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const existingPage = await prisma.page.findFirst({
    where: {
      id: Number(id),
      tenantId,
    },
  });
  if (!existingPage) {
    throw new Error("Page not found");
  }

  const updatedPage = await prisma.page.update({
    where: { id: Number(id) },
    data: {
      status: "DRAFT",
    },
  });

  await clearSitemapCache(tenantId);

  return updatedPage;
}

export async function isSlugAvailable(slug, excludeId) {
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  return !(await isSlugTaken(slug, tenantId, excludeId));
}

export async function getPublicPageById(id) {
  return prisma.page.findFirst({
    where: {
      id: Number(id),
      status: "PUBLISHED",
    },
  });
}
