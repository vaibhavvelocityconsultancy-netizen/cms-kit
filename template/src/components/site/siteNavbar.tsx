"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query-key";
import { fetchers } from "@/src/lib/fetchers";
import { useCurrentUser } from "@/src/hooks/use-current-user";
import { appUrl } from "@/src/lib/base-path";
import { getBaseUrl } from "@/src/lib/config";

type SiteSettings = {
  logo?: string;
  siteName?: string;
};

type MenuItem = {
  id: string;
  label: string;
  type?: string;
  slug?: string;
  url?: string;
  parentId?: string | null;
  children?: MenuItem[];
};

type HeaderMenu = {
  menuitem?: MenuItem[];
  menuitems?: MenuItem[];
  items?: MenuItem[];
};

type SiteNavbarProps = {
  settings?: SiteSettings;
  headerMenu?: HeaderMenu;
    modules?: string[];

};

type SearchResult = {
  id: string;
  type: string;
  slug: string;
  title: string;
  excerpt?: string;
};

function getMenuItems(menu?: HeaderMenu): MenuItem[] {
  return menu?.menuitem ?? menu?.menuitems ?? menu?.items ?? [];
}

function buildMenuTree(items: MenuItem[]): MenuItem[] {
  const itemMap = new Map<string, MenuItem>();
  const rootItems: MenuItem[] = [];

  items.forEach((item) => {
    itemMap.set(item.id, {
      ...item,
      children: [],
    });
  });

  items.forEach((item) => {
    const currentItem = itemMap.get(item.id);

    if (!currentItem) {
      return;
    }

    if (item.parentId && itemMap.has(item.parentId)) {
      itemMap.get(item.parentId)?.children?.push(currentItem);
      return;
    }

    rootItems.push(currentItem);
  });

  return rootItems;
}

function getMenuItemHref(item: MenuItem): string {
  if (item.type === "page" && item.slug) {
    return `/${item.slug.replace(/^\/+/, "")}`;
  }

  return item.url || "#";
}

function isActivePage(pathname: string, href: string): boolean {
  if (!href || href === "#") {
    return false;
  }

  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function SiteNavbar({ settings, headerMenu, modules = [] }: SiteNavbarProps) {
  const pathname = usePathname();
  const { user } = useCurrentUser();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [openMobileSubmenus, setOpenMobileSubmenus] = useState<Set<string>>(
    new Set(),
  );

  const queryClient = useQueryClient();

  const prefetchPage = (item: MenuItem) => {
    if (item.type !== "page" || !item.slug) return;
    const slug = item.slug.replace(/^\/+/, "");

    queryClient.prefetchQuery({
      queryKey: queryKeys.page(slug),
      queryFn: () => fetchers.publicPageBySlug(slug),
      staleTime: 1000 * 60 * 5,
    });
  };

  const dashboardUrl =
    user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
      ? "/admin"
      : "/dashboard";

  const menuItems = useMemo(
    () => buildMenuTree(getMenuItems(headerMenu)),
    [headerMenu],
  );

const finalMenuItems = useMemo(() => {
  const items = [...menuItems];

  if (modules.includes("ecommerce")) {
    items.push(
      {
        id: "shop-static",
        label: "Shop",
        type: "custom",
        url: "/shop",
        children: [],
      },
      {
        id: "new-static",
        label: "New arrivals",
        type: "custom",
        url: "/categories/new-arrivals",
        children: [],
      },
    );
  }

  if (modules.includes("billing")) {
    items.push({
      id: "pricing-static",
      label: "Pricing",
      type: "custom",
      url: "/pricing",
      children: [],
    });
  }

  return items;
}, [menuItems, modules]);

  const logo = settings?.logo;
  const siteName = settings?.siteName || "Store";

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setOpenMobileSubmenus(new Set());
  }, [pathname]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const query = searchValue.trim();

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${getBaseUrl()}/api/search?q=${encodeURIComponent(query)}`,
        );
        const json = await res.json();
        setSearchResults(json.data ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const highlightMatch = (text: string, query: string): ReactNode => {
    if (!text || !query) return text;

    const parts = text.split(new RegExp(`(${escapeRegex(query)})`, "gi"));

    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          className="rounded-sm bg-[#1F6F54]/15 px-0.5 text-[#1F6F54]"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = searchValue.trim();

    if (!query) {
      return;
    }

    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
    window.location.assign(appUrl(`/search?q=${encodeURIComponent(query)}`));
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleMobileSubmenu = (itemId: string) => {
    setOpenMobileSubmenus((previousItems) => {
      const nextItems = new Set(previousItems);

      if (nextItems.has(itemId)) {
        nextItems.delete(itemId);
      } else {
        nextItems.add(itemId);
      }

      return nextItems;
    });
  };

  const renderDesktopMenuItems = (items: MenuItem[]): ReactNode =>
    items.map((item) => {
      const href = getMenuItemHref(item);
      const hasChildren = Boolean(item.children?.length);
      const active = isActivePage(pathname, href);

      return (
        <div key={item.id} className="group relative">
          <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-1 border-b-2 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-[#1F6F54] text-[#14181F]"
                : "border-transparent text-[#4B5563] hover:text-[#14181F]"
            }`}
          >
            {item.label}

            {hasChildren ? (
              <span className="text-xs opacity-60" aria-hidden="true">
                ▾
              </span>
            ) : null}
          </Link>

          {hasChildren ? (
            <div className="invisible absolute left-0 top-full z-50 mt-2 min-w-56 -translate-y-1 rounded-md border border-[#E5E7EB] bg-white py-2 opacity-0 shadow-sm transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {item.children?.map((child) => {
                const childHref = getMenuItemHref(child);
                const childActive = isActivePage(pathname, childHref);

                return (
                  <Link
                    key={child.id}
                    href={childHref}
                    aria-current={childActive ? "page" : undefined}
                    className={`block whitespace-nowrap px-4 py-2 text-sm ${
                      childActive
                        ? "bg-[#F3F4F6] text-[#14181F]"
                        : "text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#14181F]"
                    }`}
                    onMouseEnter={() => prefetchPage(child)}
                  >
                    {child.label}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      );
    });

  const renderMobileMenuItems = (items: MenuItem[]): ReactNode =>
    items.map((item) => {
      const href = getMenuItemHref(item);
      const hasChildren = Boolean(item.children?.length);
      const isOpen = openMobileSubmenus.has(item.id);
      const active = isActivePage(pathname, href);

      return (
        <div key={item.id} className="border-b border-[#F3F4F6] last:border-b-0">
          <div className="flex items-center">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              onMouseEnter={() => prefetchPage(item)}
              className={`flex flex-1 items-center gap-1 py-4 text-[15px] font-medium ${
                active ? "text-[#14181F]" : "text-[#374151]"
              }`}
            >
              {item.label}
              {hasChildren ? (
                <span className="text-xs opacity-60" aria-hidden="true">
                  ▾
                </span>
              ) : null}
            </Link>

            {hasChildren ? (
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center text-[#4B5563]"
                aria-label={`${isOpen ? "Close" : "Open"} ${item.label} submenu`}
                aria-expanded={isOpen}
                onClick={() => toggleMobileSubmenu(item.id)}
              >
                <svg
                  className={`h-4 w-4 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m19 9-7 7-7-7"
                  />
                </svg>
              </button>
            ) : null}
          </div>

          {hasChildren && isOpen ? (
            <div className="border-t border-[#F3F4F6] bg-[#FAFAFA] pl-4">
              {renderMobileMenuItems(item.children || [])}
            </div>
          ) : null}
        </div>
      );
    });

  return (
    <>
      <header
        id="site-navbar"
        className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative flex h-16 items-center justify-between gap-6">
            <Link
              href="/"
              className="shrink-0"
              aria-label={`${siteName} home`}
            >
              {logo ? (
                <img src={logo} alt={siteName} width="140" height="32" className="h-8 w-auto object-contain" />
              ) : (
                <span className="text-lg font-semibold tracking-tight text-[#14181F]">
                  {siteName}
                </span>
              )}
            </Link>

            <nav
              className="hidden flex-1 items-center gap-8 lg:flex"
              aria-label="Primary navigation"
            >
              {finalMenuItems.length > 0 ? (
                renderDesktopMenuItems(finalMenuItems)
              ) : (
                <p className="text-sm text-[#6B7280]">
                  No items have been added to the selected header menu.
                </p>
              )}
            </nav>

            <div className="flex shrink-0 items-center gap-4">
              {!user ? (
                <>
                  <Link
                    className="hidden text-sm font-medium text-[#4B5563] hover:text-[#14181F] sm:inline-block"
                    href="/login"
                  >
                    Log In
                  </Link>

                  <Link
                    className="hidden rounded-full bg-[#1F6F54] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#195C46] sm:inline-block"
                    href="/register"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <Link
                  className="hidden rounded-full bg-[#1F6F54] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#195C46] sm:inline-block"
                  href={dashboardUrl}
                >
                  Dashboard
                </Link>
              )}

              <span
                className="hidden h-5 w-px bg-[#E5E7EB] sm:block"
                aria-hidden="true"
              />

              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#4B5563] transition-colors hover:bg-[#F3F4F6] hover:text-[#14181F]"
                aria-label="Open search"
                aria-expanded={isSearchOpen}
                onClick={() => setIsSearchOpen((current) => !current)}
              >
                <svg
                  className="h-[18px] w-[18px]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m21 21-4.34-4.34M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
                  />
                </svg>
              </button>
            </div>

            <button
              type="button"
              className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 lg:hidden"
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="h-0.5 w-5 rounded-full bg-[#14181F]" />
              <span className="h-0.5 w-5 rounded-full bg-[#14181F]" />
              <span className="h-0.5 w-5 rounded-full bg-[#14181F]" />
            </button>

            {isSearchOpen ? (
              <div className="absolute right-0 top-[calc(100%+12px)] z-[70] hidden w-[360px] md:block">
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm"
                >
                  <label className="sr-only" htmlFor="desktop-site-search">
                    Search
                  </label>

                  <input
                    id="desktop-site-search"
                    type="search"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Search..."
                    className="min-w-0 flex-1 px-4 py-3 text-sm text-[#14181F] outline-none placeholder:text-[#9CA3AF]"
                    autoFocus
                  />
                </form>

                {searchValue.trim().length >= 2 && (
                  <div className="mt-1 max-h-80 overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
                    {isSearching && (
                      <div className="p-3 text-sm text-[#6B7280]">
                        Searching...
                      </div>
                    )}

                    {!isSearching && searchResults.length === 0 && (
                      <div className="p-3 text-sm text-[#6B7280]">
                        No results found
                      </div>
                    )}

                    {!isSearching &&
                      searchResults.map((result: SearchResult) => (
                        <Link
                          key={`${result.type}-${result.id}`}
                          href={
                            result.type === "post"
                              ? `/posts/${result.slug}`
                              : `/${result.slug}`
                          }
                          className="block border-b border-[#F3F4F6] p-3 last:border-0 hover:bg-[#FAFAFA]"
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchValue("");
                          }}
                        >
                          <span className="text-xs uppercase tracking-wide text-[#9CA3AF]">
                            {result.type}
                          </span>
                          <div className="text-sm font-medium text-[#14181F]">
                            {highlightMatch(result.title, searchValue.trim())}
                          </div>
                          {result.excerpt && (
                            <div className="mt-1 text-xs text-[#6B7280]">
                              {highlightMatch(result.excerpt, searchValue.trim())}
                            </div>
                          )}
                        </Link>
                      ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-[90] bg-black/40 transition-opacity duration-300 lg:hidden ${
          isMobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onClick={closeMobileMenu}
      />

      {/* Mobile navigation */}
      <aside
        id="mobile-navigation"
        className={`fixed inset-y-0 left-0 z-[100] flex w-[86%] max-w-[360px] flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!isMobileMenuOpen}
        inert={!isMobileMenuOpen}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#E5E7EB] px-6">
          <Link
            href="/"
            className="block max-w-[160px]"
            aria-label={`${siteName} home`}
            onClick={closeMobileMenu}
          >
            {logo ? (
              <img
                src={logo}
                alt={siteName}
                width="140"
                height="32"
                className="h-7 w-auto object-contain"
              />
            ) : (
              <span className="text-lg font-semibold tracking-tight text-[#14181F]">
                {siteName}
              </span>
            )}
          </Link>

          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center text-[#4B5563] hover:text-[#14181F]"
            aria-label="Close navigation menu"
            onClick={closeMobileMenu}
          >
            <span className="absolute h-0.5 w-5 rotate-45 bg-current" />
            <span className="absolute h-0.5 w-5 -rotate-45 bg-current" />
          </button>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-6 py-1"
          aria-label="Mobile navigation"
        >
          {finalMenuItems.length > 0 ? (
            renderMobileMenuItems(finalMenuItems)
          ) : (
            <p className="py-6 text-sm text-[#6B7280]">
              No items have been added to the selected header menu.
            </p>
          )}
        </nav>

        <div className="border-t border-[#E5E7EB] px-6 py-5">
          {!user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-[#4B5563] hover:text-[#14181F]"
                onClick={closeMobileMenu}
              >
                Log In
              </Link>

              <Link
                href="/register"
                className="rounded-full bg-[#1F6F54] px-4 py-2 text-sm font-medium text-white hover:bg-[#195C46]"
                onClick={closeMobileMenu}
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <Link
              href={dashboardUrl}
              className="inline-block rounded-full bg-[#1F6F54] px-4 py-2 text-sm font-medium text-white hover:bg-[#195C46]"
              onClick={closeMobileMenu}
            >
              Dashboard
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}