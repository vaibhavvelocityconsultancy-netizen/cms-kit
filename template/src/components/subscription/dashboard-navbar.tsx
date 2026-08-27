"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/src/lib/auth";
import { fetchers } from "@/src/lib/fetchers";
import { queryKeys } from "@/src/lib/query-key";

export default function SiteNavbar({ settings, user, onToggleSidebar }: any) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const prefetchPage = (href: string, type: string, slug: string) => {
    if (type === "page" && slug) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.page(slug),
        queryFn: () => fetchers.publicPageBySlug(slug),
        staleTime: 0,
      });
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      queryClient.clear();
      setIsUserDropdownOpen(false);
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#f6f7fb]/95 backdrop-blur border-b border-black/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {settings?.logo ? (
            <img
              src={settings.logo}
              alt={settings.siteName}
              className="h-8 w-auto"
            />
          ) : (
            <span className="text-xl font-bold">{settings?.siteName}</span>
          )}
        </Link>

        {/* User Dropdown + Sidebar Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white p-2 text-[#111827] hover:bg-gray-100 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="relative">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 rounded-full border border-black/10 px-3 py-2 hover:bg-white transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-[#111827] flex items-center justify-center text-white text-sm font-semibold">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
              <span className="text-sm font-medium text-[#111827] hidden sm:block">
                {user?.name || user?.email || "User"}
              </span>
              <svg
                className={`w-4 h-4 text-[#111827] transition-transform duration-200 ${
                  isUserDropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isUserDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-[#111827]">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email || ""}
                    </p>
                  </div>
                  <Link
                    href="/subscription/profile"
                    className="block px-4 py-2 text-sm text-[#111827] hover:bg-gray-50"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    Profile
                  </Link>

                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
