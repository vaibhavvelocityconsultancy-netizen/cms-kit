"use client";

/**
 * ═════════════════════════════════════════════════════════════════════
 * PLANS PAGE
 * ═════════════════════════════════════════════════════════════════════
 *
 * Displays all available plans with features and pricing
 * Shows current subscription status and badge
 * Allows users to subscribe or upgrade
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Crown,
  Sparkles,
  Clock,
  AlertCircle,
  Loader2,
  X,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface Feature {
  id: number;
  title: string;
  sortOrder: number;
  planId: number;
}

interface Plan {
  id: number;
  title: string;
  tagline: string;
  description: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  allowMonthly: boolean;
  allowYearly: boolean;
  trialDays?: number;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  features: Feature[];
}

interface CurrentPlan {
  planId: number;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string;
  daysRemaining: number | null;
}

interface PlansResponse {
  success: boolean;
  message: string;
  data: {
    plans: Plan[];
    currentPlan: CurrentPlan | null;
  };
}

// API function
import { getBaseUrl } from "@/src/lib/config";

const fetchPlans = async (): Promise<PlansResponse> => {
  const response = await fetch(`${getBaseUrl()}/api/plans/all-plans`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch plans");
  }

  const result = await response.json();

  const payload = result?.data ?? {};
  const plans = Array.isArray(payload.plans)
    ? payload.plans
    : Array.isArray(result?.data)
      ? result.data
      : [];
  const currentPlan = payload.currentPlan ?? result?.currentPlan ?? null;

  return {
    success: result.success || true,
    message: result.message || "Plans fetched successfully",
    data: {
      plans,
      currentPlan,
    },
  };
};

// Billing Selection Modal
const BillingModal = ({
  plan,
  onClose,
  onSelect,
}: {
  plan: Plan;
  onClose: () => void;
  onSelect: (billingCycle: "MONTHLY" | "YEARLY") => void;
}) => {
  const formatPrice = (price: number | null) => {
    if (!price) return "Free";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Choose Billing</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-3">
          {plan.allowMonthly && plan.monthlyPrice != null && (
            <button
              onClick={() => onSelect("MONTHLY")}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900">Monthly</p>
                  <p className="text-sm text-gray-500">Pay month to month</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(plan.monthlyPrice)}
                  </p>
                  <p className="text-xs text-gray-500">/month</p>
                </div>
              </div>
            </button>
          )}

          {plan.allowYearly && plan.yearlyPrice != null && (
            <button
              onClick={() => onSelect("YEARLY")}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900">Yearly</p>
                  <p className="text-sm text-gray-500">Best value - save 20%</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(plan.yearlyPrice)}
                  </p>
                  <p className="text-xs text-gray-500">/year</p>
                </div>
              </div>
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Plan Card Component
const PlanCard = ({
  plan,
  isCurrentPlan,
  currentPlanStatus,
  onSelect,
  onCancel,
  isCancelling,
}: {
  plan: Plan;
  isCurrentPlan: boolean;
  currentPlanStatus?: string;
  onSelect: () => void;
  onCancel: () => void;
  isCancelling: boolean;
}) => {
  const isFeatured = plan.isFeatured;
  const isActive = isCurrentPlan && currentPlanStatus === "ACTIVE";
  const isTrialing = isCurrentPlan && currentPlanStatus === "TRIAL";
  const isExpired = isCurrentPlan && currentPlanStatus === "EXPIRED";
  const isCancelled = isCurrentPlan && currentPlanStatus === "CANCELLED";

  const getButtonText = () => {
    if (isActive) return "Current Plan";
    if (isTrialing) return "Upgrade Now";
    if (isExpired) return "Subscribe Again";
    if (isCancelled) return "Resubscribe";
    return "Subscribe Now";
  };

  const getButtonStyles = () => {
    if (isActive) return "bg-green-600 hover:bg-green-700";
    if (isTrialing) return "bg-blue-600 hover:bg-blue-700";
    if (isExpired || isCancelled) return "bg-orange-600 hover:bg-orange-700";
    if (isFeatured) return "bg-blue-600 hover:bg-blue-700";
    return "bg-red-600 hover:bg-red-700";
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "Free";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Sort features by sortOrder
  const sortedFeatures = [...plan.features].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  const hasPricing = plan.allowMonthly || plan.allowYearly;

  return (
    <div
      className={`
        relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300
        ${
          isActive
            ? "border-green-500 shadow-xl"
            : isTrialing
              ? "border-blue-400 shadow-xl"
              : isExpired || isCancelled
                ? "border-orange-400 shadow-xl"
                : isFeatured
                  ? "border-blue-500 shadow-xl ring-2 ring-blue-100"
                  : "border-gray-200 hover:border-red-300 hover:shadow-xl"
        }
        ${isCurrentPlan ? "transform scale-[1.02]" : "hover:scale-[1.02]"}
        overflow-hidden
      `}
    >
      {/* Featured Badge */}
      {isFeatured && !isCurrentPlan && (
        <div className="absolute top-0 right-0">
          <div className="bg-gradient-to-l from-blue-500 to-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-lg flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            FEATURED
          </div>
        </div>
      )}

      {/* Status Badge */}
      {isCurrentPlan && (
        <div className="absolute top-0 left-0 z-10">
          <div
            className={`
            text-white text-xs font-bold px-4 py-1.5 rounded-br-lg flex items-center gap-1
            ${isActive ? "bg-green-600" : ""}
            ${isTrialing ? "bg-blue-600" : ""}
            ${isExpired || isCancelled ? "bg-orange-600" : ""}
          `}
          >
            {isActive && (
              <>
                <Check className="w-3 h-3" /> ACTIVE
              </>
            )}
            {isTrialing && (
              <>
                <Clock className="w-3 h-3" /> TRIAL
              </>
            )}
            {isExpired && (
              <>
                <AlertTriangle className="w-3 h-3" /> EXPIRED
              </>
            )}
            {isCancelled && (
              <>
                <X className="w-3 h-3" /> CANCELLED
              </>
            )}
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Plan Name */}
        <div className="mb-1">
          <h3 className="text-2xl font-bold text-gray-900">{plan.title}</h3>
        </div>

        {/* Tagline */}
        {plan.tagline && (
          <p className="text-sm text-blue-600 font-medium mb-3">
            {plan.tagline}
          </p>
        )}

        {/* Pricing */}
        {hasPricing ? (
          <div className="mb-3 space-y-1">
            {plan.allowMonthly && plan.monthlyPrice != null && (
              <div>
                <span className="text-3xl font-extrabold text-gray-900">
                  {formatPrice(plan.monthlyPrice)}
                </span>
                <span className="text-gray-500 ml-1 text-sm">/month</span>
              </div>
            )}
            {plan.allowYearly && plan.yearlyPrice != null && (
              <div>
                <span className="text-3xl font-extrabold text-gray-900">
                  {formatPrice(plan.yearlyPrice)}
                </span>
                <span className="text-gray-500 ml-1 text-sm">/year</span>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-3">
            <span className="text-2xl font-extrabold text-gray-400">
              Contact Us
            </span>
          </div>
        )}

        {/* Description */}
        {plan.description && (
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {plan.description}
          </p>
        )}

        {/* Features */}
        <div className="space-y-2 mb-6">
          {sortedFeatures.slice(0, 6).map((feature) => (
            <div key={feature.id} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 text-sm">{feature.title}</span>
            </div>
          ))}
          {sortedFeatures.length > 6 && (
            <div className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 text-sm font-medium">
                +{sortedFeatures.length - 6} more features
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        {isActive ? (
          // Show Cancel button for Active subscriptions
          <button
            onClick={onCancel}
            disabled={isCancelling}
            className={`
              w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300
              ${isCancelling ? "opacity-70 cursor-not-allowed" : "transform hover:scale-[1.02] active:scale-[0.98]"}
              bg-red-600 hover:bg-red-700
            `}
          >
            {isCancelling ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cancelling...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <X className="w-4 h-4" />
                Cancel Subscription
              </span>
            )}
          </button>
        ) : isTrialing ? (
          // Show Upgrade button for Trial
          <button
            onClick={onSelect}
            className={`
              w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300
              transform hover:scale-[1.02] active:scale-[0.98]
              bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
            `}
          >
            <span className="flex items-center justify-center gap-2">
              <Crown className="w-4 h-4" />
              Upgrade Now
            </span>
          </button>
        ) : isExpired || isCancelled ? (
          // Show Resubscribe button for Expired/Cancelled
          <button
            onClick={onSelect}
            className={`
              w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300
              transform hover:scale-[1.02] active:scale-[0.98]
              bg-orange-600 hover:bg-orange-700
            `}
          >
            <span className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" />
              {isExpired ? "Subscribe Again" : "Resubscribe"}
            </span>
          </button>
        ) : (
          // Show Subscribe button for non-current plans
          <button
            onClick={onSelect}
            className={`
              w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300
              transform hover:scale-[1.02] active:scale-[0.98]
              ${getButtonStyles()}
            `}
          >
            {getButtonText()}
          </button>
        )}

        {/* Status Messages */}
        {isTrialing && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-600 text-center">
              ⏳ Trial ends in {currentPlanStatus?.daysRemaining || 0} days.
              Upgrade now to continue!
            </p>
          </div>
        )}

        {isActive && (
          <p className="text-xs text-green-600 text-center mt-3">
            ✓ Your subscription is active
          </p>
        )}

        {isExpired && (
          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-xs text-orange-600 text-center">
              ⚠️ Your subscription has expired. Subscribe again to continue.
            </p>
          </div>
        )}

        {isCancelled && (
          <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              Your subscription has been cancelled. Resubscribe to continue.
            </p>
          </div>
        )}

        {!isCurrentPlan && plan.trialDays && plan.trialDays > 0 && (
          <p className="text-xs text-gray-500 text-center mt-3">
            🎉 {plan.trialDays}-day free trial included
          </p>
        )}
      </div>
    </div>
  );
};

// Loading Skeleton
const PlanSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="h-10 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
    <div className="space-y-3 mb-6">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
    <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
  </div>
);

export default function PlansPage() {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState<Plan | null>(null);

  const { data, isLoading, error, refetch } = useQuery<PlansResponse>({
    queryKey: ["plans"],
    queryFn: fetchPlans,
    retry: 1,
  });

  const plans = data?.data?.plans || [];
  const currentPlan = data?.data?.currentPlan || null;

  const handleSubscribe = (plan: Plan) => {
    if (currentPlan?.planId === plan.id && currentPlan?.status === "ACTIVE") {
      return;
    }

    // Check if both monthly and yearly are available
    const hasMonthly = plan.allowMonthly && plan.monthlyPrice != null;
    const hasYearly = plan.allowYearly && plan.yearlyPrice != null;

    if (hasMonthly && hasYearly) {
      // Show billing selection modal
      setShowBillingModal(plan);
      return;
    }

    if (hasMonthly) {
      navigateToCheckout(plan.id, "MONTHLY");
      return;
    }

    if (hasYearly) {
      navigateToCheckout(plan.id, "YEARLY");
      return;
    }

    // No pricing available
    alert("This plan has no pricing configured. Please contact support.");
  };

  const navigateToCheckout = (
    planId: number,
    billingCycle: "MONTHLY" | "YEARLY",
  ) => {
    setSelectedPlanId(planId);
    setIsSubscribing(true);

    try {
      router.push(`/checkout?plan=${planId}&billingCycle=${billingCycle}`);
    } catch (error) {
      console.error("Subscription error:", error);
      setIsSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentPlan) return;

    if (!confirm("Are you sure you want to cancel your subscription?")) {
      return;
    }

    setIsCancelling(true);

    try {
      const response = await fetch(`${getBaseUrl()}/api/subscription/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: currentPlan.planId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      // Refetch plans to update the UI
      await refetch();

      // Show success message
      alert("Your subscription has been cancelled successfully.");
    } catch (error) {
      console.error("Cancel subscription error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to cancel subscription. Please try again.",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handleBillingSelect = (
    plan: Plan,
    billingCycle: "MONTHLY" | "YEARLY",
  ) => {
    setShowBillingModal(null);
    navigateToCheckout(plan.id, billingCycle);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="h-10 w-64 bg-gray-200 rounded-lg mx-auto mb-3 animate-pulse"></div>
            <div className="h-6 w-96 bg-gray-200 rounded-lg mx-auto animate-pulse"></div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PlanSkeleton />
            <PlanSkeleton />
            <PlanSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-6 h-6" />
            <h3 className="font-semibold">Error loading plans</h3>
          </div>
          <p className="text-red-700 mt-2">
            {error instanceof Error ? error.message : "Failed to load plans"}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No plans found
  if (plans.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md w-full text-center">
          <h3 className="text-lg font-semibold text-yellow-800">
            No plans available
          </h3>
          <p className="text-yellow-700 mt-2">
            Please check back later for available plans.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan that fits your needs. Upgrade or downgrade
            anytime.
          </p>

          {/* Current Subscription Status */}
          {currentPlan && (
            <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
              <Crown className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Current:{" "}
                {currentPlan.status === "ACTIVE"
                  ? "Active"
                  : currentPlan.status === "TRIAL"
                    ? "Trial"
                    : currentPlan.status === "EXPIRED"
                      ? "Expired"
                      : "Cancelled"}{" "}
                Plan
              </span>
              {currentPlan.daysRemaining !== null &&
                currentPlan.daysRemaining > 0 &&
                (currentPlan.status === "ACTIVE" ||
                  currentPlan.status === "TRIAL") && (
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    {currentPlan.daysRemaining} day
                    {currentPlan.daysRemaining > 1 ? "s" : ""} left
                  </span>
                )}
              {currentPlan.status === "TRIAL" && (
                <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                  Trial Mode
                </span>
              )}
              {(currentPlan.status === "EXPIRED" ||
                currentPlan.status === "CANCELLED") && (
                <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                  {currentPlan.status}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.planId === plan.id;
            const isFeatured = plan.isFeatured;
            const currentStatus = currentPlan?.status;

            return (
              <div
                key={plan.id}
                className={`
                  relative transition-all duration-300
                  ${isFeatured && !isCurrentPlan ? "md:transform md:scale-105" : ""}
                `}
              >
                <PlanCard
                  plan={plan}
                  isCurrentPlan={!!isCurrentPlan}
                  currentPlanStatus={currentStatus}
                  onSelect={() => handleSubscribe(plan)}
                  onCancel={handleCancelSubscription}
                  isCancelling={isCancelling}
                />

                {/* Recommended Badge for Featured Plans */}
                {isFeatured && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      RECOMMENDED
                    </span>
                  </div>
                )}

                {/* Current Plan Badge - Only show for Active or Trial */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <span
                      className={`
                        text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg flex items-center gap-1
                        ${currentStatus === "ACTIVE" ? "bg-gradient-to-r from-green-500 to-green-600" : ""}
                        ${currentStatus === "TRIAL" ? "bg-gradient-to-r from-blue-500 to-blue-600" : ""}
                        ${currentStatus === "EXPIRED" || currentStatus === "CANCELLED" ? "bg-gradient-to-r from-orange-500 to-orange-600" : ""}
                      `}
                    >
                      {currentStatus === "ACTIVE" && (
                        <>
                          <Check className="w-3 h-3" /> CURRENT PLAN
                        </>
                      )}
                      {currentStatus === "TRIAL" && (
                        <>
                          <Clock className="w-3 h-3" /> TRIAL PLAN
                        </>
                      )}
                      {(currentStatus === "EXPIRED" ||
                        currentStatus === "CANCELLED") && (
                        <>
                          <AlertTriangle className="w-3 h-3" /> {currentStatus}
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            All plans include a free trial. Cancel anytime.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Secure payment powered by PayPal. Your subscription will
            automatically renew unless canceled.
          </p>
        </div>
      </div>

      {/* Billing Selection Modal */}
      {showBillingModal && (
        <BillingModal
          plan={showBillingModal}
          onClose={() => setShowBillingModal(null)}
          onSelect={(billingCycle) =>
            handleBillingSelect(showBillingModal, billingCycle)
          }
        />
      )}
    </div>
  );
}
