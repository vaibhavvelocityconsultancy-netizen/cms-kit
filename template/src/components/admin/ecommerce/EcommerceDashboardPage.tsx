"use client";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Package,
  Receipt,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/ui/card";
import { Badge } from "@/src/ui/badge";
import { Button } from "@/src/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/ui/table";
import { fetchers } from "@/src/lib/fetchers";
import { useEcomSettings } from "@/src/lib/ecom/useEcomSettings";
import { formatMoney, formatDate } from "@/src/lib/ecom/format";

interface DashboardStats {
  revenueThisMonth: number | string;
  revenueDelta?: number; // percentage vs previous period
  orderCount: number;
  orderCountDelta?: number;
  pendingOrders: number;
  lowStockCount: number;
  recentOrders: any[];
  topProducts: {
    id: string;
    title: string;
    orderCount: number;
    revenue?: number | string;
    thumbnail?: string;
  }[];
}

function statusColor(s: string) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-500/15 text-amber-700 border-amber-200",
    PAID: "bg-green-500/15 text-green-700 border-green-200",
    DELIVERED: "bg-green-500/15 text-green-700 border-green-200",
    SHIPPED: "bg-indigo-500/15 text-indigo-700 border-indigo-200",
    CANCELLED: "bg-red-500/15 text-red-700 border-red-200",
    PROCESSING: "bg-blue-500/15 text-blue-700 border-blue-200",
  };
  return map[s] ?? "bg-muted text-muted-foreground";
}

function StatCard({
  label,
  value,
  delta,
  icon,
  accent,
  onClick,
  testId,
}: {
  label: string;
  value: React.ReactNode;
  delta?: number | null;
  icon: React.ReactNode;
  accent: string;
  onClick?: () => void;
  testId?: string;
}) {
  return (
    <Card
      className={onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
      onClick={onClick}
      data-testid={testId}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-2">
          <div className={`p-2 rounded-md ${accent}`}>{icon}</div>
          {delta != null && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                delta >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {delta >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

export function EcommerceDashboardPage() {
  const router = useRouter();
  const { settings } = useEcomSettings();
  const { data, isLoading, error, mutate } = useSWR("ecom-dashboard", () =>
    fetchers.ecomDashboard(),
  );
  const stats: DashboardStats = data?.data ?? {
    revenueThisMonth: 0,
    orderCount: 0,
    pendingOrders: 0,
    lowStockCount: 0,
    recentOrders: [],
    topProducts: [],
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading dashboard…
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <p className="text-destructive font-medium mb-2">Failed to load dashboard</p>
        <Button variant="outline" onClick={() => mutate()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4" data-testid="ecom-dashboard-page">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-md bg-primary/10">
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">E-commerce dashboard</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Overview of sales, orders and inventory this month.
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Revenue this month"
          value={formatMoney(stats.revenueThisMonth, settings.currency)}
          delta={stats.revenueDelta}
          icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
          accent="bg-emerald-500/10"
          testId="stat-revenue"
        />
        <StatCard
          label="Orders"
          value={stats.orderCount}
          delta={stats.orderCountDelta}
          icon={<Receipt className="h-4 w-4 text-blue-600" />}
          accent="bg-blue-500/10"
          onClick={() => router.push("/admin/ecommerce/orders")}
          testId="stat-orders"
        />
        <StatCard
          label="Pending orders"
          value={stats.pendingOrders}
          icon={<TrendingUp className="h-4 w-4 text-amber-600" />}
          accent="bg-amber-500/10"
          onClick={() => router.push("/admin/ecommerce/orders?status=PENDING")}
          testId="stat-pending"
        />
        <StatCard
          label="Low stock products"
          value={stats.lowStockCount}
          icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
          accent="bg-red-500/10"
          onClick={() => router.push("/admin/ecommerce/products")}
          testId="stat-lowstock"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent orders</CardTitle>
                <CardDescription className="text-xs">Last {stats.recentOrders?.length ?? 0} orders</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push("/admin/ecommerce/orders")}>
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(stats.recentOrders ?? []).length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">No orders yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[110px] text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stats.recentOrders ?? []).map((o: any) => (
                    <TableRow key={o.id} className="cursor-pointer hover:bg-muted/40"
                      onClick={() => router.push(`/admin/ecommerce/orders/${o.id}`)}>
                      <TableCell className="font-mono text-sm">{o.orderNumber}</TableCell>
                      <TableCell className="text-xs">{formatDate(o.createdAt)}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs py-0 ${statusColor(o.status)}`} variant="outline">
                          {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {formatMoney(o.total, o.currency || settings.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top products</CardTitle>
            <CardDescription className="text-xs">By orders this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats.topProducts ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No sales yet.</p>
            ) : (
              (stats.topProducts ?? []).map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => router.push(`/admin/ecommerce/products/${p.id}/edit`)}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 text-left"
                  data-testid={`top-product-${p.id}`}
                >
                  <span className="text-xs font-bold text-muted-foreground w-4">
                    {i + 1}
                  </span>
                  <div className="h-9 w-9 rounded bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.orderCount} order{p.orderCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {p.revenue != null && (
                    <span className="text-xs font-medium tabular-nums">
                      {formatMoney(p.revenue, settings.currency)}
                    </span>
                  )}
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default EcommerceDashboardPage;
