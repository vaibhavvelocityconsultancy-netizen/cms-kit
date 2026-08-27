import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { requireAuth, requirePermission } from "../../withPermission";

function buildWhere(tenantId, search, filter) {
  const where = { tenantId };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  // filter narrows WHICH users show up — not which fields get returned.
  // shape of each customer object is always the same.
  if (filter === "products") where.orders = { some: {} };
  if (filter === "courses") where.enrollments = { some: {} };
  if (filter === "plans") where.subscriptions = { some: {} };

  // "all" (default) — any user with at least one purchase relation
  if (!filter || filter === "all") {
    where.OR = [
      ...(where.OR ?? []),
      ...(!search
        ? [
            { orders: { some: {} } },
            { enrollments: { some: {} } },
            { subscriptions: { some: {} } },
          ]
        : []),
    ];
    // note: if search is present, OR is already used for name/email —
    // combine with AND so search still narrows within "has any purchase"
    if (search) {
      where.AND = [
        {
          OR: [
            { orders: { some: {} } },
            { enrollments: { some: {} } },
            { subscriptions: { some: {} } },
          ],
        },
      ];
      delete where.OR;
      where.AND.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      });
    }
  }

  return where;
}

// get all custoers

export async function getCustomers({ search, filter, page, pageSize }) {
  await requirePermission("customers_view");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const where = buildWhere(tenantId, search, filter);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            enrollments: true,
            subscriptions: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const customers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
    ordersCount: u._count.orders,
    enrollmentsCount: u._count.enrollments,
    plansCount: u._count.subscriptions,
  }));

  return {
    customers,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getCustomerById(userId) {
  await requirePermission("customers_view");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const customerDetails = await prisma.user.findFirst({
    where: {
      id: Number(userId),
      tenantId,
    },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          updatedAt: true,
          status: true,
          paymentStatus: true, // ← add this
          total: true,
          _count: { select: { items: true } },
        },
      },
      enrollments: {
        orderBy: { purchasedAt: "desc" },
        select: {
          id: true,
          purchasedAt: true,
          billingCycle: true,
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              instructor: true,
              level: true,
              billingCycle: true,
              price: true,
            },
          },
        },
      },
      subscriptions: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          startsAt: true,
          currentPeriodEnd: true,
          status: true,
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              instructor: true,
              level: true,
              billingCycle: true,
              price: true,
            },
          },
        },
      },
    },
  });
  if (!customerDetails) throw new ApiError(404, "Customer not found");

  const { password, ...customer } = customerDetails;
  return customer;
}

export async function deleteOrder(orderId) {
  await requirePermission("customers_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const checkOrder = await prisma.order.findFirst({
    where: {
      id: orderId,
      tenantId,
    },
  });

  if (!checkOrder) throw new ApiError(404, "Order not found");

  return prisma.order.delete({ where: { id: orderId } });
}

export async function deleteEnrollment(enrollmentId) {
  await requirePermission("customers_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const checkEnrollment = await prisma.courseEnrollment.findFirst({
    where: {
      id: Number(enrollmentId),
      user: { tenantId },
    },
  });

  if (!checkEnrollment) throw new ApiError(404, "Enrollment not found");

  return prisma.courseEnrollment.delete({
    where: { id: Number(enrollmentId) },
  });
}
