import { BookOpen, Home, LogOut, Plane, Receipt, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { AccessData } from "@/src/app/subscription/util";
import { getBaseUrl } from "@/src/lib/config";

/**
 * ═════════════════════════════════════════════════════════════════════
 * SUBSCRIBER SIDEBAR
 * ═════════════════════════════════════════════════════════════════════
 *
 * Navigation sidebar for authenticated subscribers.
 * Receives subscription data from parent layout.
 *
 * Props:
 * - access: Current subscription data (required)
 * - isMobileOpen: Mobile menu visibility state
 * - setIsMobileOpen: Toggle mobile menu
 * - isCollapsed: Sidebar collapse state (desktop)
 * - setIsCollapsed: Toggle sidebar collapse
 */

interface SubscriberSidebarProps {
  access: AccessData | null;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export function SubscriberSidebar({
  access,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
}: SubscriberSidebarProps) {
  // Check if user has active subscription or valid trial period
  const now = new Date();
  const trialValid =
    access?.status === "TRIAL" &&
    access?.trialEndsAt &&
    new Date(access.trialEndsAt) > now;

  const hasSubscription = access?.status === "ACTIVE" || trialValid;
  // const pathname = usePathname();
  const sidebarItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Home,
    },
    {
      href: "/subscription/file-sharing",
      label: "File Sharing System",
      icon: BookOpen,
    },
    {
      href: "/subscription/plans",
      label: "My Plans",
      icon: Plane,
    },
    {
      href: "/subscription/billing",
      label: "Billing",
      icon: Receipt,
    },
    {
      href: "/subscription/profile",
      label: "Profile",
      icon: User,
    },
  ];
  const router = useRouter();

  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch(`${getBaseUrl()}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
    fixed
    top-16
    bottom-0
    left-0
    bg-indigo-50
    border-r
    border-indigo-100
    z-40
    transition-all duration-300
    ${isCollapsed ? "w-20" : "w-60"}
    lg:translate-x-0
    ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
  `}
      >
        <div className="flex flex-col justify-between h-full p-4">
          {/* Close + collapse controls */}
          <div className="flex items-center justify-between mb-6">
            <span
              className={`text-lg font-bold text-indigo-900 transition-opacity duration-200 ${
                isCollapsed ? "opacity-0 lg:opacity-100" : "opacity-100"
              }`}
            >
              Menu
            </span>

            <div className="flex items-center gap-2">
              <button
                className="hidden lg:inline-flex items-center justify-center rounded-full border border-indigo-200 bg-white p-2 text-indigo-900 hover:bg-indigo-100 transition"
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path
                    d={isCollapsed ? "M6 4l10 8-10 8" : "M18 4l-10 8 10 8"}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <button
                className="lg:hidden"
                onClick={() => setIsMobileOpen(false)}
              >
                <X size={22} className="text-indigo-900" />
              </button>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <button
                  key={item.href}
                  onClick={() => {
                    if (
                      item.href === "/subscription/file-sharing" &&
                      !hasSubscription
                    ) {
                      alert("Please subscribe to access File Sharing.");
                      return;
                    }

                    router.push(item.href);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 ${
                    isCollapsed ? "justify-center" : "px-4"
                  } py-3 rounded-xl font-medium transition-all text-sm ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-indigo-900 hover:bg-indigo-100"
                  }`}
                >
                  <Icon size={20} />
                  <span className={`${isCollapsed ? "hidden" : "block"}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
          {/* User at bottom */}
          <div className="mt-auto pt-4 border-t border-indigo-200">
            <div
              className={`flex items-center gap-3 p-3 bg-indigo-100 rounded-xl ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                <User size={16} />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-indigo-600 truncate">Subscriber</p>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="rounded-lg text-sidebar-foreground/40 transition-all duration-200 hover:bg-red-500/10 hover:text-red-500 p-2"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
