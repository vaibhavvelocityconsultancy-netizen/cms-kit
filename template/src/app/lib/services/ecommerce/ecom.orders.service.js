import { prisma } from "../../prisma";
import { requireAuth, requirePermission } from "../../withPermission";

function generateOrderNumber(prefix = "ORD-") {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}${ts}${rand}`;
}

// ═══════════════════════════════════════════════════════════
// LIST
// ═══════════════════════════════════════════════════════════

export async function getAllOrders(query = {}) {
  await requirePermission("orders_view");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const {
    status,
    paymentStatus,
    search,
    dateFrom,
    dateTo,
    from,
    to,
    page = 1,
    limit = 20,
  } = query;

  const where = { tenantId };

  if (status) where.status = status;
  if (paymentStatus) where.paymentStatus = paymentStatus;

  const createdFrom = dateFrom ?? from;
  const createdTo = dateTo ?? to;
  if (createdFrom || createdTo) {
    where.createdAt = {};
    if (createdFrom) where.createdAt.gte = new Date(createdFrom);
    if (createdTo) where.createdAt.lte = new Date(createdTo);
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

// ═══════════════════════════════════════════════════════════
// GET ONE
// ═══════════════════════════════════════════════════════════

export async function getOrderById(id) {
  await requirePermission("orders_view");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const order = await prisma.order.findFirst({
    where: { id, tenantId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          product: { select: { id: true, title: true, slug: true } },
          variant: { select: { id: true, sku: true } },
        },
      },
      notes: { orderBy: { createdAt: "desc" } },
    },
  });

  return order;
}

export async function getCustomerOrderById(id) {
  const session = await requireAuth();
  return prisma.order.findFirst({
    where: {
      id,
      tenantId: Number(session.user.tenantId),
      userId: Number(session.user.id),
    },
    include: {
      items: {
        select: { id: true, productTitle: true, quantity: true, total: true },
      },
    },
  });
}

// ═══════════════════════════════════════════════════════════
// CREATE  (called from checkout flow, not admin UI)
// ═══════════════════════════════════════════════════════════

export async function createOrder(input) {
  const session = await requireAuth();
  const tenantId = session.user.tenantId;
  const userId = session.user.id;

  const {
    items, // [{ productId, variantId?, quantity }]
    shippingAddress,
    billingAddress,
    couponCode,
    paymentMethod = "STRIPE",
  } = input;

  if (!items?.length) throw new Error("Order must have at least one item");

  const settings = await prisma.EcommerceSettings.findUnique({
    where: { tenantId },
  });

  const orderNumber = generateOrderNumber(settings?.orderNumberPrefix);

  // Resolve product/variant prices server-side — never trust client price
  const resolvedItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, tenantId },
    });
    if (!product) throw new Error(`Product ${item.productId} not found`);

    let price = Number(product.price);
    let sku = product.sku;

    if (item.variantId) {
      const variant = await prisma.productVariant.findFirst({
        where: { id: item.variantId, productId: product.id },
      });
      if (!variant) throw new Error(`Variant ${item.variantId} not found`);
      price = Number(variant.price);
      sku = variant.sku;
    }

    const lineTotal = price * item.quantity;
    subtotal += lineTotal;

    resolvedItems.push({
      productId: product.id,
      variantId: item.variantId ?? null,
      productTitle: product.title,
      sku,
      price,
      quantity: item.quantity,
      total: lineTotal,
    });
  }

  // Discount
  let discountAmount = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { tenantId_code: { tenantId, code: couponCode.toUpperCase() } },
    });

    if (coupon && coupon.isActive) {
      const now = new Date();
      const withinWindow =
        (!coupon.startsAt || coupon.startsAt <= now) &&
        (!coupon.expiresAt || coupon.expiresAt >= now);
      const underLimit = !coupon.maxUses || coupon.usedCount < coupon.maxUses;
      const meetsMin =
        !coupon.minOrderValue || subtotal >= Number(coupon.minOrderValue);

      if (withinWindow && underLimit && meetsMin) {
        discountAmount =
          coupon.type === "PERCENTAGE"
            ? (subtotal * Number(coupon.value)) / 100
            : Number(coupon.value);

        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }
  }

  // Shipping — cheapest matching zone rate, flat for phase 1
  let shippingCost = 0;
  const zone = await prisma.shippingZone.findFirst({
    where: {
      tenantId,
      countries: { array_contains: shippingAddress.country },
    },
    include: { rates: true },
  });

  if (zone?.rates?.length) {
    const applicable = zone.rates.filter(
      (r) =>
        r.type === "FLAT" ||
        (r.type === "FREE" &&
          (!r.minOrderValue || subtotal >= Number(r.minOrderValue))),
    );
    if (applicable.length) {
      shippingCost = Math.min(...applicable.map((r) => Number(r.cost)));
    }
  }

  // Tax — first matching tax rate for country, phase 1 simple lookup
  let taxAmount = 0;
  const taxRate = await prisma.taxRate.findFirst({
    where: {
      country: shippingAddress.country,
      taxClass: { tenantId },
    },
  });
  if (taxRate) {
    const taxableAmount = subtotal - discountAmount;
    taxAmount = (taxableAmount * Number(taxRate.rate)) / 100;
  }

  const total = subtotal - discountAmount + shippingCost + taxAmount;

  const order = await prisma.order.create({
    data: {
      tenantId,
      userId: Number(userId),
      orderNumber,
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentMethod,
      subtotal,
      shippingCost,
      taxAmount,
      discountAmount,
      total,
      currency: settings?.currency ?? "INR",
      couponCode: couponCode ?? null,
      shippingAddress,
      billingAddress,
      items: { create: resolvedItems },
    },
    include: { items: true },
  });

  return order;
}

// ═══════════════════════════════════════════════════════════
// UPDATE STATUS
// ═══════════════════════════════════════════════════════════

export async function updateOrderStatus(id, status) {
  await requirePermission("orders_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const existing = await prisma.order.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error("Order not found");

  const order = await prisma.order.update({
    where: { id },
    data: { status },
  });

  return order;
}

export async function updatePaymentStatus(id, paymentStatus, stripeData = {}) {
  await requirePermission("orders_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const existing = await prisma.order.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error("Order not found");

  const order = await prisma.order.update({
    where: { id },
    data: {
      paymentStatus,
      stripeSessionId: stripeData.sessionId ?? undefined,
      stripePaymentIntentId: stripeData.paymentIntentId ?? undefined,
      status: paymentStatus === "PAID" ? "PROCESSING" : undefined,
    },
  });

  return order;
}

// ═══════════════════════════════════════════════════════════
// NOTES
// ═══════════════════════════════════════════════════════════

export async function addOrderNote(
  orderId,
  { note, isCustomerVisible = false },
) {
  await requirePermission("orders_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
  });
  if (!order) throw new Error("Order not found");

  return prisma.orderNote.create({
    data: { orderId, note, isCustomerVisible },
  });
}

// ═══════════════════════════════════════════════════════════
// DELETE (rare — usually cancel via status, not hard delete)
// ═══════════════════════════════════════════════════════════

export async function deleteOrder(id) {
  await requirePermission("orders_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const existing = await prisma.order.findFirst({ where: { id, tenantId } });
  if (!existing) return null;

  return prisma.order.delete({ where: { id } });
}
