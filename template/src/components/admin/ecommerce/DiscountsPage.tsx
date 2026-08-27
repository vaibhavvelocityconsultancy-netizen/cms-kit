"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Percent, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/src/ui/button";
import { Badge } from "@/src/ui/badge";
import { TableCell, TableRow } from "@/src/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/ui/select";
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
import { useEcomSettings } from "@/src/lib/ecom/useEcomSettings";
import { formatMoney, formatDate } from "@/src/lib/ecom/format";

interface Coupon {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number | string;
  minOrderValue: number | string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
}

function statusOf(c: Coupon): "Active" | "Expired" | "Inactive" | "Scheduled" {
  const now = new Date();
  if (!c.isActive) return "Inactive";
  if (c.startsAt && new Date(c.startsAt) > now) return "Scheduled";
  if (c.expiresAt && new Date(c.expiresAt) < now) return "Expired";
  return "Active";
}

export function DiscountsPage() {
  const router = useRouter();
  const { settings } = useEcomSettings();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);

  useEffect(() => setPage(1), [debounced, status]);

  const { data, error, isLoading, mutate } = useSWR(
    ["ecom-coupons", debounced, status, page].join("|"),
    () =>
      fetchers.coupons({
        search: debounced || undefined,
        status: status === "ALL" ? undefined : status.toLowerCase(),
        page,
        limit: 10,
      }),
  );
  const rows: Coupon[] = data?.data?.coupons ?? [];
  const pagination = data?.data?.pagination ?? { page, limit: 10, total: 0, totalPages: 1 };

  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiMutations.deleteCoupon(deleteTarget.id);
      toast({ title: "Coupon deleted" });
      setDeleteTarget(null);
      await mutate();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  const badgeClass = (s: string) =>
    ({
      Active: "bg-green-500/15 text-green-700 border-green-200",
      Expired: "bg-muted text-muted-foreground",
      Inactive: "bg-amber-500/15 text-amber-700 border-amber-200",
      Scheduled: "bg-blue-500/15 text-blue-700 border-blue-200",
    })[s] ?? "";

  return (
    <>
      <EcomListShell
        testId="discounts-page"
        title="Discounts"
        description="Create coupon codes to run promotions."
        icon={<Percent className="h-4 w-4 text-primary" />}
        addButtonLabel="Add discount"
        onAddClick={() => router.push("/admin/ecommerce/discounts/new")}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by code…"
        filters={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="EXPIRED">Expired / inactive</SelectItem>
            </SelectContent>
          </Select>
        }
        columns={[
          { key: "code", label: "Code" },
          { key: "type", label: "Type", className: "w-[110px]" },
          { key: "value", label: "Value", className: "w-[110px] text-right" },
          { key: "usage", label: "Usage", className: "w-[100px] text-right" },
          { key: "expires", label: "Expires", className: "w-[140px]" },
          { key: "status", label: "Status", className: "w-[110px]" },
          { key: "actions", label: "", className: "w-[110px] text-right" },
        ]}
        rows={rows}
        renderRow={(row) => {
          const c = row as Coupon;
          const s = statusOf(c);
          return (
            <TableRow key={c.id} data-testid={`discount-row-${c.id}`}>
              <TableCell>
                <button
                  onClick={() => router.push(`/admin/ecommerce/discounts/${c.id}/edit`)}
                  className="font-mono text-sm font-medium hover:underline text-left"
                >
                  {c.code}
                </button>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {c.type === "PERCENTAGE" ? "Percent" : "Fixed"}
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {c.type === "PERCENTAGE"
                  ? `${Number(c.value)}%`
                  : formatMoney(c.value, settings.currency)}
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {c.usedCount}
                {c.maxUses != null && ` / ${c.maxUses}`}
              </TableCell>
              <TableCell className="text-xs">{formatDate(c.expiresAt)}</TableCell>
              <TableCell>
                <Badge className={`text-xs py-0 ${badgeClass(s)}`} variant="outline">{s}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                    onClick={() => router.push(`/admin/ecommerce/discounts/${c.id}/edit`)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTarget(c)}
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
        emptyTitle="No discounts yet"
        emptyDescription="Create your first coupon code."
        total={pagination.total}
        page={pagination.page}
        totalPages={pagination.totalPages}
        limit={pagination.limit}
        onPageChange={setPage}
        activeFilterCount={(debounced ? 1 : 0) + (status !== "ALL" ? 1 : 0)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <span className="font-mono font-medium">{deleteTarget?.code}</span>?
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

export default DiscountsPage;
