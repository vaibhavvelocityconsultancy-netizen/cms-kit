"use client";

import React, { useMemo, useState } from "react";
import { Link2, FileText, File, Loader2 } from "lucide-react";
import { Button } from "@/src/ui/button";
import { Badge } from "@/src/ui/badge";
import { Column, DataTable } from "@/src/ui/data-table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/src/ui/sheet";
import {
  useLinkableContent,
  useSuggestInternalLinks,
  useCreateRule,
} from "@/src/hooks/useInternalLinkRules";

interface ContentRow {
  id: number;
  title: string;
  slug: string;
  published: boolean;
  updatedAt: string;
  type: "page" | "post";
}

interface Suggestion {
  keyword: string;
  destinationType: string;
  destinationId: number;
  resolvedUrl: string;
}

export default function InternalLinkSuggestionsPage() {
  const { data: content = [], isLoading } = useLinkableContent();
  const [selected, setSelected] = useState<ContentRow | null>(null);
  const [acceptedKeywords, setAcceptedKeywords] = useState<Set<string>>(
    new Set(),
  );

  const {
    data: suggestions = [],
    isLoading: suggestionsLoading,
    isFetching: suggestionsFetching,
  } = useSuggestInternalLinks(selected?.type, selected?.id, {
    enabled: !!selected,
  });

  const createRule = useCreateRule();

  const columns: Column<ContentRow>[] = useMemo(
    () => [
      {
        key: "title",
        header: "Title",
        cell: (row) => (
          <div className="flex items-center gap-2">
            {row.type === "page" ? (
              <File className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className="font-medium">{row.title}</span>
          </div>
        ),
      },
      {
        key: "type",
        header: "Type",
        cell: (row) => (
          <Badge variant="outline" className="capitalize">
            {row.type}
          </Badge>
        ),
        filterValue: (row) => row.type,
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
          <span className="text-muted-foreground text-sm">
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
            onClick={() => {
              setAcceptedKeywords(new Set());
              setSelected(row);
            }}
          >
            <Link2 className="h-4 w-4 mr-2" /> View suggestions
          </Button>
        ),
      },
    ],
    [],
  );

  function handleAccept(s: Suggestion) {
    createRule.mutate(
      {
        keyword: s.keyword,
        destinationType: s.destinationType,
        destinationId: s.destinationId,
      },
      {
        onSuccess: () => {
          setAcceptedKeywords((prev) => new Set(prev).add(s.keyword));
        },
      },
    );
  }

  return (
    <div className="p-8 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Link suggestions</h1>
        <p className="text-sm text-muted-foreground">
          Pick a page or post to see other content you could link to from it.
        </p>
      </div>

      <DataTable
        data={content}
        columns={columns}
        searchKeys={["title", "slug"]}
        searchPlaceholder="Search pages and posts..."
        emptyMessage={isLoading ? "Loading..." : "No pages or posts found."}
        getRowId={(row) => `${row.type}-${row.id}`}
      />

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selected?.type === "page" ? (
                <File className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {selected?.title}
            </SheetTitle>
            <SheetDescription>
              Suggested internal links based on this {selected?.type}'s content.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-2">
            {suggestionsLoading || suggestionsFetching ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Scanning
                content...
              </div>
            ) : suggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <Link2 className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No matching titles found in this content.
                </p>
              </div>
            ) : (
              suggestions.map((s: Suggestion) => {
                const accepted = acceptedKeywords.has(s.keyword);
                return (
                  <div
                    key={`${s.destinationType}-${s.destinationId}-${s.keyword}`}
                    className="flex items-center justify-between gap-3 border rounded-lg p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        "{s.keyword}"
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        → {s.destinationType} · {s.resolvedUrl}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={accepted ? "secondary" : "default"}
                      disabled={accepted || createRule.isPending}
                      onClick={() => handleAccept(s)}
                    >
                      {accepted ? "Linked" : "Link it"}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
