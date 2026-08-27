"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { appUrl } from "@/src/lib/base-path";
import { Post } from "./Post.type";

interface PostEditorHeaderProps {
  post: Post;
  onChange: (post: Post) => void;
  onCancel: () => void;
}

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function PostEditorHeader({
  post,
  onChange,
  onCancel,
}: PostEditorHeaderProps) {
  const [slugEditing, setSlugEditing] = useState(false);
  const [slugInput, setSlugInput] = useState(post.slug);

  const handleTitleChange = (value: string) => {
    const newSlug = generateSlug(value);
    setSlugInput(newSlug);
    onChange({ ...post, title: value, slug: newSlug });
  };

  const handleSlugSave = () => {
    const clean = generateSlug(slugInput);
    setSlugInput(clean);
    onChange({ ...post, slug: clean });
    setSlugEditing(false);
  };

  return (
    <div className="border-b border-border bg-card py-4">
      {/* Back button */}
      <button
        onClick={onCancel}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3 group"
      >
        <ArrowLeft
          size={13}
          className="group-hover:-translate-x-0.5 transition-transform"
        />
        All Posts
      </button>

      {/* Title */}
      <input
        type="text"
        value={post.title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="Post title"
        className="w-full text-[28px] font-semibold bg-transparent text-foreground border-none outline-none placeholder:text-muted-foreground/40 tracking-tight"
      />

      {/* Permalink row */}
      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
        <span className="font-medium">Permalink:</span>
        {slugEditing ? (
          <div className="flex items-center gap-2">
            <span className="text-primary">{appUrl("/posts/")}</span>
            <input
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              className="border border-primary bg-background px-2 py-0.5 text-sm text-foreground rounded focus:outline-none"
              autoFocus
            />
            <span className="text-primary">/</span>
            <button
              onClick={handleSlugSave}
              className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              OK
            </button>
            <button
              onClick={() => {
                setSlugInput(post.slug);
                setSlugEditing(false);
              }}
              className="px-2 py-0.5 text-xs border border-border rounded hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <a
              href={`${appUrl("/posts/")}${post.slug}/`}
              target="_blank"
              className="text-primary hover:underline"
            >
              {appUrl("/posts/")}
              <span className="font-medium">{post.slug}</span>/
            </a>
            <button
              onClick={() => setSlugEditing(true)}
              className="px-2 py-0.5 text-xs border border-border bg-background rounded hover:bg-muted transition-colors"
            >
              Edit
            </button>
          </>
        )}
      </div>
    </div>
  );
}
