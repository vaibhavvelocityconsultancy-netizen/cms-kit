// src/app/lib/services/ecom.taxes.service.js
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { requirePermission } from "../../withPermission";

export async function getAllTaxClasses() {
  const { session } = await requirePermission("ecommerce_manage");
  return prisma.taxClass.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { name: "asc" },
    include: { rates: true, _count: { select: { rates: true } } },
  });
}

export async function getTaxClassById(id) {
  const { session } = await requirePermission("ecommerce_manage");
  const row = await prisma.taxClass.findFirst({
    where: { id, tenantId: session.user.tenantId },
    include: { rates: true },
  });
  if (!row) throw new ApiError(404, "Tax class not found");
  return row;
}

function normalizeRates(rates) {
  return (Array.isArray(rates) ? rates : [])
    .map((r) => ({
      id: r.id || undefined,
      country: String(r.country || "").trim(),
      state: r.state ? String(r.state).trim() : null,
      rate: Number(r.rate ?? 0),
      isInclusive: Boolean(r.isInclusive),
    }))
    .filter((r) => r.country);
}

export async function createTaxClass(input) {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;
  const name = String(input.name || "").trim();
  if (!name) throw new ApiError(400, "Name is required");

  const rates = normalizeRates(input.rates);
  return prisma.taxClass.create({
    data: {
      name,
      tenantId,
      rates: {
        create: rates.map((r) => ({
          country: r.country,
          state: r.state,
          rate: r.rate,
          isInclusive: r.isInclusive,
        })),
      },
    },
    include: { rates: true },
  });
}

export async function updateTaxClass(id, input) {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;
  const existing = await prisma.taxClass.findFirst({ where: { id, tenantId } });
  if (!existing) throw new ApiError(404, "Tax class not found");

  const rates = normalizeRates(input.rates);

  return prisma.$transaction(async (tx) => {
    await tx.taxClass.update({
      where: { id },
      data: { name: input.name?.trim() ?? existing.name },
    });
    if (Array.isArray(input.rates)) {
      const incomingIds = rates.filter((r) => r.id).map((r) => r.id);
      await tx.taxRate.deleteMany({
        where: { taxClassId: id, id: { notIn: incomingIds } },
      });
      for (const r of rates) {
        if (r.id) {
          await tx.taxRate.update({
            where: { id: r.id },
            data: {
              country: r.country,
              state: r.state,
              rate: r.rate,
              isInclusive: r.isInclusive,
            },
          });
        } else {
          await tx.taxRate.create({
            data: {
              taxClassId: id,
              country: r.country,
              state: r.state,
              rate: r.rate,
              isInclusive: r.isInclusive,
            },
          });
        }
      }
    }
    return tx.taxClass.findFirst({
      where: { id, tenantId },
      include: { rates: true },
    });
  });
}

export async function deleteTaxClass(id) {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;
  const existing = await prisma.taxClass.findFirst({ where: { id, tenantId } });
  if (!existing) throw new ApiError(404, "Tax class not found");
  await prisma.taxClass.delete({ where: { id } });
  return { id };
}
