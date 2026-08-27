// src/app/lib/services/paypal.service.js

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are not configured");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || "PayPal auth failed");
  return data.access_token;
}

export async function createPaypalProduct({ name, description }) {
  const token = await getAccessToken();

  console.log(
    "DEBUG auth string:",
    JSON.stringify(
      `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
    ),
  );
  const res = await fetch(`${PAYPAL_BASE}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      description,
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create product");
  return data; // data.id is what you need
}

export async function createPaypalBillingPlan({
  productId,
  name,
  amount, // major currency unit, e.g. 19.99
  currency = "USD",
  interval, // "MONTH" | "YEAR"
  trialDays = 0,
}) {
  if (!productId || !name || !interval) {
    throw new Error(
      "PayPal billing plan requires a product ID, name, and interval",
    );
  }

  const token = await getAccessToken();

  const billingCycles = [];
  let sequence = 1;

  if (trialDays > 0) {
    billingCycles.push({
      frequency: { interval_unit: "DAY", interval_count: trialDays },
      tenure_type: "TRIAL",
      sequence: sequence++,
      total_cycles: 1,
      pricing_scheme: {
        fixed_price: { value: "0.00", currency_code: currency },
      },
    });
  }

  billingCycles.push({
    frequency: { interval_unit: interval, interval_count: 1 },
    tenure_type: "REGULAR",
    sequence: sequence++,
    total_cycles: 0, // infinite, until cancelled
    pricing_scheme: {
      fixed_price: { value: amount.toFixed(2), currency_code: currency },
    },
  });

  const res = await fetch(`${PAYPAL_BASE}/v1/billing/plans`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: productId,
      name,
      billing_cycles: billingCycles,
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create billing plan");
  return data;
}


export async function verifyPaypalWebhook(headers, rawBody) {
  const token = await getAccessToken();

  const verificationPayload = {
    auth_algo: headers["paypal-auth-algo"],
    cert_url: headers["paypal-cert-url"],
    transmission_id: headers["paypal-transmission-id"],
    transmission_sig: headers["paypal-transmission-sig"],
    transmission_time: headers["paypal-transmission-time"],
    webhook_id: process.env.PAYPAL_WEBHOOK_ID,
    webhook_event: JSON.parse(rawBody),
  };

  const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(verificationPayload),
  });

  const data = await res.json();
  return data.verification_status === "SUCCESS";
}

export async function createPaypalSubscription({
  planId, // your PayPal plan ID, e.g. P-XXXXX
  userId, // your internal user id, passed through as custom_id
  returnUrl,
  cancelUrl,
}) {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `sub-${userId}-${Date.now()}`, // idempotency key
    },
    body: JSON.stringify({
      plan_id: planId,
      custom_id: String(userId),
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        user_action: "SUBSCRIBE_NOW",
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create subscription");
  return data;
}
