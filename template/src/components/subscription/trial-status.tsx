// components/subscription/trial-status.tsx
"use client";

import { useEffect, useState } from "react";
import { getBaseUrl } from "@/src/lib/config";
import { Clock, CheckCircle2 } from "lucide-react";

function getDaysRemaining(endDate: string) {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diffMs = end - now;
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function TrialStatus() {
  const [access, setAccess] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getBaseUrl()}/api/subscription/me`)
      .then((res) => res.json())
      .then((data) => setAccess(data?.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!access?.record) return null;

  const { type, record } = access;
  const plan = record.plan;

  if (type === "enrollment") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <CheckCircle2 className="text-green-600" size={20} />
        <div>
          <p className="text-sm font-medium text-green-900">
            {plan.title} — Lifetime access
          </p>
          <p className="text-xs text-green-700">No expiration</p>
        </div>
      </div>
    );
  }

  if (record.status === "TRIAL") {
    const daysLeft = getDaysRemaining(record.trialEndsAt);
    return (
      <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <Clock className="text-amber-600" size={20} />
        <div>
          <p className="text-sm font-medium text-amber-900">
            {plan.title} trial — {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
          </p>
          <p className="text-xs text-amber-700">
            Ends {new Date(record.trialEndsAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  }

  if (record.status === "ACTIVE") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <CheckCircle2 className="text-blue-600" size={20} />
        <div>
          <p className="text-sm font-medium text-blue-900">
            {plan.title} — Active
          </p>
          <p className="text-xs text-blue-700">
            Renews {new Date(record.currentPeriodEnd).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  }

  if (record.status === "EXPIRED" || record.status === "CANCELED") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-red-900">
            {plan.title} —{" "}
            {record.status === "EXPIRED" ? "Expired" : "Canceled"}
          </p>
          <p className="text-xs text-red-700">Renew to keep access</p>
        </div>
      </div>
    );
  }

  return null;
}
