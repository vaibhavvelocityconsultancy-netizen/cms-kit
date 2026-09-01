import { getAdapter, assertPaymentProvider } from "../../payments/index.js";
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { sendTriggerEmails } from "../../email";
import { getPaymentOrderReference } from "./payment-reference.js";

const TRIGGER_BY_TYPE = {
  PLAN: "ORDER_PLACED",
  PRODUCT: "PRODUCT_PURCHASED",
};

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

export async function updatePaymentStatus(providerOrderId, status) {
  return prisma.payment.updateMany({
    where: { providerOrderId },
    data: { status },
  });
}

export async function getPayment(providerOrderId) {
  return prisma.payment.findUnique({ where: { providerOrderId } });
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

    const captureId =
      capture.purchase_units?.[0]?.payments?.captures?.[0]?.id ??
      capture.paymentId ??
      capture.id ??
      null;

    await prisma.payment.updateMany({
      where: { providerOrderId: orderId },
      data: {
        status: "SUCCESS",
        providerPaymentId: captureId,
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
