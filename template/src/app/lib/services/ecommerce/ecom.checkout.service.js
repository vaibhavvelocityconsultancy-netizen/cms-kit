import { cookies } from "next/headers";
import { requireAuth } from "../../withPermission.js";
import { prisma } from "../../prisma.js";
import {
  createPayment,
  capturePayment,
} from "../common_urls/payment.service.js";
import { getCart, clearCart } from "./ecom.cart.service.js";
import { createOrder } from "./ecom.orders.service.js";

async function checkoutContext() {
  const session = await requireAuth();
  const sessionId = (await cookies()).get("storefront-cart")?.value;
  if (!sessionId) throw new Error("Your cart is empty");
  return {
    sessionId,
    userId: Number(session.user.id),
    tenantId: Number(session.user.tenantId),
  };
}

export async function createEcommercePayment() {
  const context = await checkoutContext();
  const cart = await getCart(
    context.sessionId,
    context.tenantId,
    context.userId,
  );
  if (!cart.items.length) throw new Error("Your cart is empty");
  const settings = await prisma.ecommerceSettings.findUnique({
    where: { tenantId: context.tenantId },
  });
  const shippingCost = cart.subtotal >= 150 ? 0 : 12;
  const payment = await createPayment({
    userId: context.userId,
    amount: cart.subtotal + shippingCost,
    currency: settings?.currency ?? "USD",
    paymentType: "PRODUCT",
    referenceId: cart.id,
  });
  return { ...payment, cart, shippingCost };
}

export async function completeEcommercePayment(
  paypalOrderId,
  shippingAddress,
  billingAddress,
) {
  const context = await checkoutContext();
  await capturePayment(paypalOrderId);
  const cart = await getCart(
    context.sessionId,
    context.tenantId,
    context.userId,
  );
  if (!cart.items.length) throw new Error("Your cart is empty");
  const order = await createOrder({
    items: cart.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    })),
    shippingAddress,
    billingAddress: billingAddress ?? shippingAddress,
    paymentMethod: "PAYPAL",
  });
  await prisma.order
    .update({
      where: { id: order.id },
      data: { paymentStatus: "PAID", status: "PROCESSING", paypalOrderId },
    })
    .catch(() => {});
  await clearCart(context.sessionId, context.tenantId, context.userId);
  return order;
}
