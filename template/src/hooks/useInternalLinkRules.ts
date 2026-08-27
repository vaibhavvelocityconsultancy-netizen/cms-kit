import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/src/lib/axios";

interface PhraseMatch {
  phrase: string;
  snippet: string;
  position: number;
}

interface SuggestionWithPhrases {
  keyword: string;
  destinationType: "page" | "post";
  destinationId: string;
  destTitle: string;
  resolvedUrl: string;
  relevanceScore: number;
  phrases: PhraseMatch[];
  linked?: boolean;
}

interface Suggestion {
  keyword: string;
  destinationType: "page" | "post";
  destinationId: string;
  resolvedUrl: string;
  linked?: boolean;
}

interface ContentRow {
  id: number | string;
  title: string;
  slug: string;
  published: boolean;
  updatedAt: string;
  type: "page" | "post";
}

const apiPath = (path: string) => `${getApiBaseUrl()}${path}`;

// Fetch linkable content (pages and posts) for the initial list
export function useLinkableContent() {
  return useQuery({
    queryKey: ["linkable-content"],
    queryFn: async () => {
      const res = await fetch(
        apiPath("/api/seo/internal-links/linkable-content"),
      );
      if (!res.ok) throw new Error("Failed to fetch linkable content");
      return res.json() as Promise<ContentRow[]>;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch suggestions WITH phrase snippets (new Rank Math-style)
export function useSuggestInternalLinksWithPhrases(
  sourceType?: "page" | "post",
  sourceId?: string | number,
  sourceTitle?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [
      "internal-links",
      "suggestions-with-phrases",
      sourceType,
      sourceId,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        sourceType: sourceType || "",
        sourceId: String(sourceId || ""),
        sourceTitle: sourceTitle || "",
      });

      const res = await fetch(
        apiPath(`/api/seo/internal-links/suggestions-with-phrases?${params}`),
      );
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      return res.json() as Promise<SuggestionWithPhrases[]>;
    },
    enabled: options?.enabled ?? false,
    staleTime: 0, // Always fresh
  });
}

// Fetch basic suggestions (backward compatible)
export function useSuggestInternalLinks(
  sourceType?: "page" | "post",
  sourceId?: string | number,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["internal-links", "suggestions", sourceType, sourceId],
    queryFn: async () => {
      const params = new URLSearchParams({
        sourceType: sourceType || "",
        sourceId: String(sourceId || ""),
      });

      const res = await fetch(
        apiPath(`/api/seo/internal-links/suggestions?${params}`),
      );
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      return res.json() as Promise<Suggestion[]>;
    },
    enabled: options?.enabled ?? false,
    staleTime: 0,
  });
}

// Fetch rules list
export function useInternalLinkRules() {
  return useQuery({
    queryKey: ["internal-link-rules"],
    queryFn: async () => {
      const res = await fetch(apiPath("/api/seo/internal-links/rules"));
      if (!res.ok) throw new Error("Failed to fetch rules");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Create a new rule
export function useCreateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      keyword: string;
      destinationType: string;
      destinationId?: string;
      destinationUrl?: string;
    }) => {
      const res = await fetch(apiPath("/api/seo/internal-links/rules"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create rule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-link-rules"] });
      queryClient.invalidateQueries({
        queryKey: ["internal-links", "suggestions-with-phrases"],
      });
      queryClient.invalidateQueries({
        queryKey: ["internal-links", "suggestions"],
      });
    },
  });
}

// Update a rule
export function useUpdateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: number;
      input: Record<string, any>;
    }) => {
      const res = await fetch(`/api/seo/internal-links/rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to update rule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-link-rules"] });
    },
  });
}

// Delete a rule
export function useDeleteRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(apiPath(`/api/seo/internal-links/rules/${id}`), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete rule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-link-rules"] });
    },
  });
}

// Toggle a rule's enabled state
export function useToggleRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(
        apiPath(`/api/seo/internal-links/rules/${id}/toggle`),
        {
          method: "POST",
        },
      );
      if (!res.ok) throw new Error("Failed to toggle rule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-link-rules"] });
    },
  });
}
