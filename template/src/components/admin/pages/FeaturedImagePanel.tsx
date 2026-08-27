"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, ImagePlus, X } from "lucide-react";
import { Page } from "../Cms";
import { MediaPickerModal } from "../../media-manager/MediaPicker";

interface FeaturedImagePanelProps {
  page: Page;
  onChange: (page: Page) => void;
}

export function FeaturedImagePanel({
  page,
  onChange,
}: FeaturedImagePanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const featuredImage = (page as any).featuredImage as string | null;

  const removeImage = () => {
    onChange({
      ...page,
      featuredImage: null,
    } as any);
  };

  return (
    <>
      <div className="bg-card border border-border rounded shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-muted border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            Featured Image
          </h2>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {collapsed ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronUp size={16} />
            )}
          </button>
        </div>

        {!collapsed && (
          <div className="px-3 py-3">
            {featuredImage ? (
              <div className="relative group">
                <img
                  src={featuredImage}
                  alt="Featured"
                  className="w-full rounded border border-border object-cover max-h-40"
                />

                <button
                  onClick={removeImage}
                  className="absolute top-1.5 right-1.5 p-1 bg-background border border-border rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                >
                  <X size={12} className="text-destructive" />
                </button>

                <button
                  onClick={removeImage}
                  className="block mt-2 w-full text-center text-xs text-destructive hover:underline"
                >
                  Remove featured image
                </button>

                <button
                  onClick={() => setShowMediaPicker(true)}
                  className="block mt-2 w-full text-center text-xs text-primary hover:underline"
                >
                  Replace image
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowMediaPicker(true)}
                className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded cursor-pointer hover:border-primary hover:bg-muted transition-colors group"
              >
                <ImagePlus
                  size={20}
                  className="text-muted-foreground group-hover:text-primary transition-colors mb-1"
                />

                <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  Select Featured Image
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(media: any) => {
          onChange({
            ...page,
            featuredImage: media.url,
          } as any);
        }}
      />
    </>
  );
}