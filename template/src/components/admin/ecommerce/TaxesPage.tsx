"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Percent, Pencil, Trash2 } from "lucide-react";
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
import { EcomListShell } from "./_shared/EcomListShell";

interface TaxClass {
  id: string;
  name: string;
  rates: any[];
  _count?: { rates: number };
}

export function TaxesPage() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR("ecom-tax-classes", () => fetchers.taxClasses());
  const [deleteTarget, setDeleteTarget] = useState<TaxClass | null>(null);
  const [deleting, setDeleting] = useState(false);
  const rows: TaxClass[] = data?.data?.taxClasses ?? [];

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiMutations.deleteTaxClass(deleteTarget.id);
      toast({ title: "Tax class deleted" });
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
        testId="taxes-page"
        title="Tax classes"
        description="Configure tax rates by country and state."
        icon={<Percent className="h-4 w-4 text-primary" />}
        addButtonLabel="Add tax class"
        onAddClick={() => router.push("/admin/ecommerce/taxes/new")}
        columns={[
          { key: "name", label: "Name" },
          { key: "rates", label: "Rates", className: "w-[100px] text-right" },
          { key: "actions", label: "", className: "w-[110px] text-right" },
        ]}
        rows={rows}
        renderRow={(row) => {
          const t = row as TaxClass;
          return (
            <TableRow key={t.id} data-testid={`tax-row-${t.id}`}>
              <TableCell>
                <button
                  onClick={() => router.push(`/admin/ecommerce/taxes/${t.id}/edit`)}
                  className="font-medium text-sm hover:underline text-left"
                >
                  {t.name}
                </button>
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {t._count?.rates ?? t.rates?.length ?? 0}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                    onClick={() => router.push(`/admin/ecommerce/taxes/${t.id}/edit`)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTarget(t)}
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
        emptyTitle="No tax classes yet"
        emptyDescription="Add your first tax class."
        total={rows.length}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tax class?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <span className="font-medium">&ldquo;{deleteTarget?.name}&rdquo;</span> and all its rates?
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

export default TaxesPage;
