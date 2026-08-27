export type BreadcrumbItem = { label: string; href: string };

export type BreadcrumbSettings = {
  enabled: boolean;
  homeLabel: string;
  separator: string;
  showHome: boolean;
  showParent: boolean;
  showCurrent: boolean;
  schemaEnabled: boolean;
  cssClass: string;
  linkColor: string;
  linkHoverColor: string;
  currentColor: string;
  separatorColor: string;
  hideOnHome: boolean;
  hideOn404: boolean;
  hideOnSearch: boolean;
};

export const DEFAULT_BREADCRUMB_SETTINGS: BreadcrumbSettings = {
  enabled: true,
  homeLabel: "Home",
  separator: "/",
  showHome: true,
  showParent: true,
  showCurrent: true,
  schemaEnabled: true,
  cssClass: "",
  linkColor: "#4b5563",
  linkHoverColor: "#111827",
  currentColor: "#6b7280",
  separatorColor: "#9ca3af",
  hideOnHome: false,
  hideOn404: false,
  hideOnSearch: false,
};

export function renderBreadcrumbHtml(
  items: BreadcrumbItem[],
  settings: BreadcrumbSettings,
): string {
  if (!settings.enabled) return "";

  const crumbs: BreadcrumbItem[] = [];
  if (settings.showHome) crumbs.push({ label: settings.homeLabel, href: "/" });

  const middleItems = items.slice(0, -1);
  const currentItem = items[items.length - 1];

  if (settings.showParent) crumbs.push(...middleItems);
  if (settings.showCurrent && currentItem) crumbs.push(currentItem);
  if (crumbs.length === 0) return "";

  const listItems = crumbs
    .map((item, i) => {
      const isLast = i === crumbs.length - 1;
      const separator = isLast
        ? ""
        : `<span class="mx-2" style="color:${escapeHtml(settings.separatorColor)}">${escapeHtml(settings.separator)}</span>`;
      const content = isLast
        ? `<span class="font-medium" style="color:${escapeHtml(settings.currentColor)}" aria-current="page">${escapeHtml(item.label)}</span>`
        : `<a href="${escapeHtml(item.href)}" class="breadcrumb-link transition-colors" style="color:${escapeHtml(settings.linkColor)}">${escapeHtml(item.label)}</a>`;
      return `<li class="flex items-center">${content}${separator}</li>`;
    })
    .join("");

  const cssClass = settings.cssClass ? ` ${settings.cssClass}` : "";
  const schemaScript = settings.schemaEnabled ? buildBreadcrumbSchema(crumbs) : "";
  const hoverStyle = `<style>.breadcrumb-link:hover{color:${escapeHtml(settings.linkHoverColor)} !important}</style>`;

  return `${hoverStyle}<nav class="breadcrumb${cssClass} mb-6 pb-4" aria-label="breadcrumb">
  <ol class="breadcrumb-list flex items-center flex-wrap text-sm">${listItems}</ol></nav>${schemaScript}`;
}

function buildBreadcrumbSchema(crumbs: BreadcrumbItem[]): string {
  const itemListElement = crumbs.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.label,
    item: item.href,
  }));
  const schema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement };
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
export function injectBreadcrumb(
  html: string,
  items: BreadcrumbItem[],
  settings: BreadcrumbSettings | undefined,
  context: { isHome: boolean; is404: boolean; isSearch: boolean },
): string {
  const resolvedSettings = settings ?? DEFAULT_BREADCRUMB_SETTINGS;
  const shortcode = "[breadcrumb]";

  if (!html.includes(shortcode)) return html; // no auto-inject, ever

  const shouldHide =
    !resolvedSettings.enabled ||
    (context.isHome && resolvedSettings.hideOnHome) ||
    (context.is404 && resolvedSettings.hideOn404) ||
    (context.isSearch && resolvedSettings.hideOnSearch);

  const breadcrumbHtml = shouldHide ? "" : renderBreadcrumbHtml(items, resolvedSettings);
  return html.replaceAll(shortcode, breadcrumbHtml);
}