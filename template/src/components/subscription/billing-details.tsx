"use client";

import { useEffect, useState, useCallback } from "react";
import { getBaseUrl } from "@/src/lib/config";

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  billingCycle: string;
  createdAt: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  plan: {
    id: number;
    name?: string;
    title?: string;
    monthlyPrice?: number;
    annualPrice?: number;
  };
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatUSD(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount / 100);
}

export function BillingPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${getBaseUrl()}/api/payment/history`);
      const data = await res.json();
      setPayments(data.data ?? []);
    } catch (e: any) {
      setError("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // ── Stats ─────────────────────────────────────────────────
  const totalSpent = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);

  const successCount = payments.filter((p) => p.status === "SUCCESS").length;
  const lastPayment = payments.find((p) => p.status === "SUCCESS");

  // Detect plan changes
  const planChanges = payments.filter((p, i) => {
    if (i === payments.length - 1) return false;
    return payments[i + 1].plan?.id !== p.plan?.id;
  });

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error} —{" "}
          <button className="underline" onClick={fetchPayments}>
            retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your payment history and billing details.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Total Spent
          </p>
          <p className="text-2xl font-semibold mt-1">{formatUSD(totalSpent)}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Payments Made
          </p>
          <p className="text-2xl font-semibold mt-1">{successCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Last Payment
          </p>
          <p className="text-2xl font-semibold mt-1">
            {lastPayment ? formatUSD(lastPayment.amount) : "—"}
          </p>
          {lastPayment && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(lastPayment.createdAt)}
            </p>
          )}
        </div>
      </div>

      {/* ── Payment History Table ── */}
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="text-base font-semibold mb-4">Payment History</h2>

        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase">
                    Plan
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase">
                    Date
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase">
                    Cycle
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase">
                    Order ID
                  </th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase">
                    Amount
                  </th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((payment, index) => {
                  // Detect if plan changed from previous payment
                  const prevPayment = payments[index + 1];
                  const planChanged =
                    prevPayment && prevPayment.plan?.id !== payment.plan?.id;

                  return (
                    <>
                      {/* Plan change indicator */}
                      {planChanged && (
                        <tr key={`change-${payment.id}`}>
                          <td colSpan={6} className="py-2 px-2">
                            <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-1.5">
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                />
                              </svg>
                              Plan changed from{" "}
                              <span className="font-medium">
                                {prevPayment.plan?.title ||
                                  prevPayment.plan?.name}
                              </span>
                              {" → "}
                              <span className="font-medium">
                                {payment.plan?.title || payment.plan?.name}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr
                        key={payment.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-2 font-medium">
                          {payment.plan?.title || payment.plan?.name}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground capitalize">
                          {payment.billingCycle.toLowerCase()}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground font-mono text-xs">
                          {payment.razorpayOrderId?.slice(0, 16)}...
                        </td>
                        <td className="py-3 px-2 text-right font-semibold">
                          {formatUSD(payment.amount)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              payment.status === "SUCCESS"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : payment.status === "FAILED"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
