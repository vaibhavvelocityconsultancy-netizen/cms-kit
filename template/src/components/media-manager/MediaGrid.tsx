"use client";

import React, { useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
// import { MediaCard } from "./MediaCard";
// import { ViewMode, MediaItem } from "./MediaManager";
import { cn } from "@/src/lib/utils";
import { MediaItem, ViewMode } from "./MediaManager";
import { MediaCard, MediaTable } from "./MediaCard";
// import MediaCard from "./MediaCard";

interface MediaGridProps {
  items: MediaItem[];
  loading: boolean;
  selectedIds: Set<number>;
  onSelect: (id: number) => void;
  onPreview: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  viewMode: ViewMode;
  onLoadMore: () => void;
  hasMore: boolean;
}

export function MediaGrid({
  items,
  loading,
  selectedIds,
  onSelect,
  onPreview,
  onDelete,
  viewMode,
  onLoadMore,
  hasMore,
}: MediaGridProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();
      
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore();
        }
      });
      
      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, onLoadMore]
  );
  
  if (items?.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-lg">No media found</p>
          <p className="text-sm">Upload your first file to get started</p>
        </div>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div>
        <MediaTable
          items={items}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onPreview={onPreview}
          onDelete={onDelete}
          onLoadMore={onLoadMore}
          hasMore={hasMore}
          loading={loading}
        />

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div
      className={cn(
        "grid gap-4",
        "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6"
      )}
    >
      {items?.map((item, index) => (
        <div
          key={item.id}
          ref={index === items.length - 1 ? lastItemRef : undefined}
        >
          <MediaCard
            item={item}
            isSelected={selectedIds.has(item.id)}
            onSelect={onSelect}
            onPreview={onPreview}
            onDelete={onDelete}
          />
        </div>
      ))}
      
      {loading && (
        <div className="col-span-full flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
