"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Truck, Pencil, Trash2 } from "lucide-react";
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
import { EcomListShell } from "./_shared/EcomListShell";

interface Zone {
  id: string;
  name: string;
  countries: string[];
  rates: any[];
  _count?: { rates: number };
}

export function ShippingPage() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR("ecom-shipping-zones", () =>
    fetchers.shippingZones(),
  );
  const [deleteTarget, setDeleteTarget] = useState<Zone | null>(null);
  const [deleting, setDeleting] = useState(false);
  const rows: Zone[] = data?.data?.zones ?? [];

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiMutations.deleteShippingZone(deleteTarget.id);
      toast({ title: "Zone deleted" });
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
        testId="shipping-page"
        title="Shipping zones"
        description="Group countries into zones and set delivery rates for each."
        icon={<Truck className="h-4 w-4 text-primary" />}
        addButtonLabel="Add zone"
        onAddClick={() => router.push("/admin/ecommerce/shipping/new")}
        columns={[
          { key: "name", label: "Zone" },
          { key: "countries", label: "Countries" },
          { key: "rates", label: "Rates", className: "w-[100px] text-right" },
          { key: "actions", label: "", className: "w-[110px] text-right" },
        ]}
        rows={rows}
        renderRow={(row) => {
          const z = row as Zone;
          return (
            <TableRow key={z.id} data-testid={`zone-row-${z.id}`}>
              <TableCell>
                <button
                  onClick={() => router.push(`/admin/ecommerce/shipping/${z.id}/edit`)}
                  className="font-medium text-sm hover:underline text-left"
                >
                  {z.name}
                </button>
              </TableCell>
              <TableCell className="text-xs">
                <div className="flex flex-wrap gap-1">
                  {(z.countries ?? []).slice(0, 4).map((c) => (
                    <Badge key={c} variant="secondary" className="text-[10px]">
                      {c}
                    </Badge>
                  ))}
                  {(z.countries?.length ?? 0) > 4 && (
                    <span className="text-muted-foreground">+{z.countries.length - 4}</span>
                  )}
                  {(!z.countries || z.countries.length === 0) && (
                    <span className="text-muted-foreground">Any</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {z._count?.rates ?? z.rates?.length ?? 0}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => router.push(`/admin/ecommerce/shipping/${z.id}/edit`)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTarget(z)}
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
        emptyTitle="No shipping zones yet"
        emptyDescription="Add your first zone."
        total={rows.length}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete zone?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <span className="font-medium">&ldquo;{deleteTarget?.name}&rdquo;</span> and all its rates? This cannot be undone.
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

export default ShippingPage;
