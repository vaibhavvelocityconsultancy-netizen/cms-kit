// src/app/lib/services/ecom.attributes.service.js
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { requirePermission } from "../../withPermission";

function slugify(v) {
  return String(v || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function uniqueSlug(base, tenantId, excludeId) {
  let slug = base || "attribute";
  let n = 1;
  while (
    await prisma.attribute.findFirst({
      where: {
        slug,
        tenantId,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    })
  ) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export async function getAllAttributes() {
  const { session } = await requirePermission("ecommerce_manage");
  return prisma.attribute.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { name: "asc" },
    include: {
      values: { orderBy: { sortOrder: "asc" } },
      _count: { select: { values: true } },
    },
  });
}

export async function getAttributeById(id) {
  const { session } = await requirePermission("ecommerce_manage");
  const row = await prisma.attribute.findFirst({
    where: { id, tenantId: session.user.tenantId },
    include: { values: { orderBy: { sortOrder: "asc" } } },
  });
  if (!row) throw new ApiError(404, "Attribute not found");
  return row;
}

export async function createAttribute(input) {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;
  const name = String(input.name || "").trim();
  if (!name) throw new ApiError(400, "Name is required");
  const slug = await uniqueSlug(
    input.slug ? slugify(input.slug) : slugify(name),
    tenantId,
  );

  const values = Array.isArray(input.values) ? input.values : [];
  return prisma.attribute.create({
    data: {
      name,
      slug,
      tenantId,
      values: {
        create: values
          .filter((v) => String(v.value || "").trim())
          .map((v, i) => ({
            value: String(v.value).trim(),
            sortOrder: v.sortOrder ?? i,
          })),
      },
    },
    include: { values: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function updateAttribute(id, input) {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;
  const existing = await prisma.attribute.findFirst({
    where: { id, tenantId },
  });
  if (!existing) throw new ApiError(404, "Attribute not found");

  const data = { name: input.name?.trim() ?? existing.name };
  if (input.slug !== undefined)
    data.slug = await uniqueSlug(slugify(input.slug), tenantId, id);

  // Replace values in a single transaction
  const values = Array.isArray(input.values) ? input.values : null;

  return prisma.$transaction(async (tx) => {
    await tx.attribute.update({ where: { id }, data });
    if (values) {
      const incomingIds = values.filter((v) => v.id).map((v) => v.id);
      await tx.attributeValue.deleteMany({
        where: { attributeId: id, id: { notIn: incomingIds } },
      });
      for (let i = 0; i < values.length; i++) {
        const v = values[i];
        const clean = String(v.value || "").trim();
        if (!clean) continue;
        if (v.id) {
          await tx.attributeValue.update({
            where: { id: v.id },
            data: { value: clean, sortOrder: i },
          });
        } else {
          await tx.attributeValue.create({
            data: { attributeId: id, value: clean, sortOrder: i },
          });
        }
      }
    }
    return tx.attribute.findFirst({
      where: { id, tenantId },
      include: { values: { orderBy: { sortOrder: "asc" } } },
    });
  });
}

export async function deleteAttribute(id) {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;
  const existing = await prisma.attribute.findFirst({
    where: { id, tenantId },
  });
  if (!existing) throw new ApiError(404, "Attribute not found");
  await prisma.attribute.delete({ where: { id } });
  return { id };
}
