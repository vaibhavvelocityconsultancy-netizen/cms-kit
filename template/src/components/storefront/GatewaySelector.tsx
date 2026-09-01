"use client";

import { useEffect, useState } from "react";

type Gateway = "STRIPE" | "RAZORPAY" | "PAYPAL";

type GatewaySelectorProps = {
  amount: number;
  currency?: string;
  onCreateOrder: (provider: Gateway) => Promise<Record<string, any>>;
  onSuccess?: (provider: Gateway, orderId?: string, paymentId?: string) => void;
  submitLabel?: string;
};

const labels: Record<Gateway, string> = {
  STRIPE: "Stripe",
  RAZORPAY: "Razorpay",
  PAYPAL: "PayPal",
};

export default function GatewaySelector({ amount, currency = "USD", createPayment, onComplete, submitLabel = "Continue to payment" }: GatewaySelectorProps) {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [provider, setProvider] = useState<Gateway | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/system/payment-gateways")
      .then((response) => response.json())
      .then((data) => {
        const configured = (data.gateways ?? []).map((gateway: string) => gateway.toUpperCase()).filter((gateway: Gateway) => gateway in labels);
        setGateways(configured);
        setProvider(configured[0] ?? "");
      })
      .catch(() => setError("Unable to load payment methods."));
  }, []);

  async function submit() {
    if (!provider) return;
    setLoading(true);
    setError("");
    try {
      const result = await onCreateOrder(provider);
      if (provider === "STRIPE" && result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      if (provider === "PAYPAL" && result.approvalUrl) {
        window.location.assign(result.approvalUrl);
        return;
      }
      if (provider === "RAZORPAY" && result.id) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          const Razorpay = (window as any).Razorpay;
          const checkout = new Razorpay({ key: result.key, amount: result.amount, currency: result.currency ?? currency, order_id: result.id, handler: (response: any) => onSuccess?.(provider, result.id, response.razorpay_payment_id) });
          checkout.open();
        };
        document.body.appendChild(script);
        return;
      }
      onComplete?.(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Payment could not be started.");
    } finally {
      setLoading(false);
    }
  }

  if (gateways.length === 0) return <p className="text-sm text-muted-foreground">No payment methods are configured.</p>;

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Payment method</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {gateways.map((gateway) => (
            <label key={gateway} className="flex cursor-pointer items-center gap-2 border border-border px-3 py-3 text-sm">
              <input type="radio" name="payment-provider" value={gateway} checked={provider === gateway} onChange={() => setProvider(gateway)} />
              {labels[gateway]}
            </label>
          ))}
        </div>
      </fieldset>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <button type="button" onClick={submit} disabled={loading || !provider} className="h-12 bg-primary px-6 text-sm text-primary-foreground disabled:opacity-50">
        {loading ? "Starting payment…" : `${submitLabel} · ${labels[provider as Gateway]}`}
      </button>
    </div>
  );
}
