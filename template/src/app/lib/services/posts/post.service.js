// lib/services/posts.service.js

import { randomUUID } from "crypto";
import { prisma } from "../../prisma.js";
import { processImageSeo } from "../seo/image-seo.service.js";
import { processInternalLinks } from "../seo/internal-link.service.js";
import { requireAuth, requirePermission } from "../../withPermission.js";
import { clearSitemapCache } from "../seo/sitemap.service.js";
import { clearRedirectCache } from "@/src/lib/redirectMiddleware";
import { normalizeURL } from "@/src/app/lib/utils/redirectUtils";

// ─── Helpers ──────────────────────────────────────────────

function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function isSlugTaken(slug, tenantId, excludeId = null) {
  const existing = await prisma.post.findFirst({
    where: {
      slug,
      tenantId,
    },
  });

  if (!existing) return false;
  if (excludeId && existing.id === excludeId) return false;
  return true;
}

// ═══════════════════════════════════════════════════════════
// POST SERVICES
// ═══════════════════════════════════════════════════════════

export async function getAllPosts() {
  await requirePermission("posts_view");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  return prisma.post.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      excerpt: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { id: true, name: true } },
      tag: { select: { id: true, name: true } },
      _count: { select: { comment: true } },
    },
  });
}

export async function getPostById(id) {
  await requirePermission("posts_view");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  return prisma.post.findFirst({
    where: {
      id,
      tenantId,
    },
    include: {
      category: true,
      tag: true,
      user: true,
    },
  });
}

export async function getPostBySlug(slug) {
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const post = await prisma.post.findFirst({
    where: {
      slug,
      tenantId,
    },
    include: {
      category: true,
      tag: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (post?.content) {
    post.content = await processInternalLinks(post.content, tenantId);
  }

  return post;
}

export async function getPublishedPosts() {
  const session = await requireAuth();
  const tenantId = session.user.tenantId;
  const publishedPosts = prisma.post.findMany({
    where: { status: "PUBLISHED", tenantId },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      featuredImage: true,
      publishedAt: true,
      category: { select: { id: true, name: true, slug: true } },
      tag: { select: { id: true, name: true, slug: true } },
    },
  });

  // await clearSitemapCache(tenantId);

  return publishedPosts;
}

export async function createPost(input) {
  await requirePermission("posts_create");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const slug = input.slug?.trim()
    ? generateSlug(input.slug)
    : generateSlug(input.title);

  if (await isSlugTaken(slug, tenantId)) {
    throw new Error(`Slug "${slug}" is already taken`);
  }

  const {
    id: _,
    createdAt,
    updatedAt,
    categoryIds = [],
    tagIds = [],
    categories,
    tags,
    user,
    ...rest
  } = input;

  if (typeof rest.content === "string" && rest.content.trim()) {
    rest.content = await processImageSeo({
      html: rest.content,
      pageTitle: rest.title ?? "",
      seoData: rest.seoData ?? {},
      tenantId,
    });
  }

  const post = await prisma.post.create({
    data: {
      id: randomUUID(),
      ...rest,
      slug,
      tenantId,
      publishedAt:
        rest.status === "PUBLISHED" ? (rest.publishedAt ?? new Date()) : null,

      category: {
        connect: categoryIds.map((id) => ({ id })),
      },

      authorId: Number(session.user.id),

      tag: {
        connect: tagIds.map((id) => ({ id })),
      },
    },

    include: {
      category: true,
      tag: true,
      user: true,
    },
  });

  await clearSitemapCache(tenantId);

  return post;
}

export async function updatePost(id, input) {
  await requirePermission("posts_edit_any");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const {
    id: _,
    createdAt,
    updatedAt,
    categoryIds,
    tagIds,
    categories,
    tags,
    userId,
    user,
    ...rest
  } = input;

  if (rest.title && !rest.slug) {
    rest.slug = generateSlug(rest.title);
  }

  if (rest.slug) {
    rest.slug = generateSlug(rest.slug);
    if (await isSlugTaken(rest.slug, tenantId, id)) {
      throw new Error(`Slug "${rest.slug}" is already taken`);
    }
  }

  const existingPost = await prisma.post.findFirst({
    where: {
      id,
      tenantId,
    },
  });
  if (!existingPost) {
    throw new Error("Post not found");
  }

  if (typeof rest.content === "string" && rest.content.trim()) {
    rest.content = await processImageSeo({
      html: rest.content,
      pageTitle: rest.title ?? existingPost.title ?? "",
      seoData: rest.seoData ?? {},
      tenantId,
    });
  }

  // TRACK OLD SLUG FOR REDIRECT
  const oldSlug = existingPost.slug;

  if (rest.status === "PUBLISHED" && !rest.publishedAt) {
    rest.publishedAt = new Date();
  }

  if (rest.status === "DRAFT") {
    rest.publishedAt = null;
  }

  // UPDATE POST
  const updatedPost = await prisma.post.update({
    where: { id },
    data: {
      ...rest,
      ...(categoryIds !== undefined && {
        category: {
          set: categoryIds.map((id) => ({ id })),
        },
      }),
      ...(tagIds !== undefined && {
        tag: {
          set: tagIds.map((id) => ({ id })),
        },
      }),
    },
    include: {
      category: true,
      tag: true,
      user: true,
    },
  });

  await clearSitemapCache(tenantId);

  // CREATE REDIRECT IF SLUG CHANGED
  if (rest.slug && oldSlug !== rest.slug) {
    try {
      const existingRedirect = await prisma.redirect.findUnique({
        where: { sourceUrl: normalizeURL(`/posts/${oldSlug}`) },
      });

      if (!existingRedirect) {
        await prisma.redirect.create({
          data: {
            sourceUrl: normalizeURL(`/posts/${oldSlug}`),
            destinationUrl: normalizeURL(`/posts/${rest.slug}`),
            statusCode: 301,
            description: `Post renamed: ${oldSlug} → ${rest.slug}`,
            isAutoDetected: true,
            tenantId,
          },
        });
        await clearRedirectCache();
      }
    } catch (err) {
      if (!String(err?.message).includes("Unique constraint")) {
        console.error("Failed to create redirect:", err);
      }
    }
  }

  return updatedPost;
}

export async function deletePost(id) {
  await requirePermission("posts_delete_any");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  // DELETE MARKDOWN
  await prisma.AICrawlContent.deleteMany({
    where: {
      tenantId,
      contentType: "post",
      contentId: String(id),
    },
  });
  const existingPost = await prisma.post.findFirst({
    where: {
      id,
      tenantId,
    },
  });
  if (!existingPost) {
    throw new Error("Post not found");
  }

  const deletedPost = await prisma.post.delete({
    where: { id },
  });

  await clearSitemapCache(tenantId);

  return deletedPost;
}

export async function BulkDeletePosts(ids) {
  await requirePermission("posts_delete_any");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const bulkDelete = prisma.post.deleteMany({
    where: {
      id: {
        in: ids,
      },
      tenantId,
    },
  });

  await clearSitemapCache(tenantId);

  return bulkDelete;
}

export async function publishPost(id) {
  await requirePermission("posts_publish");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const existingPost = await prisma.post.findFirst({
    where: {
      id,
      tenantId,
    },
  });
  if (!existingPost) {
    throw new Error("Post not found");
  }

  const updatedPost = await prisma.post.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
    include: {
      category: true,
      tag: true,
      user: true,
    },
  });

  await clearSitemapCache(tenantId);

  return updatedPost;
}

export async function unpublishPost(id) {
  await requirePermission("posts_publish");

  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const existingPost = await prisma.post.findFirst({
    where: {
      id,
      tenantId,
    },
  });
  if (!existingPost) {
    throw new Error("Post not found");
  }

  const updatePost = prisma.post.update({
    where: { id },
    data: {
      status: "DRAFT",
      publishedAt: null,
    },
  });

  await clearSitemapCache(tenantId);

  return updatePost;
}

export async function isPostSlugAvailable(slug, excludeId) {
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  return !(await isSlugTaken(slug, tenantId, excludeId));
}
