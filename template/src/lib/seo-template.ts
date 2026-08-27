type SeoTemplateVariables = {
  title?: string | null;
  page?: string | number | null;
  separator?: string | null;
  sep?: string | null;
  siteName?: string | null;
  sitename?: string | null;
};

const normalize = (value: unknown) =>
  typeof value === "string" ? value.trim() : value == null ? "" : String(value);

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function resolveSeoTemplate(
  template: string | null | undefined,
  vars: SeoTemplateVariables,
) {
  const rawTemplate = normalize(template);
  if (!rawTemplate) return "";

  const title = normalize(vars.title);
  const pageValue =
    typeof vars.page === "number"
      ? vars.page > 1
        ? `Page ${vars.page}`
        : ""
      : normalize(vars.page);
  const separator = normalize(vars.separator ?? vars.sep ?? "|");
  const siteName = normalize(vars.siteName ?? vars.sitename);

  let resolved = rawTemplate
    .replace(/%title%/gi, title)
    .replace(/%page%/gi, pageValue)
    .replace(/%sep%/gi, separator)
    .replace(/%sitename%/gi, siteName)
    .replace(/%[a-z0-9_-]+%/gi, "");

  if (separator) {
    const escapedSeparator = escapeRegExp(separator);
    resolved = resolved
      .replace(new RegExp(`\\s*${escapedSeparator}\\s*$`), "")
      .replace(new RegExp(`^\\s*${escapedSeparator}\\s*`), "");
  }

  return resolved
    .replace(/\s+([|/\\:;,.!?])/g, " $1")
    .replace(/([|/\\:;,.!?])\s+/g, "$1 ")
    .replace(/^\s*[|/\\:;,.!?]\s*/, "")
    .replace(/\s*[|/\\:;,.!?]\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function resolveSeoTitle(
  seoData:
    | {
        metaTitle?: string | null;
        titleTemplate?: string | null;
        separator?: string | null;
        ogTitle?: string | null;
        twitterTitle?: string | null;
      }
    | null
    | undefined,
  vars: Omit<SeoTemplateVariables, "separator" | "sep"> & {
    separator?: string | null;
  },
) {
  const seo = seoData ?? {};
  const separator = seo.separator ?? vars.separator ?? "|";
  const titleTemplate = normalize(seo.titleTemplate);
  const metaTitle = normalize(seo.metaTitle);
  const fallbackTitle = normalize(vars.title);

  return (
    resolveSeoTemplate(metaTitle || titleTemplate, {
      ...vars,
      separator,
    }) || fallbackTitle
  );
}
