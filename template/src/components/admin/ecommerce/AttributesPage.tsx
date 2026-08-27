"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { SlidersHorizontal, Pencil, Trash2 } from "lucide-react";
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

interface Attribute {
  id: string;
  name: string;
  slug: string;
  values: { id: string; value: string }[];
  _count?: { values: number };
}

export function AttributesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search);
  const { data, error, isLoading, mutate } = useSWR("ecom-attributes-list", () => fetchers.attributes());
  const [deleteTarget, setDeleteTarget] = useState<Attribute | null>(null);
  const [deleting, setDeleting] = useState(false);
  const rows: Attribute[] = data?.data?.attributes ?? [];
  const filtered = debounced
    ? rows.filter((r) => r.name.toLowerCase().includes(debounced.toLowerCase()))
    : rows;

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiMutations.deleteAttribute(deleteTarget.id);
      toast({ title: "Attribute deleted" });
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
        testId="attributes-page"
        title="Attributes"
        description="Attributes power product variants (e.g. Size, Color)."
        icon={<SlidersHorizontal className="h-4 w-4 text-primary" />}
        addButtonLabel="Add attribute"
        onAddClick={() => router.push("/admin/ecommerce/attributes/new")}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search attributes…"
        columns={[
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug", className: "w-[200px]" },
          { key: "values", label: "Values" },
          { key: "actions", label: "", className: "w-[110px] text-right" },
        ]}
        rows={filtered}
        renderRow={(row) => {
          const a = row as Attribute;
          return (
            <TableRow key={a.id} data-testid={`attribute-row-${a.id}`}>
              <TableCell>
                <button
                  onClick={() => router.push(`/admin/ecommerce/attributes/${a.id}/edit`)}
                  className="font-medium text-sm hover:underline text-left"
                >
                  {a.name}
                </button>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground font-mono">{a.slug}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {(a.values ?? []).slice(0, 6).map((v) => (
                    <Badge key={v.id} variant="secondary" className="text-xs">
                      {v.value}
                    </Badge>
                  ))}
                  {(a.values?.length ?? 0) > 6 && (
                    <span className="text-xs text-muted-foreground">+{a.values.length - 6} more</span>
                  )}
                  {(!a.values || a.values.length === 0) && (
                    <span className="text-xs text-muted-foreground">No values</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => router.push(`/admin/ecommerce/attributes/${a.id}/edit`)}
                    data-testid={`attribute-edit-btn-${a.id}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTarget(a)}
                    data-testid={`attribute-delete-btn-${a.id}`}
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
        emptyTitle="No attributes yet"
        emptyDescription="Add attributes like Size, Color to power variants."
        total={filtered.length}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attribute?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <span className="font-medium">&ldquo;{deleteTarget?.name}&rdquo;</span>?
              All its values will be removed as well. This may affect existing product variants.
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

export default AttributesPage;
