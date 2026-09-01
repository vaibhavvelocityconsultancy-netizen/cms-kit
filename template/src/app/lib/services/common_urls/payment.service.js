import paypal from "@paypal/checkout-server-sdk";
import { getAdapter, assertPaymentProvider } from "../../payments/index.js";
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { sendTriggerEmails } from "../../email";
import { getPaymentOrderReference } from "./payment-reference.js";

const TRIGGER_BY_TYPE = {
  PLAN: "ORDER_PLACED",
  PRODUCT: "PRODUCT_PURCHASED",
};

function paypalClient() {
  const env =
    process.env.PAYPAL_MODE === "live"
      ? new paypal.core.LiveEnvironment(
          process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET,
        )
      : new paypal.core.SandboxEnvironment(
          process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET,
        );
  return new paypal.core.PayPalHttpClient(env);
}

function buildPaymentReference(paymentType, referenceId) {
  if (!paymentType || !referenceId) return {};
  if (paymentType === "PLAN") return { planId: Number(referenceId) };
  return {};
}

export async function createPayment({
  userId,
  amount,
  currency = "USD",
  billingCycle = "LIFETIME",
  paymentType,
  referenceId,
  returnUrl,
  cancelUrl,
  provider = "PAYPAL",
}) {
  const normalizedProvider = assertPaymentProvider(provider);
  const adapter = getAdapter(normalizedProvider);
  if (!userId) throw new ApiError(400, "User ID is required");
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    throw new ApiError(400, "Payment amount must be greater than zero");
  }

  const order = await adapter.createPayment({ amount: numericAmount, currency, returnUrl, cancelUrl, userId, paymentType, referenceId, receipt: `${paymentType ?? "PAYMENT"}-${referenceId ?? ""}` });
  const orderId = order.id ?? order.orderId;
  const approvalUrl = order.approvalUrl;

  await prisma.payment.create({
    data: {
      userId: Number(userId),
      ...buildPaymentReference(paymentType, referenceId),
      billingCycle,
      provider: normalizedProvider,
      providerOrderId: orderId,
      amount: Math.round(numericAmount * 100),
      currency: currency.toUpperCase(),
      status: "PENDING",
    },
  });

  return {
    orderId,
    status: order.status,
    approvalUrl,
    amount: Math.round(numericAmount * 100),
    currency: currency.toUpperCase(),
  };
}

export async function updatePaymentStatus(paypalOrderId, status) {
  return prisma.payment.updateMany({
    where: { paypalOrderId },
    data: { status },
  });
}

export async function getPayment(paypalOrderId) {
  return prisma.payment.findUnique({ where: { paypalOrderId } });
}

export async function capturePayment(orderId, provider = "PAYPAL") {
  const adapter = getAdapter(provider);
  try {
    const capture = await adapter.capturePayment(orderId);

    // ✅ Check PayPal's own status value here
    if (capture.status !== "COMPLETED") {
      await updatePaymentStatus(orderId, "FAILED");
      throw new ApiError(400, "Payment not completed");
    }

    // ✅ Pull the real capture ID from PayPal's response
    const captureId =
      capture.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;

    // ✅ Save using YOUR enum value
    await prisma.payment.updateMany({
      where: { paypalOrderId: orderId },
      data: {
        status: "SUCCESS", // your Prisma enum value
        paypalCaptureId: captureId,
      },
    });

    return capture;
  } catch (err) {
    await updatePaymentStatus(orderId, "FAILED");

    console.error("PayPal Capture Error:", err);

    throw new ApiError(400, err?.message || "PayPal payment failed");
  }
}
async function sendPaymentSuccessEmail(payment) {
  const paymentType = payment.planId ? "PLAN" : "PRODUCT";
  const triggerEvent = TRIGGER_BY_TYPE[paymentType];
  if (!triggerEvent) return;

  await sendTriggerEmails(triggerEvent, {
    name: payment.user?.name,
    email: payment.user?.email,
    planName: payment.plan?.title,
    amount: payment.amount / 100,
    currency: payment.currency,
    billingCycle: payment.billingCycle,
  });
}

export async function getPaymentHistory(userId) {
  const payments = await prisma.payment.findMany({
    where: { userId: Number(userId) },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  return payments.map((payment) => ({
    ...payment,
    orderReference: getPaymentOrderReference(payment),
  }));
}
