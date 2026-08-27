"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "@/src/hooks/use-toast";
import { MediaGrid } from "./MediaGrid";
import { UploadZone } from "./UploadZone";
import { MediaFilter, MediaToolbar } from "./MediaToolbar";
import { MediaPreview } from "./MediaPreview";
import { DeleteConfirm } from "./DeleteConfirm";
import { Button } from "@/src/ui/button";
import { getBaseUrl } from "@/src/lib/config";

export interface MediaItem {
  id: number;
  fileName: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  altText?: string | null;
  title?: string | null;
  caption?: string | null;
  description?: string | null;
}

export type ViewMode = "grid" | "list";

const MEDIA_PAGE_SIZE = 24;

export function MediaManager() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<MediaItem | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  // Add state for filters
  const [filter, setFilter] = useState<MediaFilter>({
    type: "all",
    dateRange: "all",
    sortBy: "date",
    sortOrder: "desc",
  });

  // Fetch media function
  const fetchMedia = useCallback(
    async (pageToFetch = page) => {
      setLoading(true);

      try {
        // Build query params
        const params = new URLSearchParams();
        params.append("page", pageToFetch.toString());
        params.append("limit", MEDIA_PAGE_SIZE.toString());
        if (searchQuery) params.append("search", searchQuery);
        if (filter.type !== "all") params.append("type", filter.type);
        if (filter.dateRange && filter.dateRange !== "all")
          params.append("dateRange", filter.dateRange);
        if (filter.sortBy) params.append("sortBy", filter.sortBy);
        if (filter.sortOrder) params.append("sortOrder", filter.sortOrder);

        const res = await fetch(
          `${getBaseUrl()}/api/media?${params.toString()}`,
        );
        const data = await res.json();

        if (data.success) {
          if (pageToFetch === 1) {
            setMedia(data.data.items);
          } else {
            setMedia((prev) => [...prev, ...data.data.items]);
          }

          const pagination = data.data.pagination;
          setHasMore(
            pagination ? pagination.page < pagination.totalPages : false,
          );
          setTotalItems(pagination?.total || data.data.items.length);
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to fetch media",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch media",
          variant: "destructive",
        });
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [page, searchQuery, filter],
  );

  // Filter and sort media items client-side (if API doesn't support filtering)
  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...media];

    // Only apply client-side filters if needed
    // For better performance, prefer server-side filtering via API

    // Filter by type (client-side fallback)
    if (filter.type !== "all") {
      filtered = filtered.filter((item) => {
        if (filter.type === "image") return item.mimeType?.startsWith("image/");
        if (filter.type === "video") return item.mimeType?.startsWith("video/");
        if (filter.type === "audio") return item.mimeType?.startsWith("audio/");
        if (filter.type === "document")
          return (
            item.mimeType?.includes("pdf") ||
            item.mimeType?.includes("document") ||
            item.mimeType?.includes("text")
          );
        if (filter.type === "other")
          return (
            !item.mimeType?.startsWith("image/") &&
            !item.mimeType?.startsWith("video/") &&
            !item.mimeType?.startsWith("audio/")
          );
        return true;
      });
    }

    // Filter by date range (client-side fallback)
    if (filter.dateRange && filter.dateRange !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.createdAt);

        switch (filter.dateRange) {
          case "today":
            return itemDate >= today;
          case "week":
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            return itemDate >= weekAgo;
          case "month":
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            return itemDate >= monthAgo;
          case "year":
            const yearAgo = new Date(today);
            yearAgo.setFullYear(today.getFullYear() - 1);
            return itemDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    // Filter by search query (client-side fallback)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.originalName.toLowerCase().includes(query) ||
          item.altText?.toLowerCase().includes(query) ||
          item.title?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query),
      );
    }

    // Sort items (client-side fallback)
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (filter.sortBy) {
        case "name":
          comparison = a.originalName.localeCompare(b.originalName);
          break;
        case "size":
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case "date":
        default:
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return filter.sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [media, filter, searchQuery]);

  // Fetch media when dependencies change
  useEffect(() => {
    setPage(1);
    setMedia([]);
    fetchMedia(1);
  }, [searchQuery, filter]);

  useEffect(() => {
    if (page > 1) {
      fetchMedia();
    }
  }, [page]);

  const handleUploadComplete = () => {
    setPage(1);
    setMedia([]);
    fetchMedia();
    toast({
      title: "Upload complete",
      description: "Your media has been uploaded successfully",
    });
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      setIsDeleting(true);

      const response = await fetch(
        `${getBaseUrl()}/api/media/${deleteItem.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete media");
      }

      setMedia((prev) => prev.filter((m) => m.id !== deleteItem.id));
      setTotalItems((prev) => prev - 1);

      toast({
        title: "Success",
        description: "Media deleted successfully",
      });

      setDeleteItem(null);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete media",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      const response = await fetch(`${getBaseUrl()}/api/media/bulk-delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete some items");
      }

      toast({
        title: "Success",
        description: `${ids.length} items deleted`,
      });

      setMedia((prev) => prev.filter((m) => !selectedIds.has(m.id)));
      setSelectedIds(new Set());
      setTotalItems((prev) => prev - ids.length);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete some items",
        variant: "destructive",
      });
    }
  };
  const handleUpdate = async (item: MediaItem, updates: Partial<MediaItem>) => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/media/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update media");
      }

      const updatedMedia = data.data as MediaItem;

      setMedia((prev) =>
        prev.map((mediaItem) =>
          mediaItem.id === updatedMedia.id ? updatedMedia : mediaItem,
        ),
      );
      setPreviewItem(updatedMedia);
      toast({
        title: "Success",
        description: "Media updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update media",
        variant: "destructive",
      });
      throw error;
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="px-8 bg-background dot-grid">
      <UploadZone onUploadComplete={handleUploadComplete} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <MediaToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCount={selectedCount}
          onBulkDelete={handleBulkDelete}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          filter={filter}
          onFilterChange={setFilter}
          totalItems={totalItems}
          filteredCount={filteredAndSortedItems.length}
        />

        <MediaGrid
          items={filteredAndSortedItems}
          loading={loading && page === 1}
          selectedIds={selectedIds}
          onSelect={(id) => {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            });
          }}
          onPreview={setPreviewItem}
          onDelete={setDeleteItem}
          viewMode={viewMode}
          onLoadMore={loadMore}
          hasMore={hasMore}
        />
      </div>

      <MediaPreview
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onDelete={(item) => {
          setPreviewItem(null);
          setDeleteItem(item);
        }}
        onUpdate={handleUpdate}
      />

      <DeleteConfirm
        open={!!deleteItem}
        item={deleteItem}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  );
}
