// src/app/lib/services/ecom.shipping.service.js
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { requirePermission } from "../../withPermission";

export async function getAllZones() {
  const { session } = await requirePermission("ecommerce_manage");
  return prisma.shippingZone.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { name: "asc" },
    include: { rates: true, _count: { select: { rates: true } } },
  });
}

export async function getZoneById(id) {
  const { session } = await requirePermission("ecommerce_manage");
  const row = await prisma.shippingZone.findFirst({
    where: { id, tenantId: session.user.tenantId },
    include: { rates: true },
  });
  if (!row) throw new ApiError(404, "Zone not found");
  return row;
}

function normalizeRates(rates) {
  return (Array.isArray(rates) ? rates : [])
    .map((r, i) => ({
      id: r.id || undefined,
      name: String(r.name || "").trim(),
      type: r.type === "FREE" ? "FREE" : "FLAT",
      cost: Number(r.cost ?? 0),
      minOrderValue:
        r.minOrderValue === null ||
        r.minOrderValue === undefined ||
        r.minOrderValue === ""
          ? null
          : Number(r.minOrderValue),
      sortOrder: i,
    }))
    .filter((r) => r.name);
}

export async function createZone(input) {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;
  const name = String(input.name || "").trim();
  if (!name) throw new ApiError(400, "Name is required");

  const countries = Array.isArray(input.countries) ? input.countries : [];
  const rates = normalizeRates(input.rates);

  return prisma.shippingZone.create({
    data: {
      name,
      countries,
      tenantId,
      rates: {
        create: rates.map((r) => ({
          name: r.name,
          type: r.type,
          cost: r.cost,
          minOrderValue: r.minOrderValue,
        })),
      },
    },
    include: { rates: true },
  });
}

export async function updateZone(id, input) {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;
  const existing = await prisma.shippingZone.findFirst({
    where: { id, tenantId },
  });
  if (!existing) throw new ApiError(404, "Zone not found");

  const rates = normalizeRates(input.rates);

  return prisma.$transaction(async (tx) => {
    await tx.shippingZone.update({
      where: { id },
      data: {
        name: input.name?.trim() ?? existing.name,
        countries: Array.isArray(input.countries)
          ? input.countries
          : existing.countries,
      },
    });
    if (Array.isArray(input.rates)) {
      const incomingIds = rates.filter((r) => r.id).map((r) => r.id);
      await tx.shippingRate.deleteMany({
        where: { zoneId: id, id: { notIn: incomingIds } },
      });
      for (const r of rates) {
        if (r.id) {
          await tx.shippingRate.update({
            where: { id: r.id },
            data: {
              name: r.name,
              type: r.type,
              cost: r.cost,
              minOrderValue: r.minOrderValue,
            },
          });
        } else {
          await tx.shippingRate.create({
            data: {
              zoneId: id,
              name: r.name,
              type: r.type,
              cost: r.cost,
              minOrderValue: r.minOrderValue,
            },
          });
        }
      }
    }
    return tx.shippingZone.findFirst({
      where: { id, tenantId },
      include: { rates: true },
    });
  });
}

export async function deleteZone(id) {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;
  const existing = await prisma.shippingZone.findFirst({
    where: { id, tenantId },
  });
  if (!existing) throw new ApiError(404, "Zone not found");
  await prisma.shippingZone.delete({ where: { id } });
  return { id };
}
