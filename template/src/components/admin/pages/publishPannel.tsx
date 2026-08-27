"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Eye, Clock, Calendar } from "lucide-react";
import { Page } from "../Cms";
import { appUrl } from "@/src/lib/base-path";

interface PublishPanelProps {
  page: Page;
  onChange: (page: Page) => void;
  onSave: () => void;
  onPublish: () => void;
  isSaving: boolean;
}

export function PublishPanel({
  page,
  onChange,
  onSave,
  onPublish,
  isSaving,
}: PublishPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingVisibility, setEditingVisibility] = useState(false);

  const isPublished = page.status === "PUBLISHED";

  return (
    <div className="bg-card border border-border rounded shadow-sm overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Publish</h2>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Save Draft + Preview */}
          <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
            <button
              onClick={onSave}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm border border-border bg-background text-foreground rounded hover:bg-muted transition-colors disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
            <button
              onClick={() => window.open(appUrl(`/${page.slug}`), "_blank")}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Eye size={14} />
              Preview
            </button>
          </div>

          {/* Status rows */}
          <div className="px-3 py-3 space-y-2 border-b border-border">
            {/* Status */}
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Clock size={14} className="text-muted-foreground" />
              <span className="font-medium">Status:</span>
              {editingStatus ? (
                <div className="flex items-center gap-2 ml-auto">
                  <select
                    value={page.status}
                    onChange={(e) =>
                      onChange({ ...page, status: e.target.value })
                    }
                    className="text-xs border border-border bg-background text-foreground px-1 py-0.5 rounded focus:outline-none"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                  </select>
                  <button
                    onClick={() => setEditingStatus(false)}
                    className="text-xs text-primary hover:underline"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <span className="ml-auto">
                  {isPublished ? "PUBLISHED" : "DRAFT"}
                  <button
                    onClick={() => setEditingStatus(true)}
                    className="ml-2 text-xs text-primary hover:underline"
                  >
                    Edit
                  </button>
                </span>
              )}
            </div>

            {/* Visibility */}
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Eye size={14} className="text-muted-foreground" />
              <span className="font-medium">Visibility:</span>
              <span className="ml-auto">
                Public
                <button
                  onClick={() => setEditingVisibility(!editingVisibility)}
                  className="ml-2 text-xs text-primary hover:underline"
                >
                  Edit
                </button>
              </span>
            </div>

            {/* Publish date */}
            {isPublished && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Calendar size={14} className="text-muted-foreground" />
                <span className="font-medium">Published on:</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {page.publishedAt
                    ? new Date(page.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between px-3 py-3">
            <button className="text-xs text-destructive hover:text-destructive/80 hover:underline transition-colors">
              Move to Trash
            </button>
            <button
              onClick={onPublish}
              disabled={isSaving}
              className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? "Publishing..." : isPublished ? "Update" : "Publish"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
