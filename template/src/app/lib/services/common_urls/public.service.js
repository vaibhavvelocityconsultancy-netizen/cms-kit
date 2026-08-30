import { prisma } from "../../prisma.js";
import { getPublicNavbarConfig } from "../settings/navbar-config.service.js";
import { getPublicFooterConfig } from "../settings/footer-config.service.js";
import { processInternalLinks } from "../seo/internal-link.service.js";

const SETTINGS_ID = 1;

// helper
export async function getPublicAnalyticsSettings(tenantId) {
  if (!prisma.analyticsSettings) return null; // SEO module not installed
  return prisma.analyticsSettings.findUnique({
    where: {
      tenantId,
    },
  });
}

export async function getPublicSettings(tenantId) {
  let resolvedTenantId = tenantId;

  if (resolvedTenantId === undefined) {
    const fallbackTenant = await prisma.tenant.findFirst({
      select: { id: true },
    });

    resolvedTenantId = fallbackTenant?.id;
  }

  const where =
    resolvedTenantId !== undefined
      ? { tenantId: resolvedTenantId }
      : { id: SETTINGS_ID };

  let settings = await prisma.sitesettings.findUnique({ where });

  if (!settings && resolvedTenantId !== undefined) {
    settings = await prisma.sitesettings.create({
      data: {
        updatedAt: new Date(),
        tenant: {
          connect: { id: resolvedTenantId },
        },
      },
    });
  }

  return settings;
}
export async function getPublicFooterSettings(tenantId) {
  const settings = await prisma.footerSettings.findMany({
    where: { tenantId },
  });

  const map = {};

  settings.forEach((item) => {
    map[item.key] = item.value;
  });

  return (
    map.footer || {
      footerLogo: "",
      footerBrandTitle: "",
      footerDescription: "",
      footerAddress: "",
      footerEmail: "",
      footerCopyright: "",
      socialLinks: [],
    }
  );
}

export async function getPublicMenus(tenantId) {
  if (!prisma.menu) return []; // Menus module not installed

  const where = tenantId !== undefined ? { tenantId } : {};

  return prisma.menu.findMany({
    where,
    include: {
      menuitem: {
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function getPublicPageById(id, tenantId) {
  const where = {
    id: Number(id),
    status: "PUBLISHED",
    ...(tenantId !== undefined ? { tenantId } : {}),
  };

  const page = await prisma.page.findFirst({
    where,
    select: {
      id: true,
      title: true,
      slug: true,
      html: true,
      css: true,
      js: true,
      seoData: true,
    },
  });

  if (page?.html) {
    page.html = await processInternalLinks(
      page.html,
      tenantId ?? page.tenantId,
    );
  }

  return page;
}

export async function getPublicPageBySlug(slug, tenantId) {
  const where = {
    slug,
    status: "PUBLISHED",
    ...(tenantId !== undefined ? { tenantId } : {}),
  };

  const page = await prisma.page.findFirst({
    where,
    select: {
      id: true,
      title: true,
      slug: true,
      html: true,
      css: true,
      js: true,
      seoData: true,
    },
  });

  if (page?.html) {
    page.html = await processInternalLinks(
      page.html,
      tenantId ?? page.tenantId,
    );
  }

  return page;
}

export async function getPublicPosts(tenantId) {
  const where = {
    status: "PUBLISHED",
    ...(tenantId !== undefined ? { tenantId } : {}),
  };

  return prisma.post.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      featuredImage: true,
      publishedAt: true,
      category: { select: { id: true, name: true, slug: true } },
      tag: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function getPublicPlans(tenantId) {
  if (!prisma.plan) return []; // safety guard

  const where = {
    isPublished: true,
    ...(tenantId !== undefined ? { tenantId } : {}),
  };

  return prisma.plan.findMany({
    where,
    include: {
      features: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getPublicBootstrapData(tenantId) {
  const settings = await getPublicSettings(tenantId);
  const resolvedTenantId = tenantId ?? settings.tenantId;

  const [
    menus,
    footerSettings,
    homepage,
    breadcrumbSettings,
    navbarConfig,
    footerConfig,
    analyticsSettings,
  ] = await Promise.all([
    getPublicMenus(resolvedTenantId),
    getPublicFooterSettings(resolvedTenantId),
    settings.homepageType === "page" && settings.homepagePageId
      ? getPublicPageById(settings.homepagePageId, resolvedTenantId)
      : Promise.resolve(null),
    prisma.breadcrumbSettings
      ? prisma.breadcrumbSettings.findUnique({
          where: { tenantId: resolvedTenantId },
        })
      : Promise.resolve(null),
    getPublicNavbarConfig(resolvedTenantId),
    getPublicFooterConfig(resolvedTenantId),
    getPublicAnalyticsSettings(resolvedTenantId),
  ]);

  return {
    settings,

    homepage: {
      type: settings.homepageType,
      pageId: settings.homepagePageId ?? null,
      page: homepage,
    },

    menus,
    footerMenus: menus.filter((m) => m.location === "footer"),
    footerSettings,
    breadcrumbSettings,
    navbarConfig,
    footerConfig,
    analyticsSettings,

    assets: {
      css: settings.globalCss ?? "",
      js: settings.globalJs ?? "",
    },
  };
}