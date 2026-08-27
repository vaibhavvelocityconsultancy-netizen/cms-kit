import { prisma } from "../../prisma.js";

const productSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  shortDescription: true,
  price: true,
  compareAtPrice: true,
  inStock: true,
  stockQuantity: true,
  isFeatured: true,
  categories: { select: { id: true, name: true, slug: true } },
  images: {
    orderBy: { sortOrder: "asc" },
    select: { url: true, altText: true },
  },
};

async function getOrCreateCart(sessionId, tenantId, userId) {
  return prisma.cart.upsert({
    where: { sessionId },
    create: { sessionId, tenantId, userId: userId ?? null },
    update: userId ? { userId } : {},
    include: {
      items: { include: { product: { select: productSelect }, variant: true } },
    },
  });
}

function serializeCart(cart) {
  const items = cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    product: {
      ...item.product,
      price: Number(item.variant?.price ?? item.product.price),
      compareAtPrice:
        item.product.compareAtPrice === null
          ? null
          : Number(item.product.compareAtPrice),
      images: item.product.images ?? [],
      categories: item.product.categories ?? [],
    },
  }));

  return {
    id: cart.id,
    items,
    count: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0,
    ),
  };
}

export async function getCart(sessionId, tenantId, userId) {
  return serializeCart(await getOrCreateCart(sessionId, tenantId, userId));
}

export async function addCartItem(sessionId, tenantId, userId, input) {
  const quantity = Math.max(
    1,
    Math.min(10, Math.floor(Number(input.quantity) || 1)),
  );
  const product = await prisma.product.findFirst({
    where: { id: input.productId, tenantId, status: "PUBLISHED" },
    select: { id: true, inStock: true, stockQuantity: true },
  });
  if (!product) throw new Error("Product not found");
  if (!product.inStock || product.stockQuantity < quantity)
    throw new Error("Product is out of stock");

  if (input.variantId) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: input.variantId, productId: product.id },
    });
    if (!variant || !variant.inStock || variant.stockQuantity < quantity)
      throw new Error("Product variant is unavailable");
  }

  const cart = await getOrCreateCart(sessionId, tenantId, userId);
  const existing = cart.items.find(
    (item) =>
      item.productId === input.productId &&
      (item.variantId ?? null) === (input.variantId ?? null),
  );
  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: Math.min(10, existing.quantity + quantity) },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: input.productId,
        variantId: input.variantId ?? null,
        quantity,
      },
    });
  }
  return getCart(sessionId, tenantId, userId);
}

export async function updateCartItem(sessionId, tenantId, userId, input) {
  const cart = await getOrCreateCart(sessionId, tenantId, userId);
  const item = cart.items.find((entry) => entry.id === input.itemId);
  if (!item) throw new Error("Cart item not found");
  const quantity = Math.max(
    1,
    Math.min(10, Math.floor(Number(input.quantity) || 1)),
  );
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
  return getCart(sessionId, tenantId, userId);
}

export async function removeCartItem(sessionId, tenantId, userId, itemId) {
  const cart = await getOrCreateCart(sessionId, tenantId, userId);
  const item = cart.items.find((entry) => entry.id === itemId);
  if (item) await prisma.cartItem.delete({ where: { id: item.id } });
  return getCart(sessionId, tenantId, userId);
}

export async function clearCart(sessionId, tenantId, userId) {
  const cart = await getOrCreateCart(sessionId, tenantId, userId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return getCart(sessionId, tenantId, userId);
}
