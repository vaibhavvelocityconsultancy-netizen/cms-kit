"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Eye } from "lucide-react";
import { Button } from "@/src/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/src/ui/select";
import { fetchers } from "@/src/lib/fetchers";
import { formatDate } from "@/src/lib/ecom/format";
import { DataTable, Column } from "@/src/ui/data-table";
// import { DataTable, Column } from "@/src/ui/DataTable"; // adjust path

interface Customer {
  id: number;
  name?: string | null;
  email: string;
  createdAt: string;
  ordersCount: number;
  enrollmentsCount: number;
  plansCount: number;
}

const FILTERS = [
  { value: "all", label: "All Customers" },
  { value: "products", label: "Products" },
  { value: "courses", label: "Courses" },
  { value: "plans", label: "Plans" },
];

export function CustomersPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("all");

  const { data, error, isLoading } = useSWR(["customers", filter].join("|"), () =>
    fetchers.customersList({ filter, page: 1, pageSize: 1000 }),
  );

  const rows: Customer[] = data?.data?.customers ?? [];

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Customer",
      cell: (row) => (
        <button
          onClick={() => router.push(`/admin/customers/${row.id}`)}
          className="font-medium text-sm hover:underline text-left"
        >
          {row.name || "—"}
        </button>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (row) => <span className="text-muted-foreground">{row.email}</span>,
    },
    {
      key: "orders",
      header: "Orders",
      className: "text-right",
      cell: (row) => <span className="tabular-nums">{row.ordersCount}</span>,
      filterValue: (row) => String(row.ordersCount),
    },
    {
      key: "courses",
      header: "Courses",
      className: "text-right",
      cell: (row) => <span className="tabular-nums">{row.enrollmentsCount}</span>,
      filterValue: (row) => String(row.enrollmentsCount),
    },
    {
      key: "plans",
      header: "Plans",
      className: "text-right",
      cell: (row) => <span className="tabular-nums">{row.plansCount}</span>,
      filterValue: (row) => String(row.plansCount),
    },
    {
      key: "joined",
      header: "Joined",
      cell: (row) => <span className="text-xs">{formatDate(row.createdAt)}</span>,
      filterValue: (row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      header: "",
      className: "w-[60px] text-right",
      filterable: false,
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => router.push(`/admin/ecommerce/customers/${row.id}`)}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return <div className="max-w-6xl mx-auto py-8 px-4 text-sm text-muted-foreground">Loading customers…</div>;
  }

  if (error) {
    return <div className="max-w-6xl mx-auto py-8 px-4 text-sm text-destructive">Failed to load customers.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Everyone who has purchased a product, course, or plan.
        </p>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search by name or email…"
        searchKeys={["name", "email"]}
        emptyMessage="No customers yet."
        getRowId={(row) => row.id}
        toolbarActions={
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}

export default CustomersPage;