"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Post } from "../Cms";

interface PostEditorMetaProps {
  post: Post;
  onChange: (post: Post) => void;
}

const FORMAT_OPTIONS = [
  { value: "standard", label: "Standard", icon: "◈" },
  { value: "aside", label: "Aside", icon: "❝" },
  { value: "audio", label: "Audio", icon: "♪" },
  { value: "chat", label: "Chat", icon: "💬" },
  { value: "gallery", label: "Gallery", icon: "⊞" },
  { value: "image", label: "Image", icon: "⊡" },
  { value: "link", label: "Link", icon: "⊙" },
  { value: "quote", label: "Quote", icon: "«" },
  { value: "status", label: "Status", icon: "●" },
  { value: "video", label: "Video", icon: "▷" },
];

function CollapsibleSection({
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

export function PostEditorMeta({ post, onChange }: PostEditorMetaProps) {
  const format = (post as any).format ?? "standard";

  return (
    <div className="flex flex-col gap-3">
      {/* Excerpt */}
      <CollapsibleSection title="Excerpt">
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
            Used in post listings and SEO. Leave blank to auto-generate.
          </p>
        </div>
      </CollapsibleSection>

      {/* Format */}
      <CollapsibleSection title="Post Format" defaultOpen={false}>
        <div className="p-4 grid grid-cols-5 gap-2">
          {FORMAT_OPTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => onChange({ ...post, format: f.value } as any)}
              className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-md border text-center transition-colors ${
                format === f.value
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-ring hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <span className="text-base leading-none">{f.icon}</span>
              <span className="text-[10px] font-medium">{f.label}</span>
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* SEO */}
      <CollapsibleSection title="SEO" defaultOpen={false}>
        <div className="p-4 flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">
              SEO Title
            </label>
            <input
              type="text"
              value={post.seoData?.metaTitle ?? ""}
              onChange={(e) =>
                onChange({
                  ...post,
                  seoData: {
                    ...post.seoData,
                    metaTitle: e.target.value,
                  },
                })
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">
              SEO Description
            </label>
            <textarea
              value={post.seoData?.metaDescription ?? ""}
              onChange={(e) =>
                onChange({
                  ...post,
                  seoData: {
                    ...post.seoData,
                    metaDescription: e.target.value,
                  },
                })
              }
            />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
