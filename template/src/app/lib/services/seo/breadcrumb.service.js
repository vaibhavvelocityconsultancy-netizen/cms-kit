import { prisma } from "../../prisma";
import { requireAuth, requirePermission } from "../../withPermission";

// ═══════════════════════════════════════════════════════════
// GET BREADCRUMB SETTINGS
// ═══════════════════════════════════════════════════════════

export async function getBreadcrumbSettings() {
  await requirePermission("settings_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  let settings = await prisma.breadcrumbSettings.findUnique({
    where: {
      tenantId,
    },
  });

  if (!settings) {
    settings = await prisma.breadcrumbSettings.create({
      data: {
        tenantId,
      },
    });
  }

  return settings;
}

// ═══════════════════════════════════════════════════════════
// UPDATE BREADCRUMB SETTINGS
// ═══════════════════════════════════════════════════════════

export async function updateBreadcrumbSettings(data) {
  await requirePermission("settings_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const settings = await prisma.breadcrumbSettings.upsert({
    where: {
      tenantId,
    },
    update: {
      enabled: data.enabled,
      homeLabel: data.homeLabel,
      separator: data.separator,

      showHome: data.showHome,
      showCurrent: data.showCurrent,
      showParent: data.showParent,

      pagesEnabled: data.pagesEnabled,
      postsEnabled: data.postsEnabled,
      categoriesEnabled: data.categoriesEnabled,
      tagsEnabled: data.tagsEnabled,
      coursesEnabled: data.coursesEnabled,

      hideOnHome: data.hideOnHome,
      hideOn404: data.hideOn404,
      hideOnSearch: data.hideOnSearch,

      schemaEnabled: data.schemaEnabled,

      cssClass: data.cssClass,
      customCss: data.customCss,
      linkColor: data.linkColor,
      linkHoverColor: data.linkHoverColor,
      currentColor: data.currentColor,
      separatorColor: data.separatorColor,
    },
    create: {
      tenantId,

      enabled: data.enabled ?? true,
      homeLabel: data.homeLabel ?? "Home",
      separator: data.separator ?? "/",

      showHome: data.showHome ?? true,
      showCurrent: data.showCurrent ?? true,
      showParent: data.showParent ?? true,

      pagesEnabled: data.pagesEnabled ?? true,
      postsEnabled: data.postsEnabled ?? true,
      categoriesEnabled: data.categoriesEnabled ?? true,
      tagsEnabled: data.tagsEnabled ?? true,
      coursesEnabled: data.coursesEnabled ?? true,

      hideOnHome: data.hideOnHome ?? true,
      hideOn404: data.hideOn404 ?? true,
      hideOnSearch: data.hideOnSearch ?? false,

      schemaEnabled: data.schemaEnabled ?? true,

      cssClass: data.cssClass,
      customCss: data.customCss,
      linkColor: data.linkColor ?? "#4b5563",
      linkHoverColor: data.linkHoverColor ?? "#111827",
      currentColor: data.currentColor ?? "#6b7280",
      separatorColor: data.separatorColor ?? "#9ca3af",
    },
  });

  return settings;
}
