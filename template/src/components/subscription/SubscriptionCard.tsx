"use client";

/**
 * ═════════════════════════════════════════════════════════════════════
 * SUBSCRIPTION COUNTDOWN CARD
 * ═════════════════════════════════════════════════════════════════════
 *
 * Display on dashboard showing:
 * - Current plan name
 * - Subscription status (TRIAL/Active)
 * - Live countdown timer
 * - Time until expiry
 *
 * Shows different UI based on subscription status:
 * - TRIAL: "Free Trial" + countdown to trial end
 * - ACTIVE: "Active" + countdown to renewal
 * - CANCELED: "Canceled" + info about access until period end
 * - EXPIRED: "Subscription Expired" + upgrade button
 */

import { useState, useEffect } from "react";
import { Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { calculateTimeRemaining, getSubscriptionStatusDisplay, formatSubscriptionDate } from "@/src/lib/subscription/countdown";
import { useRouter } from "next/navigation";

interface SubscriptionCardProps {
  subscription?: {
    status: string;
    startsAt: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string;
    billingCycle: string;
    canceledAt?: string | null;
    plan: {
      name: string;
      monthlyPrice: number;
    };
  };
  loading?: boolean;
  onManageClick?: () => void; // ✅ Added callback for manage click
}

export function SubscriptionCard({ 
  subscription, 
  loading = false,
  onManageClick 
}: SubscriptionCardProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState<any>(null);

  useEffect(() => {
    if (!subscription) return;

    // For CANCELED status, still show countdown until current period ends
    if (subscription.status === "CANCELED") {
      const targetDate = new Date(subscription.currentPeriodEnd);
      setCountdown(calculateTimeRemaining(targetDate));

      const interval = setInterval(() => {
        setCountdown(calculateTimeRemaining(targetDate));
      }, 60000);

      return () => clearInterval(interval);
    }

    // Determine which date to count down to for ACTIVE/TRIAL
    const targetDate = subscription.status === "TRIAL" && subscription.trialEndsAt
      ? new Date(subscription.trialEndsAt)
      : new Date(subscription.currentPeriodEnd);

    // Initial calculation
    setCountdown(calculateTimeRemaining(targetDate));

    // Update countdown every minute
    const interval = setInterval(() => {
      setCountdown(calculateTimeRemaining(targetDate));
    }, 60000);

    return () => clearInterval(interval);
  }, [subscription]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-lg border border-orange-200 bg-orange-50 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">No Subscription</h3>
            <p className="text-sm text-gray-600 mt-1">
              Choose a plan to get started with premium content access.
            </p>
            <button
              onClick={() => router.push("/pricing")}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-medium"
            >
              Browse Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  // EXPIRED state
  if (subscription.status === "EXPIRED") {
    return (
      <div className="bg-white rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Subscription Expired</h3>
            <p className="text-sm text-gray-600 mt-1">
              Your access has ended. Subscribe to continue accessing premium content.
            </p>
            <button
              onClick={() => router.push("/admin/plans")}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
            >
              Subscribe Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CANCELED state
  if (subscription.status === "CANCELED") {
    const hasAccess = countdown && !countdown.expired;
    
    return (
      <div className="bg-white rounded-lg border border-yellow-200 bg-yellow-50 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Subscription Canceled</h3>
            <p className="text-sm text-gray-600 mt-1">
              {hasAccess 
                ? `Your access continues until ${formatSubscriptionDate(new Date(subscription.currentPeriodEnd))}. After that, you'll lose access to premium features.`
                : "Your subscription has been canceled and access has ended."}
            </p>
            
            {/* Countdown for remaining access */}
            if (countdown && !countdown.expired && (
              <div className="mt-4 bg-white rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Remaining Access:
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {countdown?.shortFormat}
                </div>
                <p className="text-xs text-gray-600">
                  Access ends on: {formatSubscriptionDate(new Date(subscription.currentPeriodEnd))}
                </p>
              </div>
            ))
            
            <button
              onClick={() => router.push("/admin/plans")}
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm font-medium"
            >
              Reactivate Subscription
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusDisplay = getSubscriptionStatusDisplay(subscription.status);

  // ✅ Handle manage click with auto-scroll
  const handleManageClick = () => {
    if (onManageClick) {
      onManageClick();
    } else {
      router.push("/admin/plans");
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      {/* Header with status badge */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {subscription.plan?.name} Plan
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {subscription.billingCycle === "YEARLY" ? "Billed Annually" : "Billed Monthly"}
          </p>
        </div>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusDisplay.badgeColor}`}>
          {statusDisplay.label}
        </span>
      </div>

      {/* Countdown Section for ACTIVE/TRIAL */}
      {countdown && !countdown.expired && subscription.status !== "CANCELED" && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              {subscription.status === "TRIAL" ? "Trial Ends In:" : "Renews In:"}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {countdown?.shortFormat}
          </div>
          <p className="text-xs text-gray-600">
            {subscription.status === "TRIAL" ? "Trial Ends:" : "Renews:"}{" "}
            {formatSubscriptionDate(
              subscription.status === "TRIAL" && subscription.trialEndsAt
                ? new Date(subscription.trialEndsAt)
                : new Date(subscription.currentPeriodEnd)
            )}
          </p>
        </div>
      )}

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Started:</span>
          <span className="font-medium text-gray-900">{formatSubscriptionDate(new Date(subscription.startsAt))}</span>
        </div>
        {subscription.status === "TRIAL" && subscription.trialEndsAt && (
          <div className="flex justify-between">
            <span className="text-gray-600">Trial Ends:</span>
            <span className="font-medium text-blue-600">{formatSubscriptionDate(new Date(subscription.trialEndsAt))}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600">
            {subscription.status === "TRIAL" ? "Full Period Ends:" : "Next Renewal:"}
          </span>
          <span className="font-medium text-gray-900">{formatSubscriptionDate(new Date(subscription.currentPeriodEnd))}</span>
        </div>
        {subscription.canceledAt && (
          <div className="flex justify-between">
            <span className="text-gray-600">Canceled On:</span>
            <span className="font-medium text-red-600">{formatSubscriptionDate(new Date(subscription.canceledAt))}</span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        {subscription.status === "ACTIVE" && (
          <button
            onClick={handleManageClick} // ✅ Updated to use the handler
            className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm font-medium"
          >
            Manage Subscription
          </button>
        )}
        {subscription.status === "TRIAL" && (
          <button
            onClick={handleManageClick} // ✅ Updated to use the handler
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            Upgrade to Premium
          </button>
        )}
      </div>
    </div>
  );
}