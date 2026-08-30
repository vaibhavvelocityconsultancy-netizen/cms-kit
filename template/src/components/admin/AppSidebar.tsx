"use client";

import {
  ChevronDown,
  Code,
  CreditCard,
  ExternalLink,
  FileText,
  FolderOpen,
  Globe,
  Map,
  Hash,
  Layout,
  LayoutDashboard,  
  LogOut,
  Menu,
  Newspaper,
  PanelBottom,
  Settings,
  Sparkles,
  User,
  type LucideIcon,
  Form,
  BookOpen,
  HelpCircle,
  Search,
  ArrowRight,
  Route,
  Bot,
  FileSearch,
  ChartNoAxesCombined,
  Link2,
  MapPin,
  ShoppingBag,
  Package,
  Tag as TagIcon,
  LayoutList,
  Truck,
  Percent,
  Receipt,
  Users,
  SlidersHorizontal,
  BarChart3,
  Mail,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { authApi } from "@/src/lib/auth";
import { getApiBaseUrl } from "@/src/lib/axios";
import { getBaseUrl } from "@/src/lib/config";
import { useModuleFlags } from "@/src/lib/ecom/useModuleFlags";
import { useInstalledModules } from "@/src/lib/useInstalledModules";
import {
  Sidebar as UISidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/src/ui/sidebar";
import { appUrl } from "@/src/lib/base-path";

const apiPath = (path: string) => `${getBaseUrl()}${path}`;

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  href?: string;
  children?: NavItem[];
  modulePermission?: string;
  module?: string;
  badge?: number;
}

interface SidebarProps {
  userRole?: string | null;
}

// ── Admin nav ─────────────────────────────────────────────────
const adminNavItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview & analytics",
    href: "/admin",
  },
  {
    id: "posts",
    label: "Posts",
    icon: Newspaper,
    description: "Manage blog posts",
    modulePermission: "posts_view",
    children: [
      {
        id: "all-posts",
        label: "All Posts",
        icon: FileText,
        description: "View all posts",
        href: "/admin/posts",
      },
      {
        id: "comments",
        label: "Comments",
        icon: FileText,
        description: "View all comments",
        href: "/admin/comments",
      },
      {
        id: "categories",
        label: "Categories",
        icon: FolderOpen,
        description: "Manage categories",
        href: "/admin/categories",
      },
      {
        id: "tags",
        label: "Tags",
        icon: Hash,
        description: "Manage tags",
        href: "/admin/tags",
      },
    ],
  },
  {
    id: "pages",
    label: "Pages",
    icon: Globe,
    description: "Manage content",
    modulePermission: "pages_view",
    href: "/admin/pages",
  },
  {
    id: "media",
    label: "Media Library",
    icon: FileText,
    description: "Manage Media Library",
    modulePermission: "media_upload",
    module: "media",
    children: [
      {
        id: "all-media",
        label: "Media Library",
        icon: FileText,
        description: "View all media",
        href: "/admin/media",
      },
      // {
      //   id: "navbar-config",
      //   label: "Navbar Config",
      //   icon: FileText,
      //   description: "configure navbar",
      //   href: "/admin/customize/navbar-config",
      // },
    ],
  },
  {
    id: "menus",
    label: "Menus",
    icon: Menu,
    description: "Navigation structure",
    modulePermission: "menus_manage", 
    module: "menus",
    href: "/admin/menus",
  },

  {
    id: "forms",
    label: "Forms",
    icon: Form,
    description: "Manage forms",
    // modulePermission: "forms_access",
    module: "forms",
    href: "/admin/forms",
  },  

  {
    id: "customize",
    label: "Customize",
    icon: Layout,
    description: "Theme & appearance",
    modulePermission: "global_css_manage",
    children: [
      {
        id: "global-css",
        label: "Global CSS",
        icon: Code,
        description: "Styling & themes",
        href: "/admin/setting/global-css",
      },
    ],
  },

  {
    id: "plan-management",
    label: "Plan Management",
    icon: ShoppingBag,
    description: "Manage plans and subscriptions",
    module: "billing",
    // modulePermission: "plans_manage",
    href: "/admin/plan-management",
  },

  {
    id: "files-manager",
    label: "User Management",
    icon: Share2,
    description: "Subscriber-info & uploaded files",
    modulePermission: "subscriber_upload_files_info",
    href: "/admin/files",
  },
  {
    id: "files-category-manager",
    label: "File Categories",
    icon: FolderOpen,
    description: "Manage file categories",
    modulePermission: "subscriber_upload_files_info",
    href: "/admin/files-category",
  },
  {
    id: "ecommerce",
    label: "E-commerce",
    icon: ShoppingBag,
    module: "ecommerce",
    children: [
      {
        id: "products",
        label: "Products",
        icon: ShoppingBag,
        description: "Manage products",
        href: "/admin/ecommerce/products",
      },
      {
        id: "orders",
        label: "Orders",
        icon: ShoppingBag,
        description: "Manage orders",
        href: "/admin/ecommerce/orders",

      },
      {
        id: "coupons",
        label: "Coupons",
        icon: ShoppingBag,
        description: "Manage coupons",
        href: "/admin/ecommerce/coupons",
      },
      {
        id: "shipping",
        label: "Shipping",
        icon: Truck,
        description: "Manage shipping",
        href: "/admin/ecommerce/shipping",
      },
      {
        id: "taxes",
        label: "Taxes",
        icon: Percent,
        description: "Manage taxes",
        href: "/admin/ecommerce/taxes",
      },
      {
        id: "payment-gateways",
        label: "Payment Gateways",
        icon: CreditCard,
        description: "Manage payment gateways",
        href: "/admin/ecommerce/payment-gateways",
      },

    ]
  },

  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    description: "System configuration",
    modulePermission: "settings_manage",
    children: [
      {
        id: "settings",
        label: "General Settings",
        icon: Layout,
        description: "Site configuration",
        href: "/admin/settings",
      },
      {
        id: "react-page-settings",
        label: "React Page Settings",
        icon: Layout,
        description: "React page configuration",
        href: "/admin/component-settings",
      },
      {
        id: "footer-settings",
        label: "Footer Settings",
        icon: PanelBottom,
        description: "Footer content",
        href: "/admin/footer-settings",
      },
    ],
  },
  {
    id: "seo-settings",
    label: "SEO Settings",
    icon: Search,
    description: "SEO tools & optimization",
    module: "seo",
    children: [
      {
        id: "analytics-settings",
        label: "Analytics Settings",
        icon: ChartNoAxesCombined,
        description: "Manage analytics settings",
        href: "/admin/seo/analytics",
      },
      {
        id: "seo",
        label: "Robots.txt",
        icon: Bot,
        description: "Manage robots.txt",
        href: "/admin/seo/robots",
      },
      {
        id: "redirects",
        label: "Redirect Manager",
        icon: Route,
        description: "Manage redirects",
        href: "/admin/seo/redirects",
      },
      {
        id: "internal-linking",
        label: "Internal Linking",
        icon: Link2,
        description: "Manage internal links",
        href: "/admin/seo/internal-linking",
      },
      {
        id: "breadcrumbs",
        label: "Breadcrumbs",
        icon: MapPin,
        description: "Manage breadcrumb navigation",
        href: "/admin/seo/breadcrumbs",
      },
      {
        id: "sitemap",
        label: "Sitemap",
        icon: Map,
        description: "Manage sitemap",
        href: "/admin/seo/sitemap",
      },
      {
        id: "bulk-seo",
        label: "Bulk SEO Editor",
        icon: FileSearch,
        description: "Manage SEO for multiple pages",
        href: "/admin/seo/bulk-seo",
      },
      {
        id: "llms.txt",
        label: "llms.txt",
        icon: Code,
        description: "Manage llms.txt",
        href: "/admin/seo/llms-txt",
      },
    ],
  },
];

function getActiveParentMenuId(pathname: string) {
  return adminNavItems.find((item) =>
    item.children?.some((child) => {
      if (!child.href) return false;
      return pathname === child.href || pathname.startsWith(child.href + "/");
    }),
  )?.id;
}

export function Sidebar({ userRole }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const installedModules = useInstalledModules();
  const collapsed = state === "collapsed" && !isMobile;
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [visibleModules, setVisibleModules] = useState<Record<string, boolean>>(
    {},
  );
  const [unreadSubmissions, setUnreadSubmissions] = useState(0);
  const [userEmail, setUserEmail] = useState("Loading...");
  const [userName, setUserName] = useState("User");
  const [resolvedUserRole, setResolvedUserRole] = useState<string | null>(
    userRole ?? null,
  );

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch(apiPath("/api/form/unread-count"));
        const data = await res.json();
        setUnreadSubmissions(data.data?.count || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchModuleVisibility = async () => {
      try {
        const { data: meData } = await authApi.me();
        if (!meData.success) return;

        const user = meData.user;
        setUserEmail(user?.email || "user@example.com");
        setUserName(user?.name || "User");
        setResolvedUserRole(user?.role || null);

        const currentRole = user?.role;
        if (currentRole === "SUBSCRIBER") return;

        const { data } = await authApi.permissions();
        if (data.data) {
          const modules: Record<string, boolean> = {};
          if (currentRole === "SUPER_ADMIN" || currentRole === "ADMIN") {
            data.data.forEach((perm: any) => {
              modules[perm.name] = true;
            });
          } else {
            data.data.forEach((perm: any) => {
              modules[perm.name] = perm.roles?.some(
                (r: any) => r.role === currentRole,
              );
            });
          }
          setVisibleModules(modules);
        }
      } catch (err) {
        console.error("Failed to fetch module visibility:", err);
      }
    };
    fetchModuleVisibility();
  }, []);

  const activeParentMenuId = getActiveParentMenuId(pathname);
  const effectiveExpandedMenus = useMemo(() => {
    if (!activeParentMenuId || expandedMenus.includes(activeParentMenuId)) {
      return expandedMenus;
    }
    return [...expandedMenus, activeParentMenuId];
  }, [activeParentMenuId, expandedMenus]);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .hide-scrollbar::-webkit-scrollbar { display: none; }`;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const isSubscriber = resolvedUserRole === "SUBSCRIBER";
  const baseNavItems = adminNavItems;
  const moduleFlags = useModuleFlags();

  const navItemsWithBadge = useMemo(() => {
    return baseNavItems.map((item) =>
      item.id === "forms" ? { ...item, badge: unreadSubmissions } : item,
    );
  }, [unreadSubmissions]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId],
    );
  };

  const handleLogout = async () => {
    try {
      await fetch(apiPath("/api/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

const shouldRenderItem = (item: NavItem) => {
  if (item.module && installedModules && !installedModules.includes(item.module)) {
    return false;
  }
  if (isSubscriber) return true;  
  if (item.modulePermission)
    return visibleModules[item.modulePermission] === true;
  return true;
};

  const isItemActive = (item: NavItem): boolean => {
    if (!item.href) return false;
    if (item.href === "/admin") return pathname === "/admin";
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    if (!shouldRenderItem(item)) return null;

    const Icon = item.icon;
    const isActive = isItemActive(item);
    const hasChildren = Boolean(item.children?.length);
    const isExpanded = effectiveExpandedMenus.includes(item.id);

    if (depth > 0) {
      return (
        <SidebarMenuSubItem key={item.id}>
          <SidebarMenuSubButton
            className="h-auto min-h-11 rounded-xl py-2.5"

            isActive={isActive}
            asChild={!!item.href}
          >
            {item.href ? (
              <Link
                href={item.href}
                prefetch={true}
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                }}
                className="flex items-center gap-2"
              >
                <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className="flex items-center gap-2">
                <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                <span>{item.label}</span>
              </span>
            )}
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      );
    }

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          tooltip={item.label}
          isActive={isActive && !hasChildren}
          asChild={!!item.href && !hasChildren}
          onClick={() => {
            if (hasChildren && !collapsed) toggleMenu(item.id);
            else if (item.href) {
              router.push(item.href);
              if (isMobile) setOpenMobile(false);
            }
          }}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
          className="h-auto min-h-11 rounded-xl py-2.5"
        >
          {item.href && !hasChildren ? (
            <Link href={item.href} prefetch={true}>
              <Icon
                size={20}
                strokeWidth={isActive ? 2 : 1.5}
                className="transition-transform group-hover:scale-110"
              />
              <span className="flex-1 overflow-hidden text-left">
                <span className="block truncate text-sm font-medium">
                  {item.label}
                </span>
                {item.description && (
                  <span className="block truncate text-[11px] text-sidebar-foreground/45">
                    {item.description}
                  </span>
                )}
              </span>
            </Link>
          ) : (
            <>
              <Icon
                size={20}
                strokeWidth={isActive ? 2 : 1.5}
                className="transition-transform group-hover:scale-110"
              />
              <span className="flex-1 overflow-hidden text-left">
                <span className="block truncate text-sm font-medium">
                  {item.label}
                </span>
                {item.description && (
                  <span className="block truncate text-[11px] text-sidebar-foreground/45">
                    {item.description}
                  </span>
                )}
              </span>
              {!collapsed && hasChildren && (
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                />
              )}
            </>
          )}
        </SidebarMenuButton>

        {item.badge && item.badge > 0 ? (
          <SidebarMenuBadge className="bg-red-500 text-white">
            {item.badge > 99 ? "99+" : item.badge}
          </SidebarMenuBadge>
        ) : null}

        {!collapsed && hasChildren && isExpanded && (
          <SidebarMenuSub>
            {item.children?.map((child) => renderNavItem(child, depth + 1))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    );
  };

  return (
    <UISidebar
      collapsible="icon"
      className="bg-linear-to-b from-sidebar to-sidebar/95 bg-sidebar"
    >
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border/50 bg-gradient-to-r from-sidebar/50 to-transparent px-4">
        <div className="flex w-full items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-sidebar-primary to-sidebar-primary/60 shadow-lg">
            <Sparkles size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <span className="block bg-gradient-to-r from-sidebar-foreground to-sidebar-foreground/80 bg-clip-text font-sans text-xl font-bold text-transparent">
                {isSubscriber ? "My Dashboard" : "IPDAV"}
              </span>
              <span className="block text-[10px] text-sidebar-foreground/40 font-mono">
                {isSubscriber ? resolvedUserRole : "v2.0.0"}
              </span>
            </div>
          )}
          <SidebarTrigger className="ml-auto shrink-0" />
        </div>
      </SidebarHeader>

      <SidebarContent className="hide-scrollbar px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItemsWithBadge.map((item) => renderNavItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 bg-linear-to-b from-transparent to-sidebar/95 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Visit Site"
              className="h-auto rounded-xl py-2"
            >
              <a href={appUrl('/')} target="_blank" rel="noreferrer">
                <ExternalLink size={18} strokeWidth={1.5} />
                <span className="flex-1 overflow-hidden text-left">
                  <span className="block truncate text-sm font-medium">
                    Visit Site
                  </span>
                  <span className="block truncate text-[11px] text-sidebar-foreground/45">
                    View public site
                  </span>
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="group relative flex items-center gap-3 rounded-xl p-2 transition-all duration-200 hover:bg-sidebar-accent/30 group-data-[collapsible=icon]:justify-center">
          <div className="relative shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-sidebar-primary/30 to-sidebar-primary/10 ring-2 ring-sidebar-primary/20 transition-all group-hover:ring-sidebar-primary/40">
              <User size={18} className="text-sidebar-primary" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-sidebar" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                {userName}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/50">
                {userEmail}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`rounded-lg text-sidebar-foreground/40 transition-all duration-200 hover:bg-red-500/10 hover:text-red-500 ${
              collapsed ? "absolute -right-1 -top-1 bg-sidebar p-1" : "p-1.5"
            }`}
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </UISidebar>
  );
}
