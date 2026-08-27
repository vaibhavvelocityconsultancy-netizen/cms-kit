// src/app/lib/services/ecom.brands.service.js
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
  let slug = base || "brand";
  let n = 1;
  while (
    await prisma.brand.findFirst({
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

export async function getAllBrands() {
  const { session } = await requirePermission("ecommerce_manage");
  return prisma.brand.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function getBrandById(id) {
  const { session } = await requirePermission("ecommerce_manage");
  const row = await prisma.brand.findFirst({
    where: { id, tenantId: session.user.tenantId },
    include: { _count: { select: { products: true } } },
  });
  if (!row) throw new ApiError(404, "Brand not found");
  return row;
}

export async function createBrand(input) {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;
  const name = String(input.name || "").trim();
  if (!name) throw new ApiError(400, "Name is required");
  const slug = await uniqueSlug(
    input.slug ? slugify(input.slug) : slugify(name),
    tenantId,
  );
  return prisma.brand.create({
    data: {
      name,
      slug,
      logo: input.logo ?? null,
      description: input.description ?? null,
      tenantId,
    },
    include: { _count: { select: { products: true } } },
  });
}

export async function updateBrand(id, input) {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;
  const existing = await prisma.brand.findFirst({ where: { id, tenantId } });
  if (!existing) throw new ApiError(404, "Brand not found");
  const data = {
    name: input.name?.trim() ?? existing.name,
    logo: input.logo ?? existing.logo,
    description: input.description ?? existing.description,
  };
  if (input.slug !== undefined) {
    data.slug = await uniqueSlug(slugify(input.slug), tenantId, id);
  }
  return prisma.brand.update({
    where: { id },
    data,
    include: { _count: { select: { products: true } } },
  });
}

export async function deleteBrand(id) {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;
  const existing = await prisma.brand.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { products: true } } },
  });
  if (!existing) throw new ApiError(404, "Brand not found");
  if (existing._count.products > 0) {
    throw new ApiError(400, "Cannot delete: brand has products assigned.");
  }
  await prisma.brand.delete({ where: { id } });
  return { id };
}
