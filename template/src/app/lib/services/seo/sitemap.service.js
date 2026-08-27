import { prisma } from "../../prisma.js";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getBasePath() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return "";
  try {
    return new URL(siteUrl).pathname.replace(/\/$/, "");
  } catch {
    return "";
  }
}

export async function clearSitemapCache(tenantId) {
  await prisma.sitesettings.updateMany({
    where: {
      tenantId,
    },
    data: {
      cachedSitemapXml: null,
      cachedSitemapExpiresAt: null,
    },
  });
}

async function resolveTenantId(tenantId) {
  if (tenantId !== undefined && tenantId !== null) {
    return tenantId;
  }

  const tenant = await prisma.tenant.findFirst({
    select: { id: true },
  });

  return tenant?.id;
}

// Get Site Settings
async function getSiteSettings(tenantId) {
  return prisma.sitesettings.findUnique({
    where: {
      tenantId,
    },
  });
}

// Get Pages
async function getPageUrls(tenantId) {
  const pages = await prisma.page.findMany({
    where: {
      tenantId,
      status: "PUBLISHED",
      sitemapEnabled: true,
    },
    select: {
      slug: true,
      updatedAt: true,
      sitemapPriority: true,
      sitemapChangeFreq: true,
    },
  });

  return pages.map((page) => ({
    url: `/${page.slug}`,
    lastModified: page.updatedAt,
    priority: Number(page.sitemapPriority),
    changeFreq: page.sitemapChangeFreq.toLowerCase(),
  }));
}

// Get Posts
async function getPostUrls(tenantId) {
  const posts = await prisma.post.findMany({
    where: {
      tenantId,
      status: "PUBLISHED",
      sitemapEnabled: true,
    },
    select: {
      slug: true,
      updatedAt: true,
      sitemapPriority: true,
      sitemapChangeFreq: true,
    },
  });

  return posts.map((post) => ({
    url: `/blog/${post.slug}`,
    lastModified: post.updatedAt,
    priority: Number(post.sitemapPriority),
    changeFreq: post.sitemapChangeFreq.toLowerCase(),
  }));
}

// Get Categories
async function getCategoryUrls(tenantId) {
  const categories = await prisma.category.findMany({
    where: {
      tenantId,
      sitemapEnabled: true,
    },
    select: {
      slug: true,
      sitemapPriority: true,
      sitemapChangeFreq: true,
      updatedAt: false,
    },
  });

  return categories.map((category) => ({
    url: `/category/${category.slug}`,
    lastModified: new Date(),
    priority: Number(category.sitemapPriority),
    changeFreq: category.sitemapChangeFreq.toLowerCase(),
  }));
}

// Get Tags
async function getTagUrls(tenantId) {
  const tags = await prisma.tag.findMany({
    where: {
      tenantId,
      sitemapEnabled: true,
    },
    select: {
      slug: true,
      sitemapPriority: true,
      sitemapChangeFreq: true,
    },
  });

  return tags.map((tag) => ({
    url: `/tag/${tag.slug}`,
    lastModified: new Date(),
    priority: Number(tag.sitemapPriority),
    changeFreq: tag.sitemapChangeFreq.toLowerCase(),
  }));
}

// Get Courses
// async function getCourseUrls(tenantId) {
//   const courses = await prisma.course.findMany({
//     where: {
//       tenantId,
//       isPublished: true,
//       sitemapEnabled: true,
//     },
//     select: {
//       slug: true,
//       updatedAt: true,
//       sitemapPriority: true,
//       sitemapChangeFreq: true,
//     },
//   });

//   return courses.map((course) => ({
//     url: `/courses/${course.slug}`,
//     lastModified: course.updatedAt,
//     priority: Number(course.sitemapPriority),
//     changeFreq: course.sitemapChangeFreq.toLowerCase(),
//   }));
// }

// Generate XML for single sitemap
function generateSitemapXml(siteUrl, urls) {
  const basePath = getBasePath();
  const xml = urls
    .map(
      (item) => `
  <url>
    <loc>${siteUrl}${item.url}</loc>
    <lastmod>${item.lastModified.toISOString()}</lastmod>
    <changefreq>${item.changeFreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${basePath}/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xml}
</urlset>`;
}

// Generate Sitemap Index (lists all sitemaps)
function generateSitemapIndex(siteUrl, sitemaps) {
  const basePath = getBasePath();
  const xml = sitemaps
    .map(
      (sitemap) => `
  <sitemap>
    <loc>${siteUrl}/api/seo/sitemap-${sitemap.type}.xml</loc>
    <lastmod>${sitemap.lastmod.toISOString()}</lastmod>
  </sitemap>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${basePath}/sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xml}
</sitemapindex>`;
}

// ─────────────────────────────────────────────
// Public - Individual Sitemaps
// ─────────────────────────────────────────────

export async function getPagesSitemap(tenantId) {
  const resolvedTenantId = await resolveTenantId(tenantId);
  if (!resolvedTenantId) throw new Error("No tenant found");

  const settings = await getSiteSettings(resolvedTenantId);
  if (!settings?.sitemapEnabled) throw new Error("Sitemap is disabled");
  if (!settings.includePages) throw new Error("Pages not included in sitemap");

  const urls = await getPageUrls(resolvedTenantId);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return generateSitemapXml(siteUrl, urls);
}

export async function getPostsSitemap(tenantId) {
  const resolvedTenantId = await resolveTenantId(tenantId);
  if (!resolvedTenantId) throw new Error("No tenant found");

  const settings = await getSiteSettings(resolvedTenantId);
  if (!settings?.sitemapEnabled) throw new Error("Sitemap is disabled");
  if (!settings.includePosts) throw new Error("Posts not included in sitemap");

  const urls = await getPostUrls(resolvedTenantId);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return generateSitemapXml(siteUrl, urls);
}

export async function getCategoriesSitemap(tenantId) {
  const resolvedTenantId = await resolveTenantId(tenantId);
  if (!resolvedTenantId) throw new Error("No tenant found");

  const settings = await getSiteSettings(resolvedTenantId);
  if (!settings?.sitemapEnabled) throw new Error("Sitemap is disabled");
  if (!settings.includeCategories)
    throw new Error("Categories not included in sitemap");

  const urls = await getCategoryUrls(resolvedTenantId);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return generateSitemapXml(siteUrl, urls);
}

export async function getTagsSitemap(tenantId) {
  const resolvedTenantId = await resolveTenantId(tenantId);
  if (!resolvedTenantId) throw new Error("No tenant found");

  const settings = await getSiteSettings(resolvedTenantId);
  if (!settings?.sitemapEnabled) throw new Error("Sitemap is disabled");
  if (!settings.includeTags) throw new Error("Tags not included in sitemap");

  const urls = await getTagUrls(resolvedTenantId);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return generateSitemapXml(siteUrl, urls);
}

export async function getCoursesSitemap(tenantId) {
  const resolvedTenantId = await resolveTenantId(tenantId);
  if (!resolvedTenantId) throw new Error("No tenant found");

  const settings = await getSiteSettings(resolvedTenantId);
  if (!settings?.sitemapEnabled) throw new Error("Sitemap is disabled");
  // if (!settings.includeCourses) throw new Error("Courses not included in sitemap");

  // const urls = await getCourseUrls(resolvedTenantId);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return generateSitemapXml(siteUrl, urls);
}

// Sitemap Index - lists all available sitemaps
export async function getSitemapIndex(tenantId) {
  const resolvedTenantId = await resolveTenantId(tenantId);
  if (!resolvedTenantId) throw new Error("No tenant found");

  const settings = await getSiteSettings(resolvedTenantId);
  if (!settings?.sitemapEnabled) throw new Error("Sitemap is disabled");

  const sitemaps = [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Add enabled sitemaps to index
  if (settings.includePages) {
    const pages = await prisma.page.findFirst({
      where: { tenantId: resolvedTenantId, status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });
    if (pages) sitemaps.push({ type: "pages", lastmod: pages.updatedAt });
  }

  if (settings.includePosts) {
    const posts = await prisma.post.findFirst({
      where: { tenantId: resolvedTenantId, status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });
    if (posts) sitemaps.push({ type: "posts", lastmod: posts.updatedAt });
  }

  if (settings.includeCategories) {
    const categories = await prisma.category.findFirst({
      where: { tenantId: resolvedTenantId },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });
    if (categories)
      sitemaps.push({ type: "category", lastmod: categories.updatedAt });
  }

  if (settings.includeTags) {
    const tags = await prisma.tag.findFirst({
      where: { tenantId: resolvedTenantId },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });
    if (tags) sitemaps.push({ type: "tags", lastmod: tags.updatedAt });
  }

  // if (settings.includeCourses) {
  //   const courses = await prisma.course.findFirst({
  //     where: { tenantId: resolvedTenantId, isPublished: true },
  //     orderBy: { updatedAt: "desc" },
  //     select: { updatedAt: true },
  //   });
  //   if (courses) sitemaps.push({ type: "courses", lastmod: courses.updatedAt });
  // }

  return generateSitemapIndex(siteUrl, sitemaps);
}

// ─────────────────────────────────────────────
// Public - Settings & Stats (existing functions)
// ─────────────────────────────────────────────

export async function getSitemapSettings(tenantId) {
  return prisma.sitesettings.findUnique({
    where: { tenantId },
    select: {
      sitemapEnabled: true,
      sitemapCacheMinutes: true,
      pingSearchEngines: true,
      includePages: true,
      includePosts: true,
      includeCategories: true,
      includeTags: true,
      // includeCourses: true,
      sitemapLastGeneratedAt: true,
      sitemapCustomUrl: true,
    },
  });
}

export async function updateSitemapSettings(data, tenantId) {
  return prisma.sitesettings.updateMany({
    where: { tenantId },
    data: {
      sitemapEnabled: data.sitemapEnabled,
      sitemapCacheMinutes: data.sitemapCacheMinutes,
      pingSearchEngines: data.pingSearchEngines,
      includePages: data.includePages,
      includePosts: data.includePosts,
      includeCategories: data.includeCategories,
      includeTags: data.includeTags,
      // includeCourses: data.includeCourses,
      sitemapCustomUrl: data.sitemapCustomUrl,
    },
  });
}

export async function getSitemapStats(tenantId) {
  const [pages, posts, categories, tags, settings] = await Promise.all([
    prisma.page.count({
      where: {
        tenantId,
        status: "PUBLISHED",
        sitemapEnabled: true,
      },
    }),
    prisma.post.count({
      where: {
        tenantId,
        status: "PUBLISHED",
        sitemapEnabled: true,
      },
    }),
    prisma.category.count({
      where: {
        tenantId,
        sitemapEnabled: true,
      },
    }),
    prisma.tag.count({
      where: {
        tenantId,
        sitemapEnabled: true,
      },
    }),

    prisma.sitesettings.findUnique({
      where: { tenantId },
      select: {
        sitemapLastGeneratedAt: true,
      },
    }),
  ]);

  return {
    totalUrls: pages + posts + categories + tags,
    pages,
    posts,
    categories,
    tags,

    lastGenerated: settings?.sitemapLastGeneratedAt,
  };
}

export async function getSitemapPreview(tenantId) {
  const settings = await getSiteSettings(tenantId);

  const urls = [];

  if (settings.includePages) {
    urls.push(...(await getPageUrls(tenantId)));
  }

  if (settings.includePosts) {
    urls.push(...(await getPostUrls(tenantId)));
  }

  if (settings.includeCategories) {
    urls.push(...(await getCategoryUrls(tenantId)));
  }

  if (settings.includeTags) {
    urls.push(...(await getTagUrls(tenantId)));
  }

  // if (settings.includeCourses) {
  //   urls.push(...(await getCourseUrls(tenantId)));
  // }

  return urls.slice(0, 15);
}

export async function regenerateSitemap(tenantId) {
  await clearSitemapCache(tenantId);

  // Regenerate all sitemaps
  await Promise.all([
    getPagesSitemap(tenantId).catch(() => {}),
    getPostsSitemap(tenantId).catch(() => {}),
    getCategoriesSitemap(tenantId).catch(() => {}),
    getTagsSitemap(tenantId).catch(() => {}),
    // getCoursesSitemap(tenantId).catch(() => {}),
  ]);

  await prisma.sitesettings.updateMany({
    where: { tenantId },
    data: {
      sitemapLastGeneratedAt: new Date(),
    },
  });

  return {
    regenerated: true,
    generatedAt: new Date(),
  };
}
