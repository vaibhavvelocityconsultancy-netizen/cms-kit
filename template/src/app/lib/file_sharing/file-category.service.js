import { prisma } from "../prisma";
import { requireAuth, requirePermission } from "../withPermission";
import { randomUUID } from "crypto";
import { ApiError } from "../utils/ApiError";

function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function ensureUniqueSlug(slug, tenantId, excludeId = null) {
  const existing = await prisma.fileCategory.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
  });
  if (!existing) return slug;
  if (excludeId && existing.id === excludeId) return slug;
  throw new ApiError(409, `Slug "${slug}" is already taken for this tenant`);
}

export async function getAllFileCategories() {
  await requirePermission("taxonomy_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  return prisma.fileCategory.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { files: true, children: true } },
    },
  });
}

export async function getFileCategoryById(categoryId) {
  await requirePermission("taxonomy_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  return prisma.fileCategory.findFirst({
    where: {
      id: categoryId,
      tenantId,
    },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          files: true,
          children: true,
        },
      },
    },
  });
}

export async function createFileCategory(data) {
  await requirePermission("taxonomy_manage");
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  if (!data.name?.trim()) {
    throw new ApiError(400, "Name is required");
  }

  if (data.parentId) {
    const parent = await prisma.fileCategory.findUnique({
      where: { id: data.parentId, tenantId },
    });
    if (!parent) {
      throw new ApiError(400, "Parent category not found for this tenant");
    }
  }

  const slug = data.slug?.trim() || generateSlug(data.name);
  const uniqueSlug = await ensureUniqueSlug(slug, tenantId);

  return prisma.fileCategory.create({
    data: {
      id: randomUUID(),
      name: data.name,
      slug: uniqueSlug,
      description: data.description ?? null,
      parentId: data.parentId || null,
      tenantId,
    },
  });
}

export async function updateFileCategory(categoryId, data) {
  await requirePermission("taxonomy_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  // First verify the record belongs to the current tenant
  const existingCategory = await prisma.fileCategory.findUnique({
    where: {
      id: categoryId,
      tenantId,
    },
  });

  if (!existingCategory) {
    return null; // Will be handled as 404 by controller
  }

  // Remove tenantId from input if present (never trust it)
  const { id: _, tenantId: inputTenantId, ...rest } = data;

  if (rest.name && !rest.slug) rest.slug = generateSlug(rest.name);
  if (rest.slug) {
    rest.slug = generateSlug(rest.slug);
    // fixed: was calling a function that didn't exist (ensureUniqueSlugForTenant)
    rest.slug = await ensureUniqueSlug(rest.slug, tenantId, categoryId);
  }

  if (rest.parentId === categoryId) {
    throw new ApiError(400, "Category cannot be its own parent");
  }
  if (rest.parentId) {
    const parent = await prisma.fileCategory.findUnique({
      where: { id: rest.parentId, tenantId },
    });
    if (!parent) {
      throw new ApiError(400, "Parent category not found for this tenant");
    }
  }

  return prisma.fileCategory.update({
    where: { id: categoryId, tenantId },
    data: rest,
  });
}

export async function deleteFileCategory(categoryId) {
  await requirePermission("taxonomy_manage");
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const existing = await prisma.fileCategory.findUnique({
    where: { id: categoryId, tenantId },
    include: { _count: { select: { files: true, children: true } } },
  });

  if (!existing) return null; // controller returns 404

  if (existing._count.files > 0) {
    throw new ApiError(400, "Cannot delete category with files assigned to it");
  }
  if (existing._count.children > 0) {
    throw new ApiError(400, "Cannot delete category with subcategories");
  }

  return prisma.fileCategory.delete({
    where: { id: categoryId, tenantId },
  });
}