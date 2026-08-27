"use client";

import { useQuery } from "@tanstack/react-query";
import { AccessData } from "@/src/app/subscription/util";
import { getBaseUrl } from "@/src/lib/config";

/**
 * ═════════════════════════════════════════════════════════════════════
 * SINGLE SOURCE OF TRUTH FOR SUBSCRIPTION DATA
 * ═════════════════════════════════════════════════════════════════════
 *
 * Fetches subscription data once and caches it via React Query.
 * Used by SubscriptionLayout, dashboard pages, and subscription features.
 *
 * This ensures:
 * - Subscription data is fetched exactly once (cached by React Query)
 * - All components see the same subscription state
 * - Easy refetch when needed (e.g., after starting trial)
 */

export function useSubscription() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/subscription`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error(`Subscription fetch failed: ${res.status}`);
      }
      const json = await res.json();
      return (json?.data ?? null) as AccessData | null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  return {
    access: data ?? null,
    isLoading,
    error,
    refetch,
  };
}
