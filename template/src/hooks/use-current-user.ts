"use client";

import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/src/lib/auth";

export type CurrentUser = {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  tenantId?: string;
  createdAt?: string;
};

export function useCurrentUser() {
  const query = useQuery<CurrentUser | null>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const res = await authApi.me();
        return res.data?.user ?? null;
      } catch (error: any) {
        if (error?.response?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  return {
    user: query.data,
    loading: query.isLoading,
    // error: query.error,
    refresh: query.refetch,

    // Optional: expose original query if needed
    ...query,
  };
}
