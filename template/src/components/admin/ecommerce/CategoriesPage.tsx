"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { LayoutList, Pencil, Trash2, ImageOff, ChevronRight } from "lucide-react";
import { Button } from "@/src/ui/button";
import { Badge } from "@/src/ui/badge";
import { TableCell, TableRow } from "@/src/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/ui/alert-dialog";
import { toast } from "@/src/hooks/use-toast";
import { fetchers } from "@/src/lib/fetchers";
import { apiMutations } from "@/src/lib/apimutation";
import { EcomListShell, useDebounced } from "./_shared/EcomListShell";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  _count: { products: number; children: number };
}

interface TreeNode extends Category {
  depth: number;
}

function buildTree(rows: Category[]): TreeNode[] {
  const byParent = new Map<string | null, Category[]>();
  rows.forEach((r) => {
    const key = r.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(r);
  });
  const result: TreeNode[] = [];
  const walk = (parentId: string | null, depth: number) => {
    const kids = byParent.get(parentId) ?? [];
    for (const kid of kids) {
      result.push({ ...kid, depth });
      walk(kid.id, depth + 1);
    }
  };
  walk(null, 0);
  return result;
}

export function CategoriesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search);
  const { data, error, isLoading, mutate } = useSWR("ecom-categories", () =>
    fetchers.productCategories(),
  );
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const rows: Category[] = data?.data?.categories ?? data?.data ?? [];
  const tree = useMemo(() => {
    const filtered = debounced
      ? rows.filter((r) =>
          r.name.toLowerCase().includes(debounced.toLowerCase()) ||
          r.slug.toLowerCase().includes(debounced.toLowerCase()),
        )
      : rows;
    // If searching, don't try to draw a tree — just render flat.
    return debounced
      ? filtered.map((r) => ({ ...r, depth: 0 }))
      : buildTree(filtered);
  }, [rows, debounced]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiMutations.deleteProductCategory(deleteTarget.id);
      toast({ title: "Category deleted" });
      setDeleteTarget(null);
      await mutate();
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err?.message || "Try again",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <EcomListShell
        testId="categories-page"
        title="Categories"
        description="Organize your catalog with a nested category tree."
        icon={<LayoutList className="h-4 w-4 text-primary" />}
        addButtonLabel="Add category"
        onAddClick={() => router.push("/admin/ecommerce/categories/new")}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search categories…"
        columns={[
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug", className: "w-[200px]" },
          { key: "products", label: "Products", className: "w-[110px] text-right" },
          { key: "children", label: "Sub-cat.", className: "w-[110px] text-right" },
          { key: "actions", label: "", className: "w-[110px] text-right" },
        ]}
        rows={tree}
        renderRow={(row) => {
          const c = row as TreeNode;
          return (
            <TableRow key={c.id} data-testid={`category-row-${c.id}`}>
              <TableCell>
                <div className="flex items-center gap-2" style={{ paddingLeft: c.depth * 20 }}>
                  {c.depth > 0 && (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="h-8 w-8 rounded bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                    {c.image ? (
                      <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <ImageOff className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <button
                    onClick={() => router.push(`/admin/ecommerce/categories/${c.id}/edit`)}
                    className="font-medium text-sm hover:underline text-left"
                  >
                    {c.name}
                  </button>
                </div>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground font-mono">{c.slug}</TableCell>
              <TableCell className="text-right text-sm tabular-nums">{c._count?.products ?? 0}</TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {c._count?.children ? <Badge variant="secondary">{c._count.children}</Badge> : "—"}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => router.push(`/admin/ecommerce/categories/${c.id}/edit`)}
                    data-testid={`category-edit-btn-${c.id}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTarget(c)}
                    data-testid={`category-delete-btn-${c.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        }}
        isLoading={isLoading}
        error={error}
        onRetry={() => mutate()}
        emptyTitle="No categories yet"
        emptyDescription="Add your first category to get started."
        total={tree.length}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <span className="font-medium">&ldquo;{deleteTarget?.name}&rdquo;</span>? This cannot be undone.
              {deleteTarget && (deleteTarget._count.children > 0 || deleteTarget._count.products > 0) && (
                <div className="mt-3 rounded-md bg-amber-500/10 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                  Heads up: this category has {deleteTarget._count.children} sub-categories and {deleteTarget._count.products} products. Delete will be blocked by the API.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default CategoriesPage;
