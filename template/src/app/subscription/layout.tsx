"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SubscriberSidebar } from "@/src/components/subscription/sidebar";
import SiteNavbar from "@/src/components/subscription/dashboard-navbar";
import { fetchers } from "@/src/lib/fetchers";
import { queryKeys } from "@/src/lib/query-key";
import { useQueries } from "@tanstack/react-query";
import { useCurrentUser } from "@/src/hooks/use-current-user";
import { useSubscription } from "@/src/hooks/use-subscription";

/**
 * ═════════════════════════════════════════════════════════════════════
 * SUBSCRIPTION LAYOUT
 * ═════════════════════════════════════════════════════════════════════
 *
 * Single parent layout for all /subscription/* routes.
 * - Runs auth + role check ONCE for every child page
 * - Fetches subscription data ONCE (cached) and passes to sidebar
 * - Renders navbar + sidebar + padded main content area
 *
 * Any page.tsx under app/subscription/** automatically gets wrapped
 * by this layout. Pages should NOT repeat auth checks, sidebar, or
 * navbar — just return their own content.
 */

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // ── Auth + role check (runs once for all child pages) ──
  const { user, isLoading, isFetching } = useCurrentUser();
  const isAuthCheckPending = isLoading || isFetching;

  useEffect(() => {
    if (isAuthCheckPending) return;

    if (!user) {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      router.replace("/admin");
      return;
    }

    if (user.role !== "SUBSCRIBER") {
      router.replace("/login");
    }
  }, [user, isAuthCheckPending, router]);

  // ── Fetch subscription data once (cached by React Query) ──
  const { access, isLoading: subscriptionLoading } = useSubscription();

  const [
    { data: bootstrapData, isLoading: bootstrapLoading },
    { data: cssData, isLoading: cssLoading },
    { data: postsData, isLoading: postsLoading },
  ] = useQueries({
    queries: [
      {
        queryKey: ["public", "bootstrap"],
        queryFn: fetchers.publicBootstrap,
        staleTime: 60_000,
      },
      {
        queryKey: queryKeys.globalCss,
        queryFn: fetchers.globalCss,
        staleTime: Infinity,
      },
      {
        queryKey: queryKeys.posts,
        queryFn: fetchers.publicPosts,
        staleTime: 60_000,
      },
    ],
  });

  // ── Derived content ──
  const settings = useMemo(
    () => bootstrapData?.data?.settings,
    [bootstrapData],
  );

  const allMenus = useMemo(
    () => bootstrapData?.data?.menus ?? [],
    [bootstrapData],
  );

  const headerMenu = useMemo(
    () => allMenus.find((m: any) => m.location === "header"),
    [allMenus],
  );

  // ── Block render until auth check resolves ──
  if (isAuthCheckPending || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <SiteNavbar
        settings={settings}
        onToggleSidebar={() => setIsMobileOpen((value) => !value)}
      />

      <div className="flex h-[calc(100vh-64px)]">
        <SubscriberSidebar
          access={access}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        <main
          className={`flex-1 overflow-y-auto transition-all duration-300 ${
            isSidebarCollapsed ? "lg:pl-20" : "lg:pl-60"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}