"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Tag, Pencil, Trash2, ImageOff } from "lucide-react";
import { Button } from "@/src/ui/button";
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

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  _count: { products: number };
}

export function BrandsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search);
  const { data, error, isLoading, mutate } = useSWR("ecom-brands-list", () => fetchers.brands());
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);
  const rows: Brand[] = data?.data?.brands ?? [];
  const filtered = debounced
    ? rows.filter((r) => r.name.toLowerCase().includes(debounced.toLowerCase()))
    : rows;

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiMutations.deleteBrand(deleteTarget.id);
      toast({ title: "Brand deleted" });
      setDeleteTarget(null);
      await mutate();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <EcomListShell
        testId="brands-page"
        title="Brands"
        description="Manage manufacturers and vendors."
        icon={<Tag className="h-4 w-4 text-primary" />}
        addButtonLabel="Add brand"
        onAddClick={() => router.push("/admin/ecommerce/brands/new")}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search brands…"
        columns={[
          { key: "logo", label: "Logo", className: "w-[80px]" },
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug", className: "w-[200px]" },
          { key: "products", label: "Products", className: "w-[120px] text-right" },
          { key: "actions", label: "", className: "w-[110px] text-right" },
        ]}
        rows={filtered}
        renderRow={(row) => {
          const b = row as Brand;
          return (
            <TableRow key={b.id} data-testid={`brand-row-${b.id}`}>
              <TableCell>
                <div className="h-10 w-10 rounded bg-muted overflow-hidden flex items-center justify-center">
                  {b.logo ? (
                    <img src={b.logo} alt={b.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImageOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <button
                  onClick={() => router.push(`/admin/ecommerce/brands/${b.id}/edit`)}
                  className="font-medium text-sm hover:underline text-left"
                >
                  {b.name}
                </button>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground font-mono">{b.slug}</TableCell>
              <TableCell className="text-right text-sm tabular-nums">{b._count?.products ?? 0}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => router.push(`/admin/ecommerce/brands/${b.id}/edit`)}
                    data-testid={`brand-edit-btn-${b.id}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTarget(b)}
                    data-testid={`brand-delete-btn-${b.id}`}
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
        emptyTitle="No brands yet"
        emptyDescription="Add your first brand."
        total={filtered.length}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete brand?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <span className="font-medium">&ldquo;{deleteTarget?.name}&rdquo;</span>? This cannot be undone.
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

export default BrandsPage;
