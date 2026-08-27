import paypal from "@paypal/checkout-server-sdk";
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
}) {
  if (!userId) throw new ApiError(400, "User ID is required");
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    throw new ApiError(400, "Payment amount must be greater than zero");
  }

  const client = paypalClient();
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    application_context: {
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
    purchase_units: [
      {
        amount: {
          currency_code: currency.toUpperCase(),
          value: numericAmount.toFixed(2),
        },
        custom_id: `${userId}:${paymentType}:${referenceId ?? ""}`,
      },
    ],
  });

  const { result: order } = await client.execute(request);

  await prisma.payment.create({
    data: {
      userId: Number(userId),
      ...buildPaymentReference(paymentType, referenceId),
      billingCycle,
      paypalOrderId: order.id,
      amount: Math.round(numericAmount * 100),
      currency: currency.toUpperCase(),
      status: "PENDING",
    },
  });

  return {
    orderId: order.id,
    status: order.status,
    approvalUrl: order.links?.find((link) => link.rel === "approve")?.href,
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

export async function capturePayment(orderId) {
  const client = paypalClient();
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const { result: capture } = await client.execute(request);

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
