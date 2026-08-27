"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ImagePlus, X } from "lucide-react";
import { SeoPanel } from "../pages/seo-pannel";
import { Post } from "./Post.type";
import { MediaPickerModal } from "../../media-manager/MediaPicker";

interface PostEditorSidebarProps {
  post: Post;
  onChange: (post: Post) => void;
}

function CollapsiblePanel({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
          {title}
        </span>
        {open ? (
          <ChevronUp size={14} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground" />
        )}
      </button>
      {open && <div className="border-t border-border">{children}</div>}
    </div>
  );
}

export function PostEditorSidebar({ post, onChange }: PostEditorSidebarProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const handleSeoChange = (seoData: any) => {
    onChange({ ...post, seoData } as any);
  };

  const featuredImage = (post as any).featuredImage as string | null;

  return (
    <div className="flex flex-col gap-4">
      {/* Excerpt */}
      <CollapsiblePanel title="Excerpt" defaultOpen={true}>
        <div className="p-4">
          <textarea
            value={(post as any).excerpt ?? ""}
            onChange={(e) =>
              onChange({ ...post, excerpt: e.target.value } as any)
            }
            placeholder="Write a short summary of this post..."
            rows={3}
            className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Leave blank to auto-generate from content.
          </p>
        </div>
      </CollapsiblePanel>

      {/* SEO */}
      <CollapsiblePanel title="SEO Settings" defaultOpen={true}>
        <div className="p-2">
          <SeoPanel
            pageTitle={post.title}
            pageSlug={post.slug}
            pageContent={post.content || ""}
            siteUrl={siteUrl}
            siteName={process.env.NEXT_PUBLIC_SITE_NAME || "Your Site"}
            initialData={(post as any).seoData}
            onChange={handleSeoChange}
          />
        </div>
      </CollapsiblePanel>

      {/* Featured Image */}
      <CollapsiblePanel title="Featured Image" defaultOpen={true}>
        <div className="p-4">
          {featuredImage ? (
            <div className="relative group">
              <img
                src={featuredImage}
                alt="Featured"
                className="w-full rounded border border-border object-cover max-h-40"
              />

              <button
                onClick={() =>
                  onChange({ ...post, featuredImage: null } as any)
                }
                className="absolute top-1.5 right-1.5 p-1 bg-background border border-border rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
              >
                <X size={12} className="text-destructive" />
              </button>

              <button
                onClick={() => setShowMediaPicker(true)}
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
      </CollapsiblePanel>

      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(media: any) => {
          onChange({
            ...post,
            featuredImage: media.url,
          } as any);
          setShowMediaPicker(false);
        }}
      />
    </div>
  );
}
