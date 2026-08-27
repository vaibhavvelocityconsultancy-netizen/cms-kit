"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiMutations } from "@/src/lib/apimutation";
import { fetchers } from "@/src/lib/fetchers";
// import { DataTable, type Column } from ".src/components/data-table";
import { Button } from "@/src/ui/button";
import { Badge } from "@/src/ui/badge";
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/ui/dialog";
import { toast } from "@/src/hooks/use-toast";
import { Column, DataTable } from "@/src/ui/data-table";

type FileCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  parent?: { id: string; name: string } | null;
  _count?: { files: number; children: number } | null;
};

type FileCategoryTreeNode = FileCategory & {
  children: FileCategoryTreeNode[];
};

type CategoryFormPayload = {
  name: string;
  slug?: string;
  description: string | null;
  parentId: string | null;
};

// ─────────────────────────────────────────────────────────────
// Category Form Component (Modal)
// ─────────────────────────────────────────────────────────────

function CategoryFormModal({
  open,
  onOpenChange,
  initial,
  parentOptions,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: FileCategory | null;
  parentOptions: CategoryOption[];
  onSubmit: (payload: CategoryFormPayload) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [parentId, setParentId] = useState(initial?.parentId ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    setName(initial?.name ?? "");
    setSlug(initial?.slug ?? "");
    setDescription(initial?.description ?? "");
    setParentId(initial?.parentId ?? "");
    setError("");
  }, [initial]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    onSubmit({
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || null,
      parentId: parentId || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Category" : "Create New Category"}
          </DialogTitle>
          <DialogDescription>
            {initial
              ? "Update the category details below."
              : "Add a new category to organize your files."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Invoices"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-400/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Slug{" "}
              <span className="text-slate-400 text-xs font-normal">
                (optional)
              </span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="invoices"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-400/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Parent Category{" "}
              <span className="text-slate-400 text-xs font-normal">
                (optional)
              </span>
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-400/20"
            >
              <option value="">— None (top level) —</option>
              {parentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Description{" "}
              <span className="text-slate-400 text-xs font-normal">
                (optional)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of this category"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-400/20 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2.5 border border-red-200">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-slate-900 hover:bg-slate-800"
            >
              {isSaving
                ? "Saving..."
                : initial
                  ? "Save Changes"
                  : "Create Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function FileCategoryManager() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FileCategory | null>(
    null,
  );
  const [formError, setFormError] = useState("");

  // ── Queries ──
  const { data, isLoading, isError } = useQuery<FileCategory[]>({
    queryKey: ["fileCategories"],
    queryFn: async () => {
      const res = await fetchers.fileCategories();
      return res.data as FileCategory[];
    },
  });

  const categories = data ?? [];
  const tree = useMemo(() => buildTree(categories), [categories]);

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (payload: CategoryFormPayload) =>
      apiMutations.createFileCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fileCategories"] });
      setFormOpen(false);
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: (err: unknown) => {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CategoryFormPayload;
    }) => apiMutations.updateFileCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fileCategories"] });
      setEditingCategory(null);
      setFormOpen(false);
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    },
    onError: (err: unknown) => {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiMutations.deleteFileCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fileCategories"] });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  // ── Handlers ──
  const handleEdit = async (category: FileCategory) => {
    try {
      const res = await fetchers.fileCategory(category.id);
      setEditingCategory(res.data as FileCategory);
      setFormOpen(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load category";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = (category: FileCategory) => {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(category.id);
  };

  const handleCreate = (payload: CategoryFormPayload) => {
    setFormError("");
    createMutation.mutate(payload);
  };

  const handleUpdate = (payload: CategoryFormPayload) => {
    setFormError("");
    if (!editingCategory) return;
    updateMutation.mutate({ id: editingCategory.id, payload });
  };

  // ── DataTable Columns ──
  const columns: Column<FileCategoryTreeNode>[] = [
    {
      key: "name",
      header: "Category Name",

      cell: (row) => (
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-900">{row.name}</span>
          {row.parentId && (
            <Badge variant="outline" className="text-xs bg-slate-50">
              Subcategory
            </Badge>
          )}
        </div>
      ),
      filterable: true,
      filterValue: (row) => row.name,
    },
    {
      key: "slug",
      header: "Slug",
      cell: (row) => (
        <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
          {row.slug}
        </code>
      ),
      filterable: true,
      filterValue: (row) => row.slug,
    },
    {
      key: "description",
      header: "Description",
      cell: (row) => (
        <span className="text-sm text-slate-500 line-clamp-1">
          {row.description || "—"}
        </span>
      ),
      filterable: true,
      filterValue: (row) => row.description || "",
    },
    {
      key: "files",
      header: "Files",
      cell: (row) => (
        <Badge variant="secondary" className="gap-1">
          <FileText className="h-3 w-3" />
          {row._count?.files ?? 0}
        </Badge>
      ),
    },
    {
      key: "children",
      header: "Subcategories",
      cell: (row) => (
        <Badge variant="secondary" className="gap-1">
          <FolderTree className="h-3 w-3" />
          {row._count?.children ?? 0}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      hideable: false,
    },
  ];

  // ── Flatten tree for table display ──
  const flattenTree = (
    nodes: FileCategoryTreeNode[],
    depth = 0,
  ): FileCategoryTreeNode[] => {
    let result: FileCategoryTreeNode[] = [];
    for (const node of nodes) {
      // Add the current node with depth info
      result.push({
        ...node,
        // Add a display name with indentation
        name: `${"  ".repeat(depth)}${node.name}`,
      });
      // Recursively add children
      result = result.concat(flattenTree(node.children, depth + 1));
    }
    return result;
  };

  const flatData = useMemo(() => flattenTree(tree), [tree]);

  // ── Parent options ──
  const parentOptions = useMemo(() => flattenForSelect(tree), [tree]);

  return (
    <div className="w-full p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            File Categories
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize uploaded files into categories and subcategories.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCategory(null);
            setFormOpen(true);
          }}
          className="gap-2 rounded-xl bg-slate-900 hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          New Category
        </Button>
      </div>

      {/* DataTable */}
      <DataTable
        data={flatData}
        columns={columns}
        searchPlaceholder="Search categories..."
        searchKeys={["name", "slug", "description"]}
        pageSize={10}
        pageSizeOptions={[10, 25, 50]}
        emptyMessage={
          isLoading
            ? "Loading categories..."
            : "No categories found. Create your first category above."
        }
      />

      {/* Category Form Modal */}
      <CategoryFormModal
        key={editingCategory?.id ?? "new"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditingCategory(null);
            setFormError("");
          }
        }}
        initial={editingCategory}
        parentOptions={parentOptions}
        onSubmit={editingCategory ? handleUpdate : handleCreate}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

function buildTree(categories: FileCategory[]): FileCategoryTreeNode[] {
  const map = new Map<string, FileCategoryTreeNode>(
    categories.map((c) => [c.id, { ...c, children: [] }]),
  );
  const roots: FileCategoryTreeNode[] = [];

  for (const cat of map.values()) {
    // If it has a parent and that parent exists in the map
    if (cat.parentId && map.has(cat.parentId)) {
      const parent = map.get(cat.parentId);
      if (parent) {
        parent.children.push(cat);
      }
      // Don't push to roots - it's a child
    } else {
      // No parent or parent doesn't exist in the map -> it's a root
      roots.push(cat);
    }
  }

  return roots;
}

type CategoryOption = {
  id: string;
  label: string;
};

function flattenForSelect(
  nodes: FileCategoryTreeNode[],
  depth = 0,
  excludeId: string | null = null,
  out: CategoryOption[] = [],
): CategoryOption[] {
  for (const node of nodes) {
    if (node.id !== excludeId) {
      out.push({ id: node.id, label: `${"— ".repeat(depth)}${node.name}` });
    }
    flattenForSelect(node.children, depth + 1, excludeId, out);
  }
  return out;
}
