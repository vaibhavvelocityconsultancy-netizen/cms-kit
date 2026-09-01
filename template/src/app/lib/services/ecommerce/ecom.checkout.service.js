import { cookies } from "next/headers";
import { requireAuth } from "../../withPermission.js";
import { prisma } from "../../prisma.js";
import { getAdapter } from "../../payments/index.js";
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

export async function createEcommercePayment(provider) {
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

  const adapter = getAdapter(provider);
  const payment = await adapter.createOrder(
    cart.subtotal + shippingCost,
    settings?.currency ?? "USD",
    { userId: context.userId, cartId: cart.id },
  );

  return { ...payment, cart, shippingCost, provider };
}

export async function completeEcommercePayment(
  provider,
  providerOrderId,
  providerPaymentId,
  shippingAddress,
  billingAddress,
) {
  const context = await checkoutContext();
  const adapter = getAdapter(provider);
  await adapter.verifyPayment(providerOrderId, providerPaymentId);

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
    paymentMethod: provider.toUpperCase(),
  });

  await prisma.order
    .update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        status: "PROCESSING",
        provider: provider.toUpperCase(),
        providerOrderId,
        providerPaymentId,
      },
    })
    .catch(() => {});

  await clearCart(context.sessionId, context.tenantId, context.userId);
  return order;
}