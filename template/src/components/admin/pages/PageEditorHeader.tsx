"use client";

import { ArrowLeft, Eye } from "lucide-react";
import { Page } from "../Cms";
import { useState } from "react";
import { ThemeToggle } from "@/src/components/theme-toggle";

interface PageEditorHeaderProps {
  page: Page;
  homepagePageId: number | null;
  onChange: (page: Page) => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export function PageEditorHeader({
  page,
  homepagePageId,
  onChange,
  onCancel,
  onSave,
  isSaving,
}: PageEditorHeaderProps) {
  const [slugEditing, setSlugEditing] = useState(false);
  const [slugInput, setSlugInput] = useState(page.slug);

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const isHomepage = Number(page.id) === Number(homepagePageId);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  const permalinkBase = siteUrl ? `${siteUrl}/` : "/";

  const handleTitleChange = (value: string) => {
    const newSlug = isHomepage ? "" : generateSlug(value);
    setSlugInput(newSlug);
    onChange({ ...page, title: value, slug: newSlug });
  };

  const handleSlugSave = () => {
    const clean = slugInput.trim() ? generateSlug(slugInput) : "";
    setSlugInput(clean);
    onChange({ ...page, slug: clean });
    setSlugEditing(false);
  };

  const openPreview = () => {
    window.open(page.slug ? `/${page.slug}` : "/", "_blank");
  };

  return (
    <div className="bg-card border-b border-border shadow-sm">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            All Pages
          </button>
          {/* <span className="text-border">|</span> */}
          {/* <span className="text-sm font-semibold text-foreground">
            Edit Page
          </span> */}
          {/* <button
            onClick={onCancel}
            className="ml-2 px-3 py-1 text-sm text-primary border border-primary hover:bg-primary hover:text-primary-foreground transition-colors rounded"
          >
            Add Page
          </button> */}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={openPreview}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground border border-border bg-background hover:bg-muted hover:text-foreground transition-colors rounded"
          >
            <Eye size={14} />
            Preview
          </button>
        </div>
      </div>

      {/* Title + Permalink */}
      <div className="px-6 py-4">
        <input
          type="text"
          value={page.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Add title"
          className="w-full text-[26px] font-normal text-foreground border border-border bg-background px-4 py-3 rounded focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_var(--primary)] placeholder:text-muted-foreground"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        />

        {/* Permalink row */}
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <span className="font-medium">Permalink:</span>
          {slugEditing ? (
            <div className="flex items-center gap-2">
              <span className="text-primary">{permalinkBase}</span>
              <input
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                className="border border-primary bg-background px-2 py-0.5 text-sm text-foreground rounded focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleSlugSave}
                className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                OK
              </button>
              <button
                onClick={() => {
                  setSlugInput(page.slug);
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
                href={page.slug ? `/${page.slug}` : "/"}
                target="_blank"
                className="text-primary hover:underline"
              >
                {permalinkBase}
                <span className="font-medium">{page.slug}</span>
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
    </div>
  );
}
