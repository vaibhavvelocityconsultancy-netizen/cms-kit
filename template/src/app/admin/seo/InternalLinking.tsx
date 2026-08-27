"use client";

import React, { useMemo, useState } from "react";
import {
  Link2,
  FileText,
  File,
  Loader2,
  Check,
  Eye,
  ChevronRight,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/src/ui/button";
import { Badge } from "@/src/ui/badge";
import { Column, DataTable } from "@/src/ui/data-table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/src/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/src/ui/sheet";
import {
  useLinkableContent,
  useSuggestInternalLinksWithPhrases,
  useCreateRule,
} from "@/src/hooks/useInternalLinkRules";

interface ContentRow {
  id: number | string;
  title: string;
  slug: string;
  published: boolean;
  updatedAt: string;
  type: "page" | "post";
}

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

// Relevance badge color based on score
function getRelevanceBadgeColor(score: number) {
  if (score >= 80) return "bg-green-100 text-green-800";
  if (score >= 60) return "bg-blue-100 text-blue-800";
  if (score >= 40) return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-800";
}

// Highlight the matched phrase in the snippet
function HighlightedSnippet({
  snippet,
  phrase,
}: {
  snippet: string;
  phrase: string;
}) {
  const parts = snippet.split(new RegExp(`(${phrase})`, "gi"));
  return (
    <span className="text-xs text-muted-foreground">
      {parts.map((part, i) =>
        part.toLowerCase() === phrase.toLowerCase() ? (
          <span key={i} className="bg-yellow-100 font-semibold text-gray-900">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

export default function InternalLinkingPageEnhanced() {
  const { data: content = [], isLoading } = useLinkableContent();
  const [selected, setSelected] = useState<ContentRow | null>(null);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(
    null,
  );
  const queryClient = useQueryClient();

  const suggestionsQueryKey = [
    "internal-links",
    "suggestions-with-phrases",
    selected?.type,
    selected?.id,
  ];

  const {
    data: suggestions = [],
    isLoading: suggestionsLoading,
    isFetching: suggestionsFetching,
  } = useSuggestInternalLinksWithPhrases(
    selected?.type,
    selected?.id,
    selected?.title,
    {
      enabled: !!selected,
    },
  );

  const createRule = useCreateRule();

  const pages = useMemo(() => content.filter((c) => c.type === "page"), [
    content,
  ]);
  const posts = useMemo(() => content.filter((c) => c.type === "post"), [
    content,
  ]);

  function openSuggestions(row: ContentRow) {
    setSelected(row);
    setExpandedSuggestion(null);
  }

  const baseColumns = (typeLabel: "page" | "post"): Column<ContentRow>[] => [
    {
      key: "title",
      header: "Title",
      cell: (row) => (
        <div className="flex items-center gap-2">
          {typeLabel === "page" ? (
            <File className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="font-medium">{row.title}</span>
        </div>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">/{row.slug}</span>
      ),
      filterable: false,
    },
    {
      key: "published",
      header: "Status",
      cell: (row) => (
        <Badge variant={row.published ? "default" : "secondary"}>
          {row.published ? "Published" : "Draft"}
        </Badge>
      ),
      filterValue: (row) => (row.published ? "Published" : "Draft"),
    },
    {
      key: "updatedAt",
      header: "Last updated",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.updatedAt).toLocaleDateString()}
        </span>
      ),
      filterable: false,
    },
    {
      key: "action",
      header: "",
      filterable: false,
      className: "w-40",
      cell: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => openSuggestions(row)}
        >
          <Link2 className="mr-2 h-4 w-4" /> View suggestions
        </Button>
      ),
    },
  ];

  const pageColumns = useMemo(() => baseColumns("page"), []);
  const postColumns = useMemo(() => baseColumns("post"), []);

  function handleAccept(suggestion: SuggestionWithPhrases) {
    createRule.mutate(
      {
        keyword: suggestion.keyword,
        destinationType: suggestion.destinationType,
        destinationId: suggestion.destinationId,
      },
      {
        onSuccess: () => {
          queryClient.setQueryData(
            suggestionsQueryKey,
            (old: SuggestionWithPhrases[] | undefined) =>
              (old ?? []).map((item) =>
                item.keyword.toLowerCase() ===
                suggestion.keyword.toLowerCase()
                  ? { ...item, linked: true }
                  : item,
              ),
          );
          queryClient.invalidateQueries({
            queryKey: ["internal-link-rules"],
          });
          queryClient.invalidateQueries({
            queryKey: ["internal-links", "suggestions-with-phrases"],
          });
        },
      },
    );
  }

  return (
    <div className="space-y-4 p-8">
      <div>
        <h1 className="text-xl font-semibold">Link suggestions</h1>
        <p className="text-sm text-muted-foreground">
          Pick a page or post to see other content you could link to from it.
        </p>
      </div>

      <Tabs defaultValue="pages">
        <TabsList>
          <TabsTrigger value="pages">
            <File className="mr-2 h-4 w-4" /> Pages ({pages.length})
          </TabsTrigger>
          <TabsTrigger value="posts">
            <FileText className="mr-2 h-4 w-4" /> Posts ({posts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="mt-4">
          <DataTable
            data={pages}
            columns={pageColumns}
            searchKeys={["title", "slug"]}
            searchPlaceholder="Search pages..."
            emptyMessage={isLoading ? "Loading..." : "No pages found."}
            getRowId={(row) => `page-${row.id}`}
          />
        </TabsContent>

        <TabsContent value="posts" className="mt-4">
          <DataTable
            data={posts}
            columns={postColumns}
            searchKeys={["title", "slug"]}
            searchPlaceholder="Search posts..."
            emptyMessage={isLoading ? "Loading..." : "No posts found."}
            getRowId={(row) => `post-${row.id}`}
          />
        </TabsContent>
      </Tabs>

      {/* Rank Math-style two-column drawer */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-4xl sm:p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle className="flex items-center gap-2 text-lg">
              {selected?.type === "page" ? (
                <File className="h-5 w-5" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
              {selected?.title}
              <Badge variant="outline" className="ml-auto capitalize">
                {selected?.type}
              </Badge>
            </SheetTitle>
            <SheetDescription className="text-xs">
              Suggested internal links based on this {selected?.type}'s content.
            </SheetDescription>
          </SheetHeader>

          <div className="grid h-[calc(100vh-120px)] grid-cols-2 overflow-hidden">
            {/* Left column: Phrases */}
            <div className="border-r overflow-y-auto">
              <div className="space-y-0 p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Phrases in this {selected?.type} to link from
                </h3>

                {suggestionsLoading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Scanning content...
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                    <Check className="h-6 w-6 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      No suggestions found. All content may already be linked.
                    </p>
                  </div>
                ) : (
                  suggestions.map((suggestion: SuggestionWithPhrases) => (
                    <button
                      key={`${suggestion.destinationType}-${suggestion.destinationId}`}
                      onClick={() =>
                        setExpandedSuggestion(
                          expandedSuggestion ===
                            `${suggestion.destinationType}-${suggestion.destinationId}`
                            ? null
                            : `${suggestion.destinationType}-${suggestion.destinationId}`,
                        )
                      }
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        expandedSuggestion ===
                        `${suggestion.destinationType}-${suggestion.destinationId}`
                          ? "border-blue-300 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {suggestion.phrases.map((match, idx) => (
                        <div key={idx} className="mb-2 last:mb-0">
                          <div className="flex items-start gap-2">
                            <Copy className="mt-1 h-3 w-3 shrink-0 text-gray-400" />
                            <HighlightedSnippet
                              snippet={match.snippet}
                              phrase={match.phrase}
                            />
                          </div>
                        </div>
                      ))}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right column: Suggested destinations */}
            <div className="overflow-y-auto">
              <div className="space-y-2 p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  {selected?.type === "page" ? "Pages" : "Posts"} to link to
                </h3>

                {suggestionsLoading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  </div>
                ) : expandedSuggestion ? (
                  (() => {
                    const expanded = suggestions.find(
                      (s) =>
                        `${s.destinationType}-${s.destinationId}` ===
                        expandedSuggestion,
                    );
                    return expanded ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">{expanded.destTitle}</h4>

                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Type: </span>
                            <Badge variant="outline" className="capitalize">
                              {expanded.destinationType}
                            </Badge>
                          </div>

                          <div>
                            <span className="text-muted-foreground">
                              AI Content Relatedness:{" "}
                            </span>
                            <Badge
                              className={`${getRelevanceBadgeColor(expanded.relevanceScore)}`}
                            >
                              {expanded.relevanceScore}%
                            </Badge>
                          </div>

                          <div className="pt-2">
                            <span className="text-muted-foreground">URL: </span>
                            <code className="block break-all rounded bg-gray-100 p-2 text-xs font-mono">
                              {expanded.resolvedUrl}
                            </code>
                          </div>

                          <div className="flex gap-2 pt-3">
                            <Button
                              size="sm"
                              variant={
                                expanded.linked ? "secondary" : "default"
                              }
                              disabled={
                                expanded.linked || createRule.isPending
                              }
                              onClick={() => handleAccept(expanded)}
                              className="flex-1"
                            >
                              {expanded.linked ? (
                                <>
                                  <Check className="mr-1 h-3 w-3" />
                                  Linked
                                </>
                              ) : (
                                "Link it"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExpandedSuggestion(null)}
                            >
                              Close
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Select a phrase on the left to see details.
                  </p>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Icon for copy
function Copy({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  );
}