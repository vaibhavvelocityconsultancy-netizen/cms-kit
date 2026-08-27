"use client";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  ArrowLeft,
  User,
  MapPin,
  Loader2,
  Trash2,
  GraduationCap,
  CreditCard,
} from "lucide-react";
import { Button } from "@/src/ui/button";
import { Badge } from "@/src/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/ui/card";
import { fetchers } from "@/src/lib/fetchers";
import { apiMutations } from "@/src/lib/apimutation";
import { formatMoney, formatDate } from "@/src/lib/ecom/format";
import { DataTable } from "@/src/ui/data-table";
// import { DataTable, Column } from "@/src/ui/DataTable"; // adjust path

function statusColor(s: string) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-500/15 text-amber-700 border-amber-200",
    PAID: "bg-green-500/15 text-green-700 border-green-200",
    ACTIVE: "bg-green-500/15 text-green-700 border-green-200",
    DELIVERED: "bg-green-500/15 text-green-700 border-green-200",
    SHIPPED: "bg-indigo-500/15 text-indigo-700 border-indigo-200",
    CANCELLED: "bg-red-500/15 text-red-700 border-red-200",
    EXPIRED: "bg-red-500/15 text-red-700 border-red-200",
  };
  return map[s] ?? "bg-muted text-muted-foreground";
}

export function CustomerDetailPage({
  id,
  userId,
}: {
  id?: string;
  userId?: string | number;
}) {
  const router = useRouter();
  const currency = "INR";
  const customerId = id ?? (userId ? String(userId) : "");
  const { data, isLoading, error, mutate } = useSWR(
    customerId ? `customer-${customerId}` : null,
    () => fetchers.customerDetail(customerId),
  );
  const c = data?.data;

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Delete this order? This cannot be undone.")) return;
    await apiMutations.deleteOrder(orderId);
    mutate();
  };

  const handleDeleteEnrollment = async (enrollmentId: number) => {
    if (!confirm("Remove this enrollment? Customer will lose course access."))
      return;
    await apiMutations.deleteEnrollment(String(enrollmentId));
    mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading customer…
      </div>
    );
  }
  if (error || !c) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <p className="text-destructive font-medium mb-2">Failed to load customer</p>
        <Button variant="outline" onClick={() => mutate()}>Retry</Button>
      </div>
    );
  }

  const orders = c.orders ?? [];
  const enrollments = c.enrollments ?? [];
  const plans = c.subscriptions ?? [];
  const addresses = c.addresses ?? [];

  const ordersSpent = orders.reduce((sum: number, o: any) => sum + Number(o.total ?? 0), 0);
  const coursesSpent = enrollments.reduce(
    (sum: number, e: any) => sum + Number(e.course?.price ?? 0),
    0,
  );
  const totalSpent = ordersSpent + coursesSpent;

  const orderColumns: Column<any>[] = [
    {
      key: "orderNumber",
      header: "Order #",
      cell: (o) => (
        <span
          className="font-mono text-sm cursor-pointer"
          onClick={() => router.push(`/admin/ecommerce/orders/${o.id}`)}
        >
          {o.orderNumber}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (o) => <span className="text-xs">{formatDate(o.createdAt)}</span>,
      filterValue: (o) => formatDate(o.createdAt),
    },
    {
      key: "status",
      header: "Status",
      cell: (o) => (
        <Badge className={`text-xs py-0 ${statusColor(o.status)}`} variant="outline">
          {o.status}
        </Badge>
      ),
      filterValue: (o) => o.status,
    },
    {
      key: "paymentStatus",
      header: "Payment",
      cell: (o) => (
        <Badge className={`text-xs py-0 ${statusColor(o.paymentStatus)}`} variant="outline">
          {o.paymentStatus}
        </Badge>
      ),
      filterValue: (o) => o.paymentStatus,
    },
    {
      key: "total",
      header: "Total",
      className: "text-right",
      cell: (o) => <span className="tabular-nums">{formatMoney(o.total, currency)}</span>,
      filterable: false,
    },
    {
      key: "actions",
      header: "",
      className: "w-[60px] text-right",
      filterable: false,
      cell: (o) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive"
          onClick={() => handleDeleteOrder(o.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  const enrollmentColumns: Column<any>[] = [
    {
      key: "courseTitle",
      header: "Course",
      cell: (e) => <span className="text-sm font-medium">{e.course?.title ?? "—"}</span>,
      filterValue: (e) => e.course?.title ?? "",
    },
    {
      key: "purchasedAt",
      header: "Enrolled",
      cell: (e) => <span className="text-xs">{formatDate(e.purchasedAt)}</span>,
      filterValue: (e) => formatDate(e.purchasedAt),
    },
    {
      key: "billingCycle",
      header: "Billing",
      cell: (e) => (
        <Badge variant="outline" className="text-xs py-0">
          {e.billingCycle}
        </Badge>
      ),
      filterValue: (e) => e.billingCycle,
    },
    {
      key: "price",
      header: "Price",
      className: "text-right",
      cell: (e) => (
        <span className="tabular-nums">{formatMoney(e.course?.price ?? 0, currency)}</span>
      ),
      filterable: false,
    },
    {
      key: "actions",
      header: "",
      className: "w-[60px] text-right",
      filterable: false,
      cell: (e) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive"
          onClick={() => handleDeleteEnrollment(e.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  const planColumns: Column<any>[] = [
    {
      key: "courseTitle",
      header: "Plan",
      cell: (p) => <span className="text-sm font-medium">{p.course?.title ?? "—"}</span>,
      filterValue: (p) => p.course?.title ?? "",
    },
    {
      key: "currentPeriodEnd",
      header: "Renews",
      cell: (p) => <span className="text-xs">{formatDate(p.currentPeriodEnd)}</span>,
      filterValue: (p) => formatDate(p.currentPeriodEnd),
    },
    {
      key: "billingCycle",
      header: "Billing",
      cell: (p) => (
        <Badge variant="outline" className="text-xs py-0">
          {p.billingCycle}
        </Badge>
      ),
      filterValue: (p) => p.billingCycle,
    },
    {
      key: "status",
      header: "Status",
      cell: (p) => (
        <Badge className={`text-xs py-0 ${statusColor(p.status)}`} variant="outline">
          {p.status}
        </Badge>
      ),
      filterValue: (p) => p.status,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4" data-testid="customer-detail-page">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-2 gap-1.5 text-muted-foreground -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to customers
      </Button>
      <div className="flex items-center gap-2 mb-6">
        <div className="p-1.5 rounded-md bg-primary/10">
          <User className="h-4 w-4 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">{c.name || "Customer"}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium truncate">{c.email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Orders</p>
            <p className="text-2xl font-bold tabular-nums">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Courses</p>
            <p className="text-2xl font-bold tabular-nums">{enrollments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total spent</p>
            <p className="text-2xl font-bold tabular-nums">{formatMoney(totalSpent, currency)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders */}
      {orders.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Order history</CardTitle>
            <CardDescription className="text-xs">
              {orders.length} order{orders.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={orders}
              columns={orderColumns}
              searchKeys={["orderNumber"]}
              searchPlaceholder="Search orders…"
              getRowId={(o) => o.id}
              pageSize={5}
              pageSizeOptions={[5, 10, 25]}
              emptyMessage="No orders yet."
            />
          </CardContent>
        </Card>
      )}

      {/* Courses */}
      {enrollments.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Course enrollments</CardTitle>
            </div>
            <CardDescription className="text-xs">
              {enrollments.length} enrollment{enrollments.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={enrollments}
              columns={enrollmentColumns}
              getRowId={(e) => e.id}
              pageSize={5}
              pageSizeOptions={[5, 10, 25]}
              emptyMessage="No course enrollments yet."
            />
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      {plans.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Plans</CardTitle>
            </div>
            <CardDescription className="text-xs">
              {plans.length} plan{plans.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={plans}
              columns={planColumns}
              getRowId={(p) => p.id}
              pageSize={5}
              pageSizeOptions={[5, 10, 25]}
              emptyMessage="No active plans."
            />
          </CardContent>
        </Card>
      )}

      {/* Addresses — unchanged, DataTable doesn't fit a card-grid layout */}
      {addresses.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Saved addresses</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {addresses.map((a: any) => (
                <div key={a.id} className="rounded-md border p-3 space-y-0.5 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-[10px] py-0">{a.type}</Badge>
                    {a.isDefault && (
                      <Badge className="text-[10px] py-0 bg-primary/10 text-primary" variant="outline">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium">{a.fullName}</p>
                  <p>{a.addressLine1}</p>
                  {a.addressLine2 && <p>{a.addressLine2}</p>}
                  <p>{[a.city, a.state, a.postalCode].filter(Boolean).join(", ")}</p>
                  <p>{a.country}</p>
                  {a.phone && <p className="text-xs text-muted-foreground pt-1">📞 {a.phone}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CustomerDetailPage;