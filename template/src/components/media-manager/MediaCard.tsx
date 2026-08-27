"use client";

import React, { useState } from "react";
import Image from "next/image";
import { File, Check, Trash2, Eye } from "lucide-react";
import { Button } from "@/src/ui/button";
import { cn } from "@/src/lib/utils";
import { MediaItem } from "./MediaManager";
import { Column, DataTable } from "@/src/ui/data-table";
import { toast } from "@/src/hooks/use-toast";
import { resolveAppUrl } from "@/src/lib/base-path";
import { getBaseUrl } from "@/src/lib/config";

interface MediaCardProps {
  item: MediaItem;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onPreview: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
}

interface MediaTableProps {
  items: MediaItem[];
  selectedIds: Set<number>;
  onSelect: (id: number) => void;
  onPreview: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

export function MediaCard({
  item,
  isSelected,
  onSelect,
  onPreview,
  onDelete,
}: MediaCardProps) {
  const [imageError, setImageError] = useState(false);
  const isImage = item.mimeType?.startsWith("image/");

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card overflow-hidden transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer",
        isSelected && "ring-2 ring-primary ring-offset-2",
      )}
      onClick={() => onSelect(item.id)}
    >
      <div className="absolute top-2 left-2 z-10">
        <div
          className={cn(
            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
            isSelected
              ? "bg-primary border-primary"
              : "bg-background/80 border-muted-foreground/50 backdrop-blur-sm",
          )}
        >
          {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
        </div>
      </div>

      <div className="aspect-square bg-muted/30 relative overflow-hidden">
        {isImage && !imageError ? (
          <Image
            src={`${getBaseUrl()}/api/media/${item.id}`}
            alt={item.originalName}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <File className="w-12 h-12" />
            <span className="text-xs px-2 truncate">
              {item.mimeType?.split("/")[1]?.toUpperCase() || "FILE"}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(item);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-2">
        <p className="text-xs font-medium truncate">{item.originalName}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(item.size)}
        </p>
      </div>
    </div>
  );
}

export function MediaTable({ items, onPreview, onDelete }: MediaTableProps) {
  const columns: Column<MediaItem>[] = [
    {
      key: "name",
      header: "Name",
      cell: (item) => {
        const isImage = item.mimeType?.startsWith("image/");

        return (
          <div className="group flex items-center gap-3 min-w-0">
            <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
              {isImage ? (
                <Image
                  src={item.url}
                  alt={item.originalName}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <File className="w-4 h-4 text-muted-foreground" />
              )}
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-medium truncate text-foreground">
                {item.originalName}
              </span>

              <span className="text-xs truncate text-muted-foreground">
                {item.fileName}
              </span>

              {/* Hover Actions */}
              <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(
                      resolveAppUrl(item.url, window.location.origin),
                    );
                    toast({
                      title: "URL copied",
                    });
                  }}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  Copy URL
                </button>
                <span className="text-xs text-muted-foreground">|</span>
                <a
                  href={item.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-primary hover:underline"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "date",
      header: "Date",
      cell: (item) => new Date(item.createdAt).toLocaleDateString(),
      className: "text-xs text-muted-foreground",
    },
    {
      key: "uploadedto",
      header: "Uploaded to",
      cell: (item) => formatFileSize(item.size),
      className: "text-xs text-muted-foreground",
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(row);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(row);
            }}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
      filterable: false,
      className: "w-20 text-center",
    },
  ];

  return (
    <DataTable
      data={items}
      columns={columns}
      pageSize={25}
      // searchKeys={["originalName", "fileName", "mimeType"]}
      searchPlaceholder="Search media..."
      emptyMessage="No media found."
    />
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
