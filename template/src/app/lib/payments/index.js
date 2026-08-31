import fs from "node:fs";
import stripe from "./stripe/index.js";
import razorpay from "./razorpay/index.js";
import paypal from "./paypal/index.js";

export const PAYMENT_PROVIDERS = ["STRIPE", "RAZORPAY", "PAYPAL"];

export function getConfiguredPaymentGateways() {
  try {
    const config = fs.readFileSync("cmskit.config.json", "utf8");
    return (JSON.parse(config).paymentGateways ?? []).map((provider) => String(provider).toUpperCase());
  } catch {
    return [];
  }
}

export function getAdapter(provider) {
  const normalized = String(provider || "").toUpperCase();
  const adapters = { STRIPE: stripe, RAZORPAY: razorpay, PAYPAL: paypal };
  const adapter = adapters[normalized];
  if (!adapter) throw new Error(`Unsupported payment provider: ${provider}`);
  if (!getConfiguredPaymentGateways().includes(normalized)) {
    throw new Error(`${normalized.toLowerCase()} provider not configured`);
  }
  return adapter;
}

export function assertPaymentProvider(provider) {
  getAdapter(provider);
  return String(provider).toUpperCase();
}

export { stripe, razorpay, paypal };

export default { getAdapter, getConfiguredPaymentGateways, assertPaymentProvider };
