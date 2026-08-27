import { prisma } from "../../prisma.js";
import { requireAuth, requirePermission } from "../../withPermission.js";

// ═══════════════════════════════════════════════════════════
// GET BULK SEO DATA
// ═══════════════════════════════════════════════════════════

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://next-crm-momemtums.vercel.app");

export async function getBulkSeo() {
  await requirePermission("settings_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const [pages, posts] = await Promise.all([
    prisma.page.findMany({
      where: {
        tenantId,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        seoData: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),

    prisma.post.findMany({
      where: {
        tenantId,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        seoData: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);

  const pageItems = pages.map((page) => ({
    id: page.id,
    type: "page",
    title: page.title,
    slug: page.slug,
    status: page.status,
    seoData: page.seoData || {},
    updatedAt: page.updatedAt,
  }));

  const postItems = posts.map((post) => ({
    id: post.id,
    type: "post",
    title: post.title,
    slug: post.slug,
    status: post.status,
    seoData: post.seoData || {},
    updatedAt: post.updatedAt,
  }));

  return [...pageItems, ...postItems].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
  );
}

// ═══════════════════════════════════════════════════════════
// UPDATE BULK SEO
// ═══════════════════════════════════════════════════════════

export async function updateBulkSeo(items) {
  await requirePermission("settings_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://next-crm-momemtums.vercel.app";

  for (const item of items) {
    const defaultCanonical = `${siteUrl}${
      item.slug === "home" ? "" : `/${item.slug}`
    }`;

    const seoData = { ...item.seoData };

    if (seoData.canonicalUrl === defaultCanonical) {
      delete seoData.canonicalUrl;
    }

    if (item.type === "page") {
      const page = await prisma.page.findUnique({
        where: { id: Number(item.id) },
        select: { seoData: true },
      });

      await prisma.page.update({
        where: { id: Number(item.id) },
        data: {
          seoData: {
            ...(page?.seoData || {}),
            ...seoData,
          },
        },
      });
    }

    if (item.type === "post") {
      const post = await prisma.post.findUnique({
        where: { id: item.id },
        select: { seoData: true },
      });

      await prisma.post.update({
        where: { id: item.id },
        data: {
          seoData: {
            ...(post?.seoData || {}),
            ...seoData,
          },
        },
      });
    }
  }

  return {
    success: true,
    updated: items.length,
  };
}
