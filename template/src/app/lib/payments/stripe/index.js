import Stripe from "stripe";

function client() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("stripe provider not configured");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function createPayment({ amount, currency = "USD", returnUrl, cancelUrl, metadata = {} }) {
  const session = await client().checkout.sessions.create({
    mode: "payment",
    line_items: [{ price_data: { currency: currency.toLowerCase(), product_data: { name: "CMSKit purchase" }, unit_amount: Math.round(Number(amount) * 100) }, quantity: 1 }],
    success_url: returnUrl,
    cancel_url: cancelUrl,
    metadata,
    integration_identifier: `cmskit_${Math.random().toString(36).slice(2, 10)}`,
  });
  return { id: session.id, checkoutUrl: session.url, status: session.status };
}

export async function retrievePayment(id) { return client().checkout.sessions.retrieve(id); }
export async function verifyPayment(id) { const session = await retrievePayment(id); return session.payment_status === "paid"; }
export async function handleWebhook(payload, signature) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error("stripe provider not configured");
  return client().webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
}

export default { createPayment, retrievePayment, verifyPayment, handleWebhook };
