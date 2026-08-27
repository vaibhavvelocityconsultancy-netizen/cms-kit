"use client";

/**
 * SUBSCRIPTION TAB - "My Subscription" page
 * Shows current subscription card + all plans as cards with current highlighted
 */

import { useState, useEffect, useRef } from "react";
import { getBaseUrl } from "@/src/lib/config";
import { CheckCircle, Loader2 } from "lucide-react";
import { SubscriptionCard } from "./SubscriptionCard";
import { useRouter } from "next/navigation";

interface Plan {
  id: number;
  name: string;
  tagline?: string;
  monthlyPrice: number;
  annualPrice: number;
  isPopular: boolean;
  isActive: boolean;
  features: { id: number; text: string; included: boolean }[];
}

interface Subscription {
  id: number;
  status: string;
  startsAt: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string;
  billingCycle: string;
  canceledAt?: string | null;
  plan: {
    id: number;
    name: string;
    monthlyPrice: number;
  };
}

export default function MySubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const router = useRouter();
  const plansRef = useRef<HTMLDivElement>(null);

  const formatUSD = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  useEffect(() => {
    async function load() {
      try {
        const [subRes, plansRes] = await Promise.all([
          fetch(`${getBaseUrl()}/api/subscription`),
          fetch("/api/plans/public"),
        ]);

        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscription(subData?.data ?? subData ?? null);
        }

        if (plansRes.ok) {
          const plansData = await plansRes.json();
          setPlans(plansData?.data ?? plansData ?? []);
        }
      } catch (err) {
        console.error("Failed to load subscription/plans:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handlePayment = async (
    planId: number,
    billingCycle: string = "MONTHLY",
  ) => {
    try {
      setPaymentLoading(planId);

      // Create order
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          billingCycle,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      const { orderId, amount, currency, keyId } = data.data;

      // Load Razorpay script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: keyId,
          amount,
          currency: "USD",
          name: "Your Platform",
          description: `Subscribe to ${plans.find((p) => p.id === planId)?.name} Plan`,
          order_id: orderId,
          method: {
            netbanking: true,
            card: true,
            upi: true,
            wallet: true,
          },
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch("/api/payment/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  planId,
                  billingCycle,
                }),
              });

              const verifyData = await verifyRes.json();

              if (verifyData.success) {
                setToast({
                  message: `✅ Successfully subscribed to ${plans.find((p) => p.id === planId)?.name} plan!`,
                  type: "success",
                });

                // Refresh subscription data
                const subRes = await fetch(`${getBaseUrl()}/api/subscription`);
                if (subRes.ok) {
                  const subData = await subRes.json();
                  setSubscription(subData?.data ?? subData ?? null);
                }
              } else {
                setToast({
                  message:
                    "Payment verification failed. Please contact support.",
                  type: "error",
                });
              }
            } catch (err: any) {
              setToast({
                message: "An error occurred during payment verification.",
                type: "error",
              });
            } finally {
              setPaymentLoading(null);
            }
          },
          modal: {
            ondismiss: () => {
              setPaymentLoading(null);
            },
          },
          prefill: { email: "" },
          theme: { color: "#6366f1" },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
    } catch (e: any) {
      setToast({
        message: e.message || "Failed to initiate payment",
        type: "error",
      });
      setPaymentLoading(null);
    }
  };

  const scrollToPlans = () => {
    if (plansRef.current) {
      plansRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Auto-scroll when subscription is updated
  useEffect(() => {
    if (subscription && plansRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        plansRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    }
  }, [subscription]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // Only consider a plan as "current" if subscription is ACTIVE or TRIAL
  const isSubscriptionActive =
    subscription &&
    (subscription.status === "ACTIVE" || subscription.status === "TRIAL");

  const currentPlanId = isSubscriptionActive ? subscription?.plan?.id : null;

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm animate-in slide-in-from-bottom-2 ${
            toast.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-start gap-3">
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            ) : (
              <Loader2 className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            )}
            <div>
              <p
                className={`text-sm font-medium ${
                  toast.type === "success"
                    ? "text-green-800 dark:text-green-400"
                    : "text-red-800 dark:text-red-400"
                }`}
              >
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          My Subscription
        </h2>
        <SubscriptionCard
          subscription={subscription ?? undefined}
          loading={false}
          onManageClick={scrollToPlans}
        />
      </div>

      <div ref={plansRef}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Available Plans
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans
            ?.filter((plan) => plan.isActive) // Only show active plans
            .map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const hasCanceledSubscription =
                subscription?.status === "CANCELED" &&
                subscription?.plan?.id === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-lg border p-6 shadow-sm flex flex-col ${
                    isCurrent
                      ? "border-blue-600 ring-2 ring-blue-100 bg-blue-50"
                      : hasCanceledSubscription
                        ? "border-yellow-300 bg-yellow-50/30"
                        : "border-gray-200 bg-white"
                  }`}
                >
                  {plan.isPopular && !isCurrent && !hasCanceledSubscription && (
                    <span className="absolute top-3 right-3 text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                      Popular
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute top-3 right-3 text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      Current Plan
                    </span>
                  )}
                  {hasCanceledSubscription && (
                    <span className="absolute top-3 right-3 text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                      Canceled
                    </span>
                  )}

                  <h4 className="text-lg font-semibold text-gray-900">
                    {plan.name}
                  </h4>
                  {plan.tagline && (
                    <p className="text-sm text-gray-500 mt-1">{plan.tagline}</p>
                  )}

                  <div className="mt-4">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatUSD(plan.monthlyPrice)}
                    </span>
                    <span className="text-sm text-gray-500">/month</span>
                    {plan.annualPrice && (
                      <div className="text-xs text-gray-500 mt-1">
                        or {formatUSD(plan.annualPrice)}/year
                        {plan.annualPrice < plan.monthlyPrice * 12 && (
                          <span className="text-green-600 font-medium ml-1">
                            (Save{" "}
                            {Math.round(
                              ((plan.monthlyPrice * 12 - plan.annualPrice) /
                                (plan.monthlyPrice * 12)) *
                                100,
                            )}
                            %)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <ul className="mt-4 space-y-2 flex-1">
                    {plan.features.map((f) => (
                      <li
                        key={f.id}
                        className={`flex items-start gap-2 text-sm ${
                          f.included
                            ? "text-gray-700"
                            : "text-gray-400 line-through"
                        }`}
                      >
                        <CheckCircle
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            f.included ? "text-green-500" : "text-gray-300"
                          }`}
                        />
                        {f.text}
                      </li>
                    ))}
                  </ul>

                  <button
                    disabled={isCurrent || paymentLoading === plan.id}
                    onClick={() => {
                      if (!isCurrent) {
                        // Show billing cycle options or directly process payment
                        handlePayment(plan.id, "MONTHLY");
                      }
                    }}
                    className={`mt-4 w-full px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                      isCurrent
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : hasCanceledSubscription
                          ? "bg-yellow-600 text-white hover:bg-yellow-700"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {paymentLoading === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : hasCanceledSubscription ? (
                      "Resubscribe"
                    ) : (
                      "Subscribe Now"
                    )}
                  </button>

                  {/* Billing cycle toggle for non-current plans */}
                  {!isCurrent && !hasCanceledSubscription && (
                    <div className="mt-3 flex items-center justify-center gap-3 text-xs">
                      <button
                        onClick={() => handlePayment(plan.id, "MONTHLY")}
                        disabled={paymentLoading === plan.id}
                        className={`px-2 py-1 rounded transition ${
                          paymentLoading === plan.id
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-blue-600 hover:bg-blue-50"
                        }`}
                      >
                        Monthly
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => handlePayment(plan.id, "YEARLY")}
                        disabled={paymentLoading === plan.id}
                        className={`px-2 py-1 rounded transition ${
                          paymentLoading === plan.id
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-blue-600 hover:bg-blue-50"
                        }`}
                      >
                        Yearly
                        {plan.annualPrice < plan.monthlyPrice * 12 && (
                          <span className="ml-1 text-green-600 font-medium">
                            Save
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
