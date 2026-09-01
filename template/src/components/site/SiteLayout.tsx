"use client";

import React, { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/src/hooks/use-current-user";
import { buildAdminToolbarHtml } from "@/src/lib/admin-toolbar";
import { fetchers } from "@/src/lib/fetchers";
import SiteNavbar from "./siteNavbar";
import SiteFooter from "./SiteFooter";

import AnalyticsScripts from "./AnalyticsScripts";
import { CartProvider } from "@/src/lib/storefront/cart";
import { useInstalledModules } from "@/src/lib/useInstalledModules";

const DEFAULT_FOOTER_SETTINGS = {
  footerLogo: "",
  footerBrandTitle: "",
  footerDescription: "",
  footerAddress: "",
  footerEmail: "",
  footerCopyright: "",
  socialLinks: [] as any[],
};

const DEFAULT_BREADCRUMB_SETTINGS = {
  enabled: true,
  homeLabel: "Home",
  separator: "/",
  showHome: true,
  showParent: true,
  showCurrent: true,
  schemaEnabled: false,
  cssClass: "",
  linkColor: "#4b5563",
  linkHoverColor: "#111827",
  currentColor: "#6b7280",
  separatorColor: "#9ca3af",
  customCss: "",
};

export interface PublicBootstrapData {
  data: {
    settings: any;
    homepage: any;
    menus: any[];
    footerMenus: any[];
    footerSettings: any;
    footerConfig?: any;
    navbarConfig?: any;
    assets: { css?: string; js?: string };
    breadcrumbSettings?: any;
    analyticsSettings?: any;
  };
}

interface SiteLayoutProps {
  children: React.ReactNode;
  pageId?: string | number | null;
  editUrl?: string;
  initialBootstrapData: PublicBootstrapData;
}

export default function SiteLayout({
  children,
  pageId,
  editUrl,
  initialBootstrapData,
}: SiteLayoutProps) {
  const { user } = useCurrentUser();

  const { data: bootstrapData } = useQuery<PublicBootstrapData>({
    queryKey: ["public", "bootstrap"],
    queryFn: fetchers.publicBootstrap,
    initialData: initialBootstrapData,
    staleTime: 60_000,
  });
  const modules = useInstalledModules();

  const settings = useMemo(
    () => bootstrapData?.data?.settings,
    [bootstrapData],
  );

  const menus = useMemo(
    () => bootstrapData?.data?.menus ?? [],
    [bootstrapData],
  );

  const footerMenus = useMemo(
    () => bootstrapData?.data?.footerMenus ?? [],
    [bootstrapData],
  );

  const footerSettings = useMemo(
    () => bootstrapData?.data?.footerSettings ?? {},
    [bootstrapData],
  );

  const globalCss = useMemo(
    () => bootstrapData?.data?.assets?.css ?? "",
    [bootstrapData],
  );

  const globalJs = useMemo(
    () => bootstrapData?.data?.assets?.js ?? "",
    [bootstrapData],
  );

  const highlightAutoLinks = settings?.highlightAutoLinks ?? false;

  const footerConfig = bootstrapData?.data?.footerConfig;
  const navbarConfig = bootstrapData?.data?.navbarConfig;

  const breadcrumbSettings = {
    ...DEFAULT_BREADCRUMB_SETTINGS,
    ...bootstrapData?.data?.breadcrumbSettings,
  };

  const headerMenu = useMemo(
    () => menus.find((menu) => menu.location === "header"),
    [menus],
  );

  const footer = useMemo(
    () => ({
      ...DEFAULT_FOOTER_SETTINGS,
      ...footerSettings,
      footerBrandTitle:
        footerSettings.footerBrandTitle || settings?.siteName || "My Website",
      footerCopyright:
        footerSettings.footerCopyright ||
        `© ${new Date().getFullYear()} ${settings?.siteName}. All rights reserved.`,
    }),
    [footerSettings, settings],
  );

  const isAdmin = user?.role === "ADMIN";

  const showToolbar = settings?.showAdminToolbar && isAdmin;

  useEffect(() => {
    const existing = document.getElementById("global-cms-js");

    if (!globalJs) {
      existing?.remove();
      return;
    }

    if (existing) {
      if (existing.textContent !== globalJs) {
        const script = document.createElement("script");
        script.id = "global-cms-js";
        script.textContent = globalJs;
        existing.replaceWith(script);
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "global-cms-js";
    script.textContent = globalJs;
    document.body.appendChild(script);
  }, [globalJs]);

  useEffect(() => {
    const styleId = "auto-link-highlight-css";
    const existing = document.getElementById(
      styleId,
    ) as HTMLStyleElement | null;

    if (!highlightAutoLinks) {
      existing?.remove();
      return;
    }

    if (existing) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent =
      ".auto-internal-link { border-bottom: 1px dotted currentColor; }";
    document.head.appendChild(style);

    return () => style.remove();
  }, [highlightAutoLinks]);

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        {globalCss && (
          <style
            id="global-cms-css"
            dangerouslySetInnerHTML={{ __html: globalCss }}
          />
        )}

        <AnalyticsScripts analytics={bootstrapData?.data?.analyticsSettings} />

        {breadcrumbSettings?.customCss && (
          <style
            id="breadcrumb-custom-css"
            dangerouslySetInnerHTML={{ __html: breadcrumbSettings.customCss }}
          />
        )}

        {showToolbar && (
          <div
            dangerouslySetInnerHTML={{
              __html: buildAdminToolbarHtml({
                pageId,
                siteName: settings?.siteName,
                editUrl,
              }),
            }}
          />
        )}
        <SiteNavbar
          settings={settings}
          headerMenu={headerMenu}
          modules={modules ?? []}
        />

        {children}
        <SiteFooter
          footer={footer}
          footerMenus={footerMenus}
          config={footerConfig}
        />
      </div>
    </CartProvider>
  );
}
