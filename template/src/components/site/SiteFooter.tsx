"use client";
 
import Link from "next/link";
import { useEffect, useMemo } from "react";
 
type MediaValue =
  | string
  | {
      url?: string;
      src?: string;
      fileUrl?: string;
      secureUrl?: string;
      secure_url?: string;
    }
  | null;
 
type FooterMenuItem = {
  id: string | number;
  label: string;
  type?: string;
  slug?: string;
  url?: string;
  parentId?: string | number | null;
  children?: FooterMenuItem[];
};
 
type FooterMenu = {
  id?: string | number;
  title?: string;
  name?: string;
  label?: string;
  slug?: string;
  menuitem?: FooterMenuItem[];
  menuitems?: FooterMenuItem[];
  items?: FooterMenuItem[];
};
 
type SocialLink = {
  platform?: string;
  url?: string;
  link?: string;
  icon?: MediaValue;
  iconUrl?: string;
};
 
type FooterContent = {
  footerLogo?: MediaValue;
  logo?: MediaValue;
  footerBrandTitle?: string | null;
  brandTitle?: string | null;
  footerDescription?: string | null;
  description?: string | null;
  footerAddress?: string | null;
  contactAddress?: string | null;
  footerEmail?: string | null;
  contactEmail?: string | null;
  footerCopyright?: string | null;
  copyrightText?: string | null;
  socialLinks?: SocialLink[];
  socials?: SocialLink[];
  loginLabel?: string;
  loginUrl?: string;
  secondaryAuthLabel?: string;
  secondaryAuthUrl?: string;
};
 
type FooterConfig = {
  customCss?: string;
};
 
type SiteFooterProps = {
  footer?: FooterContent;
  footerMenus?: FooterMenu[];
  config?: FooterConfig;
};
 
function scopeCss(rawCss: string, scopeSelector = "#site-footer") {
  if (!rawCss) return "";
 
  return rawCss.replace(/([^{}]+)\{/g, (match, selector) => {
    const trimmedSelector = selector.trim();
 
    if (
      trimmedSelector.startsWith("@") ||
      trimmedSelector.includes("from") ||
      trimmedSelector.includes("to") ||
      /^\d+%$/.test(trimmedSelector)
    ) {
      return match;
    }
 
    const scopedSelector = selector
      .split(",")
      .map((item: string) => `${scopeSelector} ${item.trim()}`)
      .join(", ");
 
    return `${scopedSelector} {`;
  });
}
 
function cleanText(value?: string | null) {
  if (!value) return "";
 
  const cleaned = value.trim();
 
  if (
    !cleaned ||
    cleaned.toLowerCase() === "null" ||
    cleaned.toLowerCase() === "undefined"
  ) {
    return "";
  }
 
  return cleaned;
}
 
function getMediaUrl(value?: MediaValue, fallback?: string) {
  if (typeof value === "string") {
    return cleanText(value) || fallback || "";
  }
 
  if (value && typeof value === "object") {
    return (
      cleanText(value.url) ||
      cleanText(value.src) ||
      cleanText(value.fileUrl) ||
      cleanText(value.secureUrl) ||
      cleanText(value.secure_url) ||
      fallback ||
      ""
    );
  }
 
  return fallback || "";
}
 
function getMenuItems(menu?: FooterMenu): FooterMenuItem[] {
  return menu?.menuitem ?? menu?.menuitems ?? menu?.items ?? [];
}
 
function buildFooterTree(items: FooterMenuItem[]): FooterMenuItem[] {
  const itemMap = new Map<string, FooterMenuItem>();
  const rootItems: FooterMenuItem[] = [];
 
  items.forEach((item) => {
    itemMap.set(String(item.id), { ...item, children: [] });
  });
 
  items.forEach((item) => {
    const currentItem = itemMap.get(String(item.id));
 
    if (!currentItem) return;
 
    if (item.parentId !== null && item.parentId !== undefined) {
      const parentItem = itemMap.get(String(item.parentId));
 
      if (parentItem) {
        parentItem.children?.push(currentItem);
        return;
      }
    }
 
    rootItems.push(currentItem);
  });
 
  return rootItems;
}
 
function getMenuItemHref(item: FooterMenuItem): string {
  if (item.type === "page" && item.slug) {
    return `/${item.slug.replace(/^\/+/, "")}`;
  }
 
  return item.url || "#";
}
 
function formatMenuTitle(menu?: FooterMenu): string {
  const rawTitle =
    menu?.title ||
    menu?.label ||
    menu?.name ||
    menu?.slug ||
    "Quick Links";
 
  const cleanTitle = rawTitle
    .replace(/^footer[-_\s]*/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
 
  return cleanTitle
    ? cleanTitle.replace(/\b\w/g, (character) => character.toUpperCase())
    : "Quick Links";
}
 
function getCopyrightText(
  rawCopyright: string,
  brandName: string,
) {
  const currentYear = new Date().getFullYear();
  const safeBrandName = cleanText(brandName) || "iPDAV";
 
  if (!rawCopyright) {
    return `© ${currentYear} ${safeBrandName}. All Rights Reserved.`;
  }
 
  let copyright = rawCopyright
    .replace(/Â©/g, "©")
    .replace(/\{year\}/gi, String(currentYear))
    .replace(/\{brand\}/gi, safeBrandName)
    .replace(/\bnull\b/gi, safeBrandName)
    .replace(/\bundefined\b/gi, safeBrandName)
    .replace(/\b(?:19|20)\d{2}\b/g, String(currentYear))
    .trim();
 
  if (!copyright.includes("©")) {
    copyright = `© ${currentYear} ${copyright}`;
  }
 
  return copyright;
}
 
function renderMenuItems(items: FooterMenuItem[], level = 0) {
  return items.map((item) => {
    const href = getMenuItemHref(item);
    const hasChildren = Boolean(item.children?.length);
 
    return (
      <li
        key={item.id}
        className={level > 0 ? "footer-submenu-item" : undefined}
      >
        <Link href={href}>{item.label}</Link>
 
        {hasChildren ? (
          <ul className="footer-submenu">
            {renderMenuItems(item.children || [], level + 1)}
          </ul>
        ) : null}
      </li>
    );
  });
}
 
function renderAddressLines(address: string) {
  return address.split(/\r?\n/).map((line, index) => (
    <span className="footer-address-line" key={`${line}-${index}`}>
      {line}
    </span>
  ));
}
 
export default function SiteFooter({
  footer,
  footerMenus = [],
  config,
}: SiteFooterProps) {
  useEffect(() => {
    if (!config?.customCss) return;
 
    const styleElement = document.createElement("style");
    styleElement.id = "footer-custom-css";
    styleElement.textContent = scopeCss(config.customCss);
    document.head.appendChild(styleElement);
 
    return () => {
      document.getElementById("footer-custom-css")?.remove();
    };
  }, [config?.customCss]);
 
  const quickLinksMenu = footerMenus[0];
 
  const quickLinks = useMemo(
    () => buildFooterTree(getMenuItems(quickLinksMenu)),
    [quickLinksMenu],
  );
 
  const logoUrl = getMediaUrl(footer?.footerLogo ?? footer?.logo);
  const brandTitle =
    cleanText(footer?.footerBrandTitle) ||
    cleanText(footer?.brandTitle) ||
    "iPDAV";
  const description =
    cleanText(footer?.footerDescription) ||
    cleanText(footer?.description);
  const address =
    cleanText(footer?.footerAddress) ||
    cleanText(footer?.contactAddress);
  const email =
    cleanText(footer?.footerEmail) ||
    cleanText(footer?.contactEmail);
  const rawCopyright =
    cleanText(footer?.footerCopyright) ||
    cleanText(footer?.copyrightText);
 
  const socialLinks = (footer?.socialLinks || footer?.socials || [])
    .map((socialLink) => ({
      ...socialLink,
      href: cleanText(socialLink.url) || cleanText(socialLink.link),
      iconUrl:
        getMediaUrl(socialLink.icon) || cleanText(socialLink.iconUrl),
    }))
    .filter((socialLink) => socialLink.href && socialLink.iconUrl);
 
  const copyrightText = getCopyrightText(
    rawCopyright,
    brandTitle,
  );
 
  return (
    <footer id="site-footer" className="site-footer bg-navy txt-white">
      <div className="site-container footer-grid grid">
        <div className="footer-about">
          {logoUrl ? (
            <Link
              href="/"
              className="footer-brand"
              aria-label={`${brandTitle} home`}
            >
              <img src={logoUrl} alt={brandTitle} />
            </Link>
          ) : (
            <h2 className="footer-brand-title">{brandTitle}</h2>
          )}
 
          {description ? <p>{description}</p> : null}
 
          <div className="footer-auth flex">
            <Link href={footer?.loginUrl || "/login"}>
              {footer?.loginLabel || "Log In"}
            </Link>
 
            <Link href={footer?.secondaryAuthUrl || "/register"}>
              {footer?.secondaryAuthLabel || "Sign In"}
            </Link>
          </div>
        </div>
 
        <div className="footer-contact">
          <h2>Contact Us</h2>
 
          {address ? (
            <address>{renderAddressLines(address)}</address>
          ) : null}
 
          {email ? (
            <a href={`mailto:${email}`}>{email}</a>
          ) : null}
 
          {socialLinks.length > 0 ? (
            <div className="social-links flex" aria-label="Social media">
              {socialLinks.map((socialLink, index) => (
                <a
                  key={`${socialLink.platform || "social"}-${index}`}
                  href={socialLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={socialLink.platform || "Social media"}
                >
                  <img
                    src={socialLink.iconUrl}
                    alt=""
                    aria-hidden="true"
                  />
                </a>
              ))}
            </div>
          ) : null}
        </div>
 
        <div className="footer-links">
          <h2>{formatMenuTitle(quickLinksMenu)}</h2>
 
          {quickLinks.length > 0 ? (
            <nav aria-label={formatMenuTitle(quickLinksMenu)}>
              <ul className="footer-menu">
                {renderMenuItems(quickLinks)}
              </ul>
            </nav>
          ) : (
            <p className="footer-empty-menu">
              No footer links have been added.
            </p>
          )}
        </div>
      </div>
 
      <div className="copyright">{copyrightText}</div>
    </footer>
  );
}
 