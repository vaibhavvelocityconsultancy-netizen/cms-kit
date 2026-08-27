"use client";

/**
 * ═════════════════════════════════════════════════════════════════════
 * TRIAL STATUS POPUP/MODAL
 * ═════════════════════════════════════════════════════════════════════
 *
 * Shows two different messages based on `status`:
 * 1. TRIAL   -> Welcome message + days remaining + OK / View Plan
 * 2. EXPIRED -> Trial expired message + Subscribe Now / Maybe Later
 */

import { AlertCircle, PartyPopper, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface TrialExpiryPopupProps {
  show: boolean;
  status?: string;
  trialDaysRemaining?: number | null;
  trialEndsAt?: string | null;
  onDismiss?: () => void;
}

export function TrialExpiryPopup({
  show,
  status,
  trialDaysRemaining,
  trialEndsAt,
  onDismiss,
}: TrialExpiryPopupProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (show) {
      setDismissed(false);
    }
  }, [show]);

  if (!show || dismissed) return null;

  const handleViewPlans = () => {
    router.push("/subscription/plans");
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const isTrial = status === "TRIAL";

  // Calculate days remaining if not passed directly
  const daysLeft =
    trialDaysRemaining ??
    (trialEndsAt
      ? Math.max(
          0,
          Math.ceil(
            (new Date(trialEndsAt).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : null);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white rounded-lg shadow-lg max-w-sm w-full p-6 border border-gray-200">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {isTrial ? (
          <>
            {/* Welcome — Trial Started */}
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 rounded-full p-3">
                <PartyPopper className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Welcome! Your trial has started 🎉
            </h2>

            <p className="text-center text-gray-600 mb-6">
              {daysLeft !== null
                ? `You have ${daysLeft} day${daysLeft === 1 ? "" : "s"} of full access. Explore everything before it ends.`
                : "Enjoy full access during your trial period."}
            </p>

            <div className="space-y-3">
              <button
                onClick={handleDismiss}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition"
              >
                OK, Got It
              </button>
              <button
                onClick={handleViewPlans}
                className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg transition"
              >
                View Plans
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Expired */}
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Your trial has expired
            </h2>

            <p className="text-center text-gray-600 mb-6">
              Subscribe to continue watching premium content and access all
              course materials.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleViewPlans}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition"
              >
                Subscribe Now
              </button>
              <button
                onClick={handleDismiss}
                className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg transition"
              >
                Maybe Later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}