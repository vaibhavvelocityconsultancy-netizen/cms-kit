import { injectBreadcrumb } from "./shortcode/renderBreadcrumbHtml";
import { injectForms } from "./form-renderer";

interface PublicPageHtmlOptions {
  breadcrumbItems?: Array<{ label: string; href: string }>;
  breadcrumbSettings?: any;
  baseUrl?: string;
  context?: {
    isHome?: boolean;
    is404?: boolean;
    isSearch?: boolean;
  };
}

export async function processPublicPageHtml(
  html: string,
  options: PublicPageHtmlOptions = {},
): Promise<{ html: string; hasForms: boolean }> {
  const { html: formsHtml, hasForms } = await injectForms(
    html,
    options.baseUrl ?? "",
  );

  const breadcrumbItems = options.breadcrumbItems ?? [];
  const breadcrumbSettings = options.breadcrumbSettings;
  const context = options.context ?? {
    isHome: false,
    is404: false,
    isSearch: false,
  };

  const htmlWithBreadcrumb = breadcrumbItems.length
    ? injectBreadcrumb(formsHtml, breadcrumbItems, breadcrumbSettings, context)
    : formsHtml;

  return {
    html: htmlWithBreadcrumb,
    hasForms,
  };
}
