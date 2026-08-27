"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/src/ui/button";
import { Badge } from "@/src/ui/badge";
import { DataTable, Column } from "@/src/ui/data-table";
import UserDetailsModal from "@/src/components/admin/userDetailsModel";

interface SubscriberRow {
  id: number;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  plan: {
    title: string;
    status: "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELED" | null;
    billingCycle: string | null;
    startsAt: string | null;
    canceledAt: string | null;
    currentPeriodEnd: string | null;
    trialEndsAt: string | null;
  } | null;
  uploadedFilesCount: number;
}

function statusVariant(status: string | null) {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "TRIAL":
      return "secondary";
    case "EXPIRED":
    case "CANCELED":
      return "destructive";
    default:
      return "outline";
  }
}

function formatDate(date: string | null) {
  if (!date) return "—";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

import { getBaseUrl } from "@/src/lib/config";

export default function AdminUsersPage() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const { data: users, isLoading } = useQuery<SubscriberRow[]>({
    queryKey: ["admin-users"],

    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/subscription-user`);
      const json = await res.json();
      return json.data;
    },
  });

  const columns: Column<SubscriberRow>[] = [
    {
      key: "name",
      header: "Subscriber",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.name || "—"}</div>
          <div className="text-muted-foreground text-xs">{row.email}</div>
        </div>
      ),
      filterValue: (row) => `${row.name ?? ""} ${row.email}`,
    },
    {
      key: "role",
      header: "Role",
      cell: (row) => <Badge variant="outline">{row.role}</Badge>,
    },
    {
      key: "plan",
      header: "Plan",
      cell: (row) =>
        row.plan ? (
          <div className="font-medium text-sm">{row.plan.title}</div>
        ) : (
          <span className="text-muted-foreground text-sm">No plan</span>
        ),
      filterable: false,
    },
    {
      key: "billingCycle",
      header: "Billing Cycle",
      cell: (row) =>
        row.plan?.billingCycle ? (
          <span className="text-sm">{row.plan.billingCycle}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
      filterable: false,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) =>
        row.plan?.status ? (
          <Badge variant={statusVariant(row.plan.status) as any}>
            {row.plan.status}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
      filterable: false,
    },
    {
      key: "startsAt",
      header: "Start Date",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.plan?.startsAt || null)}
        </span>
      ),
      filterable: false,
    },
    {
      key: "trialEndsAt",
      header: "Trial End Date",
      cell: (row) => {
        if (row.plan?.trialEndsAt) {
          return (
            <span className="text-sm text-muted-foreground">
              {formatDate(row.plan.trialEndsAt)}
            </span>
          );
        }
        return <span className="text-sm text-muted-foreground">—</span>;
      },
      filterable: false,
    },
    {
      key: "currentPeriodEnd",
      header: "Period End",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.plan?.currentPeriodEnd || null)}
        </span>
      ),
      filterable: false,
    },
    {
      key: "canceledAt",
      header: "Canceled Date",
      cell: (row) => {
        if (row.plan?.canceledAt) {
          return (
            <span className="text-sm text-muted-foreground">
              {formatDate(row.plan.canceledAt)}
            </span>
          );
        }
        return <span className="text-sm text-muted-foreground">—</span>;
      },
      filterable: false,
    },
    {
      key: "uploadedFilesCount",
      header: "Files Uploaded",
      cell: (row) => <span>{row.uploadedFilesCount}</span>,
      filterable: false,
    },
    {
      key: "createdAt",
      header: "Joined",
      cell: (row) => (
        <span className="text-muted-foreground">
          {formatDate(row.createdAt)}
        </span>
      ),
      filterable: false,
    },
    {
      key: "actions",
      header: "Actions",
      filterable: false,
      cell: (row) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedUserId(row.id)}
          >
            View Details
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Subscriber Management</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <DataTable
          data={users ?? []}
          columns={columns}
          searchPlaceholder="Search by name or email..."
          searchKeys={["name"]}
          emptyMessage="No subscribers yet."
          enableColumnVisibility={true}
          persistKey="users-table"
        />
      )}

      {selectedUserId !== null && (
        <UserDetailsModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}
