import { randomUUID } from "crypto";
import { prisma } from "../../prisma.js";
import { requireAuth, requirePermission } from "../../withPermission.js";
import { clearSitemapCache } from "../seo/sitemap.service.js";

// ─── Helpers ──────────────────────────────────────────────

function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function ensureUniqueSlugForTenant(slug, excludeId = null) {
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  try {
    const existing = await prisma.category.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug,
        },
      },
    });

    if (!existing) return slug;
    if (excludeId && existing.id === excludeId) return slug;
    throw new Error(`Slug "${slug}" is already taken for this tenant`);
  } catch (error) {
    if (error.code === "P2025") return slug; // Not found
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
// CATEGORY SERVICES
// ═══════════════════════════════════════════════════════════

export async function getAllCategories() {
  await requirePermission("taxonomy_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const categories = await prisma.category.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          post: true,
          other_category: true,
        },
      },
    },
  });

  return categories.map(({ category, _count, ...rest }) => ({
    ...rest,
    parent: category,
    _count: {
      post: _count.post,
      children: _count.other_category,
    },
  }));
}

export async function getCategoryById(id) {
  await requirePermission("taxonomy_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const category = await prisma.category.findUnique({
    where: {
      id,
      tenantId,
    },
    include: {
      category: true,
      other_category: true,
      post: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });

  if (!category) return null;

  const { category: parent, other_category, ...rest } = category;
  return {
    ...rest,
    parent,
    children: other_category,
  };
}

export async function createCategory(input) {
  await requirePermission("taxonomy_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  // Never trust input.tenantId - always use session tenantId

  const slug = input.slug?.trim()
    ? generateSlug(input.slug)
    : generateSlug(input.name);

  await ensureUniqueSlugForTenant(slug);

  const createCategory = await prisma.category.create({
    data: {
      id: randomUUID(),
      name: input.name,
      slug,
      description: input.description ?? null,
      parentId: input.parentId || null,
      tenantId, // Always use session tenantId
    },
  });

  await clearSitemapCache(tenantId);

  return createCategory;
}

export async function updateCategory(id, input) {
  await requirePermission("taxonomy_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  // First verify the record belongs to the current tenant
  const existingCategory = await prisma.category.findUnique({
    where: {
      id,
      tenantId,
    },
  });

  if (!existingCategory) {
    return null; // Will be handled as 404 by controller
  }

  // Remove fields that shouldn't be updated
  const {
    id: _,
    _count,
    posts,
    parent,
    children,
    createdAt,
    updatedAt,
    tenantId: inputTenantId, // Never trust input tenantId
    ...rest
  } = input;

  if (rest.name && !rest.slug) rest.slug = generateSlug(rest.name);
  if (rest.slug) {
    rest.slug = generateSlug(rest.slug);
    await ensureUniqueSlugForTenant(rest.slug, id);
  }

  if (rest.parentId === id) {
    throw new Error("Category cannot be its own parent");
  }

  // Verify parent belongs to same tenant if provided
  if (rest.parentId) {
    const parentCategory = await prisma.category.findUnique({
      where: {
        id: rest.parentId,
        tenantId,
      },
    });

    if (!parentCategory) {
      throw new Error(
        "Parent category not found or belongs to different tenant",
      );
    }
  }

  const updateCategory = await prisma.category.update({
    where: {
      id,
      tenantId,
    },
    data: {
      ...rest,
      description: rest.description ?? null,
      parentId: rest.parentId || null,
    },
  });

  await clearSitemapCache(tenantId);

  return updateCategory;
}

export async function deleteCategory(id) {
  await requirePermission("taxonomy_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  // First verify the record belongs to the current tenant
  const existingCategory = await prisma.category.findUnique({
    where: {
      id,
      tenantId,
    },
  });

  if (!existingCategory) {
    return null; // Will be handled as 404 by controller
  }

  const deletecateogry = await prisma.category.delete({
    where: {
      id,
      tenantId,
    },
  });

  await clearSitemapCache(tenantId);

  return deletecateogry;
}

export async function BulkDeleteCategories(ids) {
  await requirePermission("taxonomy_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  // Ensure array is provided
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error("Invalid ids array provided");
  }

  // Verify all categories belong to the tenant before deletion
  const categories = await prisma.category.findMany({
    where: {
      id: { in: ids },
      tenantId,
    },
    select: { id: true },
  });

  const foundIds = categories.map((c) => c.id);
  const missingIds = ids.filter((id) => !foundIds.includes(id));

  if (missingIds.length > 0) {
    throw new Error(
      `Some categories not found or belong to different tenant: ${missingIds.join(", ")}`,
    );
  }

  const BulkDelte = await prisma.category.deleteMany({
    where: {
      id: { in: ids },
      tenantId,
    },
  });

  await clearSitemapCache(tenantId);

  return BulkDelte;
}
