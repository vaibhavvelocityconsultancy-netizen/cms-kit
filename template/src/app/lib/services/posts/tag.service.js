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
    const existing = await prisma.tag.findUnique({
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
// TAG SERVICES
// ═══════════════════════════════════════════════════════════

export async function getAllTags() {
  await requirePermission("taxonomy_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const tags = await prisma.tag.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    include: { _count: { select: { post: true } } },
  });

  return tags.map((tag) => ({
    ...tag,
    _count: {
      ...tag._count,
      posts: tag._count?.post ?? 0,
    },
  }));
}

export async function getTagById(id) {
  await requirePermission("taxonomy_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  return prisma.tag.findUnique({
    where: {
      id,
      tenantId,
    },
    include: {
      post: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });
}

export async function createTag(input) {
  await requirePermission("taxonomy_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  // Never trust input.tenantId - always use session tenantId

  const slug = input.slug?.trim()
    ? generateSlug(input.slug)
    : generateSlug(input.name);

  await ensureUniqueSlugForTenant(slug);

  const createTags = await prisma.tag.create({
    data: {
      id: randomUUID(),
      name: input.name,
      slug,
      tenantId, // Always use session tenantId
    },
  });

  await clearSitemapCache(tenantId);

  return createTags;
}

export async function updateTag(id, input) {
  await requirePermission("taxonomy_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  // First verify the record belongs to the current tenant
  const existingTag = await prisma.tag.findUnique({
    where: {
      id,
      tenantId,
    },
  });

  if (!existingTag) {
    return null; // Will be handled as 404 by controller
  }

  // Remove tenantId from input if present (never trust it)
  const { id: _, tenantId: inputTenantId, ...rest } = input;

  if (rest.name && !rest.slug) rest.slug = generateSlug(rest.name);
  if (rest.slug) {
    rest.slug = generateSlug(rest.slug);
    await ensureUniqueSlugForTenant(rest.slug, id);
  }

  const updateTag = await prisma.tag.update({
    where: {
      id,
      tenantId,
    },
    data: rest,
  });

  await clearSitemapCache(tenantId);

  return updateTag;
}

export async function deleteTag(id) {
  await requirePermission("taxonomy_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  // First verify the record belongs to the current tenant
  const existingTag = await prisma.tag.findUnique({
    where: {
      id,
      tenantId,
    },
  });

  if (!existingTag) {
    return null; // Will be handled as 404 by controller
  }

  const deleteTag = await prisma.tag.delete({
    where: {
      id,
      tenantId,
    },
  });

  await clearSitemapCache(tenantId);

  return deleteTag;
}

export async function BulkDeleteTags(ids) {
  await requirePermission("taxonomy_manage");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  // Ensure array is provided
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error("Invalid ids array provided");
  }

  // Verify all tags belong to the tenant before deletion
  const tags = await prisma.tag.findMany({
    where: {
      id: { in: ids },
      tenantId,
    },
    select: { id: true },
  });

  const foundIds = tags.map((t) => t.id);
  const missingIds = ids.filter((id) => !foundIds.includes(id));

  if (missingIds.length > 0) {
    throw new Error(
      `Some tags not found or belong to different tenant: ${missingIds.join(", ")}`,
    );
  }

  const deleteManyResult = await prisma.tag.deleteMany({
    where: {
      id: { in: ids },
      tenantId,
    },
  });

  await clearSitemapCache(tenantId);

  return deleteManyResult;
}
