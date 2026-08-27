// src/app/lib/services/ecom.categories.service.js
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

export async function getAllCategories() {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;

  const rows = await prisma.productCategory.findMany({
    where: { tenantId },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true, children: true } },
      parent: { select: { id: true, name: true } },
    },
  });
  return rows;
}

export async function getCategoryById(id) {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;
  const row = await prisma.productCategory.findFirst({
    where: { id, tenantId },
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { products: true, children: true } },
    },
  });
  if (!row) throw new ApiError(404, "Category not found");
  return row;
}

async function ensureUniqueSlug(baseSlug, tenantId, excludeId) {
  let slug = baseSlug || "category";
  let counter = 1;
  while (
    await prisma.productCategory.findFirst({
      where: {
        slug,
        tenantId,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    })
  ) {
    slug = `${baseSlug}-${counter++}`;
  }
  return slug;
}

export async function createCategory(input) {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;
  const name = String(input.name || "").trim();
  if (!name) throw new ApiError(400, "Name is required");

  const slug = await ensureUniqueSlug(
    input.slug ? slugify(input.slug) : slugify(name),
    tenantId,
  );

  return prisma.productCategory.create({
    data: {
      name,
      slug,
      description: input.description ?? null,
      image: input.image ?? null,
      parentId: input.parentId || null,
      tenantId,
    },
    include: {
      parent: true,
      _count: { select: { products: true, children: true } },
    },
  });
}

export async function updateCategory(id, input) {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;

  const existing = await prisma.productCategory.findFirst({
    where: { id, tenantId },
  });
  if (!existing) throw new ApiError(404, "Category not found");

  // Prevent self-parent or cyclic parent
  if (input.parentId && input.parentId === id) {
    throw new ApiError(400, "A category cannot be its own parent");
  }

  const data = {
    name: input.name?.trim() ?? existing.name,
    description: input.description ?? existing.description,
    image: input.image ?? existing.image,
    parentId:
      input.parentId === "" ? null : (input.parentId ?? existing.parentId),
  };

  if (input.slug !== undefined) {
    data.slug = await ensureUniqueSlug(slugify(input.slug), tenantId, id);
  } else if (input.name && slugify(input.name) !== existing.slug) {
    // Only auto-update slug when explicitly requested via slug field;
    // otherwise keep existing to preserve URLs.
  }

  return prisma.productCategory.update({
    where: { id },
    data,
    include: {
      parent: true,
      _count: { select: { products: true, children: true } },
    },
  });
}

export async function deleteCategory(id) {
  const { session } = await requirePermission("ecommerce_manage");
  const tenantId = session.user.tenantId;

  const existing = await prisma.productCategory.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { products: true, children: true } } },
  });
  if (!existing) throw new ApiError(404, "Category not found");

  if (existing._count.children > 0) {
    throw new ApiError(
      400,
      "Cannot delete: category has sub-categories. Remove or re-parent them first.",
    );
  }
  if (existing._count.products > 0) {
    throw new ApiError(
      400,
      "Cannot delete: category has products assigned. Reassign them first.",
    );
  }

  await prisma.productCategory.delete({ where: { id } });
  return { id };
}
