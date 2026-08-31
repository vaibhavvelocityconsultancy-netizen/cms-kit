import Razorpay from "razorpay";
import crypto from "node:crypto";

function client() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) throw new Error("razorpay provider not configured");
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}

export async function createPayment({ amount, currency = "INR", receipt, notes }) {
  const order = await client().orders.create({ amount: Math.round(Number(amount) * 100), currency: currency.toUpperCase(), receipt, notes });
  return { id: order.id, status: order.status, amount: order.amount, currency: order.currency };
}

export function verifyPayment({ orderId, paymentId, signature }) {
  if (!process.env.RAZORPAY_KEY_SECRET) throw new Error("razorpay provider not configured");
  const digest = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(String(signature)));
}

export async function retrievePayment(id) { return client().payments.fetch(id); }
export default { createPayment, verifyPayment, retrievePayment };
