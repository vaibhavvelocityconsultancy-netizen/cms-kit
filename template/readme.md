"use client";

import { useEffect } from "react";
import Link from "next/link";

function hexToRgba(hex: string, alpha: number) {
  const clean = hex?.replace("#", "") || "ffffff";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function scopeCss(raw: string, scopeSelector = "#site-footer") {
  if (!raw) return "";
  return raw.replace(/([^{}]+)\{/g, (_match, selector) => {
    const scoped = selector.split(",").map((s: string) => `${scopeSelector} ${s.trim()}`).join(", ");
    return `${scoped} {`;
  });
}

function buildFooterTree(items: any[]): any[] {
  const map = new Map<number, any>();
  items.forEach((item) => map.set(item.id, { ...item, children: [] }));
  const roots: any[] = [];
  items.forEach((item) => {
    const node = map.get(item.id);
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export default function SiteFooter({ footer, footerMenus, config }: any) {
  const cfg = {
    bgColor: config?.bgColor ?? "#0B0F1A",
    borderColor: config?.borderColor ?? "#ffffff",
    borderOpacity: (config?.borderOpacity ?? 8) / 100,
    headingColor: config?.headingColor ?? "#ffffff",
    textColor: config?.textColor ?? "#cbd5e1",
    mutedTextColor: config?.mutedTextColor ?? "#94a3b8",
    bottomTextColor: config?.bottomTextColor ?? "#64748b",
    accentColor: config?.accentColor ?? "#22d3ee",
    accentHoverColor: config?.accentHoverColor ?? "#67e8f9",
    ctaTextColor: config?.ctaTextColor ?? "#0f172a",
    eyebrowText: config?.eyebrowText ?? "Let's Start a Conversation",
    headline: config?.headline ?? "Ready to grow your business?",
    showCta: config?.showCta ?? true,
    customCss: config?.customCss ?? "",
  };

  useEffect(() => {
    if (!cfg.customCss) return;
    const style = document.createElement("style");
    style.id = "footer-custom-css";
    style.textContent = scopeCss(cfg.customCss);
    document.head.appendChild(style);
    return () => { document.getElementById("footer-custom-css")?.remove(); };
  }, [cfg.customCss]);

  const borderStyle = { borderColor: hexToRgba(cfg.borderColor, cfg.borderOpacity) };

  const getMenuItems = (menu: any): any[] =>
    menu?.menuitem ?? menu?.menuitems ?? menu?.items ?? [];

  return (
    <footer
      id="site-footer"
      className="border-t"
      style={{ backgroundColor: cfg.bgColor, color: cfg.textColor, ...borderStyle }}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">

        {cfg.showCta && (
          <div className="mb-10 flex flex-col justify-between gap-6 border-b pb-8 lg:flex-row lg:items-center" style={borderStyle}>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide" style={{ color: cfg.accentHoverColor }}>
                {cfg.eyebrowText}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold md:text-4xl" style={{ color: cfg.headingColor }}>
                {cfg.headline}
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={`mailto:${footer.footerEmail}`}
                className="rounded-full px-5 py-3 text-sm font-bold transition-colors"
                style={{ backgroundColor: cfg.accentColor, color: cfg.ctaTextColor }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = cfg.accentHoverColor)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = cfg.accentColor)}
              >
                Email Us
              </a>
              {["WhatsApp", "LinkedIn", "Book Meeting"].map((label) => (
                <a
                  key={label}
                  href="#"
                  className="rounded-full border px-5 py-3 text-sm font-bold transition-colors hover:bg-white/5"
                  style={{ borderColor: hexToRgba(cfg.borderColor, cfg.borderOpacity * 1.25), color: cfg.textColor }}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-4">
          <div className="lg:col-span-2">
            {footer.footerLogo && (
              <img src={footer.footerLogo} alt={footer.footerBrandTitle} className="h-8 w-auto brightness-0 invert" />
            )}
            <p className="mt-5 max-w-md text-sm leading-6" style={{ color: cfg.mutedTextColor }}>
              {footer.footerDescription}
            </p>
            {footer.socialLinks?.length > 0 && (
              <div className="mt-6 flex gap-3">
                {footer.socialLinks.filter((l: any) => l.url).map((l: any, i: number) => (
                  <a
                    key={i}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors overflow-hidden"
                    style={{ borderColor: hexToRgba(cfg.borderColor, cfg.borderOpacity * 1.25), color: cfg.textColor }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = cfg.accentColor;
                      e.currentTarget.style.color = cfg.ctaTextColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = cfg.textColor;
                    }}
                  >
                    {l.icon
                      ? <img src={l.icon} alt={l.platform} className="h-4 w-4 object-contain brightness-0 invert" />
                      : <span className="text-xs font-bold">{l.platform?.charAt(0) || "S"}</span>}
                  </a>
                ))}
              </div>
            )}
          </div>

          {footerMenus.flatMap((menu: any) => {
            const items = getMenuItems(menu);
            const tree = buildFooterTree(items);

            return tree.map((item: any) => {
              const hasChildren = item.children?.length > 0;
              const href = item.type === "page" && item.slug ? `/${item.slug}` : item.url || "#";

              if (hasChildren) {
                return (
                  <div key={item.id}>
                    <h3 className="font-extrabold" style={{ color: cfg.headingColor }}>{item.label}</h3>
                    <ul className="mt-4 space-y-3 text-sm list-none p-0" style={{ color: cfg.mutedTextColor }}>
                      {item.children.map((child: any) => {
                        const childHref = child.type === "page" && child.slug ? `/${child.slug}` : child.url || "#";
                        return (
                          <li key={child.id}>
                            <Link
                              href={childHref}
                              className="transition-colors"
                              style={{ color: cfg.mutedTextColor }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = cfg.accentHoverColor)}
                              onMouseLeave={(e) => (e.currentTarget.style.color = cfg.mutedTextColor)}
                            >
                              {child.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              }

              return (
                <div key={item.id}>
                  <Link href={href} className="font-extrabold transition-colors" style={{ color: cfg.headingColor }}>
                    {item.label}
                  </Link>
                </div>
              );
            });
          })}

          {(footer.footerAddress || footer.footerEmail) && (
            <div>
              <h3 className="font-extrabold" style={{ color: cfg.headingColor }}>Contact</h3>
              <ul className="mt-4 space-y-3 text-sm list-none p-0" style={{ color: cfg.mutedTextColor }}>
                {footer.footerAddress && <li>{footer.footerAddress}</li>}
                {footer.footerEmail && (
                  <li>
                    <a href={`mailto:${footer.footerEmail}`} className="transition-colors" style={{ color: cfg.mutedTextColor }}>
                      {footer.footerEmail}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col justify-between gap-4 border-t pt-6 text-sm md:flex-row" style={{ ...borderStyle, color: cfg.bottomTextColor }}>
          <p>{footer.footerCopyright}</p>
          <div className="flex gap-5">
            <a href="#" className="transition-colors" style={{ color: cfg.bottomTextColor }}>Privacy Policy</a>
            <a href="#" className="transition-colors" style={{ color: cfg.bottomTextColor }}>Terms</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
