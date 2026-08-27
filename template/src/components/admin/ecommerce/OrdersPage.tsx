"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Receipt, Eye } from "lucide-react";
import { Button } from "@/src/ui/button";
import { Badge } from "@/src/ui/badge";
import { Input } from "@/src/ui/input";
import { TableCell, TableRow } from "@/src/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/ui/select";
import { EcomListShell, useDebounced } from "./_shared/EcomListShell";
import { useEcomSettings } from "@/src/lib/ecom/useEcomSettings";
import { formatMoney, formatDate } from "@/src/lib/ecom/format";
import { orderService } from "@/src/services/OrderServices";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number | string;
  currency: string;
  createdAt: string;
  user?: { id: number; name?: string; email?: string } | null;
  shippingAddress?: any;
}

const ORDER_STATUSES = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIAL"];

function statusColor(s: string) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-500/15 text-amber-700 border-amber-200",
    PAID: "bg-green-500/15 text-green-700 border-green-200",
    PROCESSING: "bg-blue-500/15 text-blue-700 border-blue-200",
    SHIPPED: "bg-indigo-500/15 text-indigo-700 border-indigo-200",
    DELIVERED: "bg-green-500/15 text-green-700 border-green-200",
    CANCELLED: "bg-red-500/15 text-red-700 border-red-200",
    REFUNDED: "bg-muted text-muted-foreground",
    FAILED: "bg-red-500/15 text-red-700 border-red-200",
    PARTIAL: "bg-purple-500/15 text-purple-700 border-purple-200",
  };
  return map[s] ?? "bg-muted text-muted-foreground";
}

export function OrdersPage() {
  const router = useRouter();
  const { settings } = useEcomSettings();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [paymentStatus, setPaymentStatus] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);

  useEffect(() => setPage(1), [debounced, status, paymentStatus, from, to]);

  const { data, error, isLoading, mutate } = useSWR(
    ["ecom-orders", debounced, status, paymentStatus, from, to, page].join("|"),
    () =>
      orderService.getAll({
        search: debounced || undefined,
        status: status === "ALL" ? undefined : status,
        paymentStatus: paymentStatus === "ALL" ? undefined : paymentStatus,
        from: from || undefined,
        to: to || undefined,
        page,
        limit: 10,
      }),
  );

  const rows: Order[] = data?.data?.orders ?? [];
  const pagination = data?.data?.pagination ?? { page, limit: 10, total: 0, totalPages: 1 };

  function customerName(o: Order) {
    return o.user?.name || o.shippingAddress?.fullName || o.user?.email || "Guest";
  }

  return (
    <EcomListShell
      testId="orders-page"
      title="Orders"
      description="Track and fulfil customer orders."
      icon={<Receipt className="h-4 w-4 text-primary" />}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search order # or customer…"
      filters={
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-[150px]" data-testid="orders-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={paymentStatus} onValueChange={setPaymentStatus}>
            <SelectTrigger className="sm:w-[150px]" data-testid="orders-payment-filter">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All payments</SelectItem>
              {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="sm:w-[150px]" aria-label="From date" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="sm:w-[150px]" aria-label="To date" />
        </div>
      }
      columns={[
        { key: "orderNumber", label: "Order #" },
        { key: "customer", label: "Customer" },
        { key: "date", label: "Date", className: "w-[130px]" },
        { key: "status", label: "Status", className: "w-[120px]" },
        { key: "payment", label: "Payment", className: "w-[110px]" },
        { key: "total", label: "Total", className: "w-[110px] text-right" },
        { key: "actions", label: "", className: "w-[80px] text-right" },
      ]}
      rows={rows}
      renderRow={(row) => {
        const o = row as Order;
        return (
          <TableRow key={o.id} data-testid={`order-row-${o.id}`}>
            <TableCell>
              <button
                onClick={() => router.push(`/admin/ecommerce/orders/${o.id}`)}
                className="font-mono text-sm font-medium hover:underline text-left"
              >
                {o.orderNumber}
              </button>
            </TableCell>
            <TableCell className="text-sm">{customerName(o)}</TableCell>
            <TableCell className="text-xs">{formatDate(o.createdAt)}</TableCell>
            <TableCell>
              <Badge className={`text-xs py-0 ${statusColor(o.status)}`} variant="outline">
                {o.status}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={`text-xs py-0 ${statusColor(o.paymentStatus)}`} variant="outline">
                {o.paymentStatus}
              </Badge>
            </TableCell>
            <TableCell className="text-right text-sm tabular-nums font-medium">
              {formatMoney(o.total, o.currency || settings.currency)}
            </TableCell>
            <TableCell>
              <div className="flex justify-end">
                <Button
                  variant="ghost" size="sm" className="h-8 w-8 p-0"
                  onClick={() => router.push(`/admin/ecommerce/orders/${o.id}`)}
                  data-testid={`order-view-btn-${o.id}`}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        );
      }}
      isLoading={isLoading}
      error={error}
      onRetry={() => mutate()}
      emptyTitle="No orders yet"
      emptyDescription="Orders will appear here once customers check out."
      total={pagination.total}
      page={pagination.page}
      totalPages={pagination.totalPages}
      limit={pagination.limit}
      onPageChange={setPage}
      activeFilterCount={
        (debounced ? 1 : 0) +
        (status !== "ALL" ? 1 : 0) +
        (paymentStatus !== "ALL" ? 1 : 0) +
        (from ? 1 : 0) +
        (to ? 1 : 0)
      }
    />
  );
}

export default OrdersPage;
