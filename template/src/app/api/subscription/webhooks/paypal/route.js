import { prisma } from "@/src/app/lib/prisma";
import { verifyPaypalWebhook } from "@/src/app/lib/services/subscription/paypal.service";
import { NextResponse } from "next/server";

export async function POST(request) {
  const body = await request.text(); // raw body needed for signature verification
  const headers = Object.fromEntries(request.headers);

  let isValid;
  try {
    isValid = await verifyPaypalWebhook(headers, body);
  } catch (err) {
    console.error("Webhook verification error:", err.message);
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  if (!isValid) {
    console.warn("⚠️ Invalid PayPal webhook signature — rejecting");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  const eventType = event.event_type;
  const resource = event.resource;

  console.log(`📩 PayPal webhook received: ${eventType}`);

  try {
    switch (eventType) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        await handleActivated(resource);
        break;

      case "PAYMENT.SALE.COMPLETED":
        await handleRenewal(resource);
        break;

      case "BILLING.SUBSCRIPTION.CANCELLED":
        await handleCancelled(resource);
        break;

      case "BILLING.SUBSCRIPTION.SUSPENDED":
      case "BILLING.SUBSCRIPTION.EXPIRED":
        await handleSuspendedOrExpired(resource);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${eventType}`);
    }
  } catch (err) {
    console.error(`❌ Error processing ${eventType}:`, err.message);
    // Still return 200 — PayPal retries on non-2xx, and if our own DB logic
    // failed, retrying the same event won't fix it. Log for manual follow-up instead.
  }

  return NextResponse.json({ received: true });
}

async function handleActivated(resource) {
  const paypalSubscriptionId = resource.id;

  const subscription = await prisma.planSubscription.findUnique({
    where: { paypalSubscriptionId },
    include: { plan: true },
  });
  if (!subscription) {
    console.warn(
      `⚠️ No matching subscription for PayPal ID ${paypalSubscriptionId}`,
    );
    return;
  }

  const currentPeriodEnd = computeNextPeriodEnd(subscription.billingCycle);

  await prisma.planSubscription.update({
    where: { id: subscription.id },
    data: { status: "ACTIVE", startsAt: new Date(), currentPeriodEnd },
  });

  const amount =
    subscription.billingCycle === "YEARLY"
      ? subscription.plan?.yearlyPrice
      : subscription.plan?.monthlyPrice;

  await prisma.payment.create({
    data: {
      userId: subscription.userId,
      planId: subscription.planId,
      billingCycle: subscription.billingCycle,
      amount: Math.round(Number(amount) * 100),
      currency: process.env.PAYPAL_DEFAULT_CURRENCY || "USD",
      status: "SUCCESS",
      paypalSubscriptionId: subscription.paypalSubscriptionId,
    },
  });

  console.log(`✅ Subscription ${subscription.id} activated`);
}

async function handleRenewal(resource) {
  // PAYMENT.SALE.COMPLETED resource has billing_agreement_id for subscriptions
  const paypalSubscriptionId = resource.billing_agreement_id;
  if (!paypalSubscriptionId) return; // not a subscription payment

  const subscription = await prisma.planSubscription.findUnique({
    where: { paypalSubscriptionId },
    include: { plan: true },
  });
  if (!subscription) {
    console.warn(
      `⚠️ No matching subscription for PayPal ID ${paypalSubscriptionId}`,
    );
    return;
  }

  const currentPeriodEnd = computeNextPeriodEnd(subscription.billingCycle);

  await prisma.planSubscription.update({
    where: { id: subscription.id },
    data: { status: "ACTIVE", currentPeriodEnd },
  });

  const amount =
    subscription.billingCycle === "YEARLY"
      ? subscription.plan?.yearlyPrice
      : subscription.plan?.monthlyPrice;

  await prisma.payment.create({
    data: {
      userId: subscription.userId,
      planId: subscription.planId,
      billingCycle: subscription.billingCycle,
      amount: Math.round(Number(amount) * 100),
      currency:
        resource.amount?.currency ||
        process.env.PAYPAL_DEFAULT_CURRENCY ||
        "USD",
      status: "SUCCESS",
      paypalSubscriptionId: subscription.paypalSubscriptionId,
    },
  });

  console.log(
    `🔄 Subscription ${subscription.id} renewed, extended to ${currentPeriodEnd}`,
  );
}

async function handleCancelled(resource) {
  const paypalSubscriptionId = resource.id;

  const subscription = await prisma.planSubscription.findUnique({
    where: { paypalSubscriptionId },
  });
  if (!subscription) return;

  await prisma.planSubscription.update({
    where: { id: subscription.id },
    data: { status: "CANCELED", canceledAt: new Date() },
  });

  console.log(`🛑 Subscription ${subscription.id} cancelled`);
}

async function handleSuspendedOrExpired(resource) {
  const paypalSubscriptionId = resource.id;

  const subscription = await prisma.planSubscription.findUnique({
    where: { paypalSubscriptionId },
  });
  if (!subscription) return;

  await prisma.planSubscription.update({
    where: { id: subscription.id },
    data: { status: "EXPIRED" },
  });

  console.log(`⏸️ Subscription ${subscription.id} suspended/expired`);
}

function computeNextPeriodEnd(billingCycle) {
  const end = new Date();
  if (billingCycle === "YEARLY") {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}
