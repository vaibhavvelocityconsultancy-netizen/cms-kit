"use client";

export const dynamic = "force-dynamic";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/src/hooks/use-current-user";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useMutation } from "@tanstack/react-query";
import { resolveAppUrl } from "@/src/lib/base-path";
import { useCart } from "@/src/lib/storefront/cart";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const [paypalPlanId, setPaypalPlanId] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const hasStarted = useRef(false);

  const planId = searchParams.get("plan");
  const billingCycle = searchParams.get("billingCycle") || "MONTHLY";

  const buildApiUrl = (path: string) =>
    resolveAppUrl(
      path,
      typeof window !== "undefined" ? window.location.origin : "",
    );

  const confirmMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const res = await fetch(buildApiUrl("/api/subscription/confirms"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: Number(planId),
          billingCycle,
          subscriptionId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save subscription");
      }
      return data;
    },
    onSuccess: () => {
      router.replace("/subscription");
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  useEffect(() => {
    if (userLoading || currentUser) return;
    const checkoutUrl = `/checkout?plan=${planId ?? ""}&billingCycle=${billingCycle}`;
    router.replace(`/register?redirect=${encodeURIComponent(checkoutUrl)}`);
  }, [billingCycle, currentUser, planId, router, userLoading]);

  useEffect(() => {
    if (userLoading || !currentUser || !planId || hasStarted.current) return;
    hasStarted.current = true;

    async function fetchPlanInfo() {
      try {
        const res = await fetch(
          buildApiUrl(
            `/api/subscription/plan-info?planId=${encodeURIComponent(planId ?? "")}&billingCycle=${encodeURIComponent(billingCycle)}`,
          ),
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load plan");
        }
        setPaypalPlanId(data.data.paypalPlanId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoadingPlan(false);
      }
    }

    fetchPlanInfo();
  }, [currentUser, planId, billingCycle, userLoading]);

  if (userLoading || loadingPlan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-muted-foreground">Loading checkout...</p>
      </div>
    );
  }

  if (error || !planId || !paypalPlanId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm font-medium text-red-600">
          {error || "Missing plan ID"}
        </p>
        <button
          onClick={() => router.push("/pricing")}
          className="text-xs font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition"
        >
          Back to pricing
        </button>
      </div>
    );
  }

  if (confirming || confirmMutation.isPending) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-600">Activating your subscription...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-sm text-muted-foreground">
        Complete your subscription
      </p>
      <div className="w-full max-w-xs">
        <PayPalButtons
          style={{ layout: "vertical" }}
          createSubscription={(data, actions) =>
            actions.subscription.create({ plan_id: paypalPlanId })
          }
          onApprove={async (data) => {
            setConfirming(true);
            if (data.subscriptionID)
              await confirmMutation.mutateAsync(data.subscriptionID);
          }}
          onError={() => setError("Subscription failed. Please try again.")}
        />
      </div>
    </div>
  );
}

function EcommerceCheckout() {
  const router = useRouter();
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const { lines, total, loading: cartLoading } = useCart();
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [country, setCountry] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  useEffect(() => {
    if (!userLoading && !currentUser)
      router.replace("/login?redirect=/checkout");
  }, [currentUser, router, userLoading]);

  const createPayment = async () => {
    const response = await fetch(
      resolveAppUrl("/api/public/ecommerce/checkout/create-payment"),
      { method: "POST" },
    );
    const result = await response.json();
    if (!response.ok || !result.success)
      throw new Error(result.message || "Unable to start payment");
    return result.data.orderId;
  };

  const completePayment = async (paypalOrderId: string) => {
    const address = { country, line1, city, postalCode };
    const response = await fetch(
      resolveAppUrl("/api/public/ecommerce/checkout/complete"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paypalOrderId,
          shippingAddress: address,
          billingAddress: address,
        }),
      },
    );
    const result = await response.json();
    if (!response.ok || !result.success)
      throw new Error(result.message || "Unable to complete order");
    router.replace(`/account/orders/${result.data.id}`);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!lines.length || !country || !line1 || !city || !postalCode) {
      setError("Complete your shipping address before paying.");
      return;
    }
    setProcessing(true);
  };

  if (userLoading || cartLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (!currentUser) return null;
  if (!lines.length)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p>Your cart is empty.</p>
        <button
          onClick={() => router.push("/shop")}
          className="bg-primary px-5 py-3 text-sm text-primary-foreground"
        >
          Return to shop
        </button>
      </div>
    );

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl gap-12 px-5 py-16 md:grid-cols-[1fr_0.8fr] md:px-10">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Checkout
        </p>
        <h1 className="mt-3 text-5xl tracking-tight">Complete your order.</h1>
        <form onSubmit={submit} className="mt-12 flex max-w-lg flex-col gap-4">
          <input
            required
            value={line1}
            onChange={(event) => setLine1(event.target.value)}
            placeholder="Address"
            className="border border-border px-4 py-3 text-sm"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="City"
              className="border border-border px-4 py-3 text-sm"
            />
            <input
              required
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              placeholder="Postal code"
              className="border border-border px-4 py-3 text-sm"
            />
          </div>
          <input
            required
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            placeholder="Country code, e.g. US"
            maxLength={2}
            className="border border-border px-4 py-3 text-sm uppercase"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={processing}
            type="submit"
            className="bg-primary px-5 py-3 text-sm text-primary-foreground disabled:opacity-50"
          >
            {processing ? "Loading payment..." : "Continue to payment"}
          </button>
        </form>
        {processing && (
          <div className="mt-6 max-w-lg">
            <PayPalButtons
              createOrder={createPayment}
              onApprove={(data) =>
                completePayment(data.orderID).catch((err) => {
                  setError(err.message);
                  setProcessing(false);
                })
              }
              onError={(err) => {
                setError(err instanceof Error ? err.message : "Payment failed");
                setProcessing(false);
              }}
            />
          </div>
        )}
      </div>
      <aside className="border-t border-border pt-5">
        <p className="text-sm">Order summary</p>
        {lines.map((line) => (
          <div
            key={line.itemId}
            className="mt-4 flex justify-between gap-4 text-sm"
          >
            <span>
              {line.product?.name} × {line.quantity}
            </span>
            <span>
              {((line.product?.price ?? 0) * line.quantity).toFixed(2)}
            </span>
          </div>
        ))}
        <div className="mt-6 flex justify-between border-t border-border pt-4 text-base">
          <span>Total</span>
          <span>{total.toFixed(2)}</span>
        </div>
      </aside>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <CheckoutRouter />
    </Suspense>
  );
}

function CheckoutRouter() {
  const searchParams = useSearchParams();
  const isSubscription = Boolean(searchParams.get("plan"));
  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
        vault: isSubscription,
        intent: isSubscription ? "subscription" : "capture",
      }}
    >
      {isSubscription ? <CheckoutContent /> : <EcommerceCheckout />}
    </PayPalScriptProvider>
  );
}
