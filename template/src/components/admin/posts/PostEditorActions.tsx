"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Tag,
  FolderOpen,
  Eye,
  Save,
  Loader2,
  X,
} from "lucide-react";
import { apiMutations } from "@/src/lib/apimutation";
import { fetchers } from "@/src/lib/fetchers";
import { Post } from "./Post.type";
import { appUrl } from "@/src/lib/base-path";

interface Category {
  id: string;
  name: string;
}
interface Tag {
  id: string;
  name: string;
}

interface PostEditorActionsProps {
  post: Post;
  onChange: (post: Post) => void;
  onSave: (status?: string) => void;
  isSaving: boolean;
}

// ─── Status Badge ─────────────────────────────────────────

function StatusBadge({
  status,
  onChange,
}: {
  status: string;
  onChange: (s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isPublished = status === "PUBLISHED";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
          isPublished
            ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
            : "bg-muted text-muted-foreground border-border hover:bg-accent"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${isPublished ? "bg-primary" : "bg-muted-foreground"}`}
        />
        {isPublished ? "Published" : "Draft"}
        <ChevronDown size={11} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-36 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
          {["DRAFT", "PUBLISHED"].map((s) => (
            <button
              key={s}
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                status === s
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {s === "PUBLISHED" ? "Published" : "Draft"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Categories Dropdown ──────────────────────────────────

function CategoriesDropdown({
  selectedIds,
  onToggle,
}: {
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchers
      .categories()
      .then((d) => setCategories(d.data || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const data = await apiMutations.createCategory({ name: newName.trim() });
      const created = data.data;
      setCategories((prev) => [...prev, created]);
      onToggle(created.id);
      setNewName("");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <FolderOpen size={12} />
        Categories
        {selectedIds.length > 0 && (
          <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
            {selectedIds.length}
          </span>
        )}
        <ChevronDown size={11} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-56 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs font-semibold text-foreground">Categories</p>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {categories.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                No categories yet
              </p>
            ) : (
              categories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-muted cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(cat.id)}
                    onChange={() => onToggle(cat.id)}
                    className="rounded border-border accent-primary"
                  />
                  <span className="text-xs text-foreground">{cat.name}</span>
                </label>
              ))
            )}
          </div>
          {/* Add new category */}
          <div className="border-t border-border px-3 py-2">
            <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wide font-medium">
              New category
            </p>
            <div className="flex gap-1.5">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Category name"
                className="flex-1 text-xs bg-muted border border-border rounded px-2 py-1 outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={handleAdd}
                disabled={adding || !newName.trim()}
                className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded disabled:opacity-40 hover:bg-primary/90 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tags Dropdown ────────────────────────────────────────

function TagsDropdown({
  selectedIds,
  onToggle,
  onAddNew,
}: {
  selectedIds: string[];
  onToggle: (id: string) => void;
  onAddNew: (tag: Tag) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchers
      .tags()
      .then((d) => setTags(d.data || []))
      .catch(() => setTags([]));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAdd = async () => {
    if (!input.trim()) return;
    setAdding(true);
    try {
      const data = await apiMutations.createTag({ name: input.trim() });
      const created = data.data;
      setTags((prev) => [...prev, created]);
      onAddNew(created);
      setInput("");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Tag size={12} />
        Tags
        {selectedIds.length > 0 && (
          <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
            {selectedIds.length}
          </span>
        )}
        <ChevronDown size={11} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-56 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs font-semibold text-foreground">Tags</p>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {tags.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                No tags yet
              </p>
            ) : (
              tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-muted cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(tag.id)}
                    onChange={() => onToggle(tag.id)}
                    className="rounded border-border accent-primary"
                  />
                  <span className="text-xs text-foreground">{tag.name}</span>
                </label>
              ))
            )}
          </div>
          <div className="border-t border-border px-3 py-2">
            <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wide font-medium">
              New tag
            </p>
            <div className="flex gap-1.5">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Tag name"
                className="flex-1 text-xs bg-muted border border-border rounded px-2 py-1 outline-none focus:border-ring text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={handleAdd}
                disabled={adding || !input.trim()}
                className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded disabled:opacity-40 hover:bg-primary/90 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Actions Bar ─────────────────────────────────────

export function PostEditorActions({
  post,
  onChange,
  onSave,
  isSaving,
}: PostEditorActionsProps) {
  const categoryIds: string[] = (post as any).categoryIds ?? [];
  const tagIds: string[] = (post as any).tagIds ?? [];

  const toggleCategory = (id: string) => {
    const updated = categoryIds.includes(id)
      ? categoryIds.filter((c) => c !== id)
      : [...categoryIds, id];
    onChange({ ...post, categoryIds: updated } as any);
  };

  const toggleTag = (id: string) => {
    const updated = tagIds.includes(id)
      ? tagIds.filter((t) => t !== id)
      : [...tagIds, id];
    onChange({ ...post, tagIds: updated } as any);
  };

  const addNewTag = (tag: { id: string }) => {
    onChange({ ...post, tagIds: [...tagIds, tag.id] } as any);
  };

  const isPublished = post.status === "PUBLISHED";

  return (
    <div className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border px-6 py-2.5 flex items-center gap-3 flex-wrap">
      {/* Status */}
      <StatusBadge
        status={post.status}
        onChange={(s) => onChange({ ...post, status: s })}
      />

      <div className="w-px h-4 bg-border" />

      {/* Categories */}
      <CategoriesDropdown selectedIds={categoryIds} onToggle={toggleCategory} />

      {/* Tags */}
      <TagsDropdown
        selectedIds={tagIds}
        onToggle={toggleTag}
        onAddNew={addNewTag}
      />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Preview */}
      <button
        onClick={() => window.open(appUrl(`/posts/${post.slug}`), "_blank")}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground border border-border rounded-md hover:text-foreground hover:bg-muted transition-colors"
      >
        <Eye size={13} />
        Preview
      </button>

      {/* Save Draft */}
      {!isPublished && (
        <button
          onClick={() => onSave("DRAFT")}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Save size={13} />
          )}
          Save Draft
        </button>
      )}

      {/* Publish / Update */}
      <button
        onClick={() => onSave(isPublished ? undefined : "PUBLISHED")}
        disabled={isSaving}
        className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
      >
        {isSaving && <Loader2 size={13} className="animate-spin" />}
        {isPublished ? "Update" : "Publish"}
      </button>
    </div>
  );
}
