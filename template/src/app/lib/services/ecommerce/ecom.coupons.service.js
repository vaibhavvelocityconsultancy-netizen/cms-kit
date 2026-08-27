// src/app/lib/services/ecom.coupons.service.js
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { requirePermission } from "../../withPermission";

export async function getAllCoupons(params = {}) {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;
  const { search = "", status = "", page = 1, limit = 10 } = params;
  const skip = (Number(page) - 1) * Number(limit);

  const where = { tenantId };
  if (search)
    where.code = {
      contains: String(search).toUpperCase(),
      mode: "insensitive",
    };
  const now = new Date();
  if (status === "active") {
    where.isActive = true;
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: now } }];
  } else if (status === "expired") {
    where.OR = [{ isActive: false }, { expiresAt: { lt: now } }];
  }

  const [total, coupons] = await Promise.all([
    prisma.coupon.count({ where }),
    prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    }),
  ]);

  return {
    coupons,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
}

export async function getCouponById(id) {
  const { session } = await requirePermission("ecommerce_manage");
  const row = await prisma.coupon.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });
  if (!row) throw new ApiError(404, "Coupon not found");
  return row;
}

function normalize(input) {
  return {
    code: String(input.code || "")
      .trim()
      .toUpperCase(),
    type: input.type === "FIXED" ? "FIXED" : "PERCENTAGE",
    value: Number(input.value ?? 0),
    minOrderValue:
      input.minOrderValue === null ||
      input.minOrderValue === undefined ||
      input.minOrderValue === ""
        ? null
        : Number(input.minOrderValue),
    maxUses:
      input.maxUses == null || input.maxUses === ""
        ? null
        : Number(input.maxUses),
    isActive: input.isActive === undefined ? true : Boolean(input.isActive),
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
  };
}

export async function createCoupon(input) {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;
  const data = normalize(input);
  if (!data.code) throw new ApiError(400, "Code is required");
  const existing = await prisma.coupon.findFirst({
    where: { code: data.code, tenantId },
  });
  if (existing) throw new ApiError(400, `Coupon "${data.code}" already exists`);
  return prisma.coupon.create({ data: { ...data, tenantId } });
}

export async function updateCoupon(id, input) {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;
  const existing = await prisma.coupon.findFirst({ where: { id, tenantId } });
  if (!existing) throw new ApiError(404, "Coupon not found");
  const data = normalize({ ...existing, ...input });
  if (data.code && data.code !== existing.code) {
    const dupe = await prisma.coupon.findFirst({
      where: { code: data.code, tenantId, NOT: { id } },
    });
    if (dupe) throw new ApiError(400, `Coupon "${data.code}" already exists`);
  }
  return prisma.coupon.update({ where: { id }, data });
}

export async function deleteCoupon(id) {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;
  const existing = await prisma.coupon.findFirst({ where: { id, tenantId } });
  if (!existing) throw new ApiError(404, "Coupon not found");
  await prisma.coupon.delete({ where: { id } });
  return { id };
}
