import { prisma } from "../../prisma.js";
import { requirePermission } from "../../withPermission.js";

// ─── Helpers ──────────────────────────────────────────────

function buildNestedComments(comments) {
  const map = {};
  const roots = [];

  comments.forEach((c) => {
    map[c.id] = { ...c, replies: [] };
  });

  comments.forEach((c) => {
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });

  return roots;
}

const commentSelect = {
  id: true,
  content: true,
  authorName: true,
  authorEmail: true,
  authorUrl: true,
  status: true,
  parentId: true,
  postId: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  post: { select: { id: true, title: true, slug: true } },
  user: { select: { id: true, email: true } },
};

// ═══════════════════════════════════════════════════════════
// PUBLIC — Submit a comment
// ═══════════════════════════════════════════════════════════

export async function submitComment({
  postId,
  authorName,
  authorEmail,
  authorUrl,
  content,
  parentId,
  userId,
  ipAddress,
  userAgent,
}) {
  // WordPress logic: if this email has a previously APPROVED comment → auto-approve
  const previousApproved = await prisma.comment.findFirst({
    where: { authorEmail, status: "APPROVED" },
  });

  const status = previousApproved ? "APPROVED" : "PENDING";

  return prisma.comment.create({
    data: {
      content,
      authorName,
      authorEmail,
      authorUrl: authorUrl || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      status,
      postId,
      parentId: parentId || null,
      userId: userId || null,
    },
    select: commentSelect,
  });
}

// ═══════════════════════════════════════════════════════════
// PUBLIC — Get approved comments for a post (nested)
// ═══════════════════════════════════════════════════════════

export async function getApprovedCommentsForPost(postId) {
  const comments = await prisma.comment.findMany({
    where: { postId, status: "APPROVED" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      authorName: true,
      authorUrl: true,
      parentId: true,
      createdAt: true,
      userId: true,
    },
  });

  return buildNestedComments(comments);
}

// ═══════════════════════════════════════════════════════════
// ADMIN — Get all comments with filters + pagination
// ═══════════════════════════════════════════════════════════

export async function getAdminComments({
  status,
  postId,
  search,
  page = 1,
  perPage = 20,
}) {
  const { session } = await requirePermission("comments_moderate");
  const tenantId = session.user.tenantId;

  const where = {
    post: { tenantId },
  };

  if (status && status !== "all") where.status = status.toUpperCase();
  if (postId) where.postId = postId;
  if (search) {
    where.OR = [
      { content: { contains: search, mode: "insensitive" } },
      { authorName: { contains: search, mode: "insensitive" } },
      { authorEmail: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, comments] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: commentSelect,
    }),
  ]);

  return {
    comments,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

// ═══════════════════════════════════════════════════════════
// ADMIN — Get counts per status (for tabs)
// ═══════════════════════════════════════════════════════════

export async function getCommentCounts() {
  const { session } = await requirePermission("comments_moderate");
  const tenantId = session.user.tenantId;

  const where = { post: { tenantId } };

  const [all, pending, approved, spam, trash] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.count({ where: { ...where, status: "PENDING" } }),
    prisma.comment.count({ where: { ...where, status: "APPROVED" } }),
    prisma.comment.count({ where: { ...where, status: "SPAM" } }),
    prisma.comment.count({ where: { ...where, status: "TRASH" } }),
  ]);

  return { all, pending, approved, spam, trash };
}

// ═══════════════════════════════════════════════════════════
// ADMIN — Update status
// ═══════════════════════════════════════════════════════════

export async function updateCommentStatus(id, status) {
  const { session } = await requirePermission("comments_moderate");
  const tenantId = session.user.tenantId;

  const existing = await prisma.comment.findFirst({
    where: { id, post: { tenantId } },
  });
  if (!existing) throw new Error("Comment not found");

  return prisma.comment.update({
    where: { id },
    data: { status: status.toUpperCase() },
    select: commentSelect,
  });
}

// ═══════════════════════════════════════════════════════════
// ADMIN — Admin reply to a comment
// ═══════════════════════════════════════════════════════════

export async function adminReplyToComment({ commentId, content, adminUser }) {
  const { session } = await requirePermission("comments_moderate");
  const tenantId = session.user.tenantId;

  const parent = await prisma.comment.findFirst({
    where: { id: commentId, post: { tenantId } },
  });
  if (!parent) throw new Error("Parent comment not found");

  return prisma.comment.create({
    data: {
      content,
      authorName: adminUser.name || "Admin",
      authorEmail: adminUser.email,
      status: "APPROVED", // admin replies always approved
      postId: parent.postId,
      parentId: commentId,
      userId: adminUser.id || null,
    },
    select: commentSelect,
  });
}

// ═══════════════════════════════════════════════════════════
// ADMIN — Bulk actions
// ═══════════════════════════════════════════════════

export async function bulkUpdateCommentStatus(ids, status) {
  const { session } = await requirePermission("comments_moderate");
  const tenantId = session.user.tenantId;

  return prisma.comment.updateMany({
    where: { id: { in: ids }, post: { tenantId } },
    data: { status: status.toUpperCase() },
  });
}

export async function bulkDeleteComments(ids) {
  const { session } = await requirePermission("comments_delete");
  const tenantId = session.user.tenantId;

  return prisma.comment.deleteMany({
    where: { id: { in: ids }, post: { tenantId } },
  });
}

// ═══════════════════════════════════════════════════════════
// ADMIN — Permanent delete
// ═══════════════════════════════════════════════════

export async function deleteComment(id) {
  const { session } = await requirePermission("comments_delete");
  const tenantId = session.user.tenantId;

  const comment = await prisma.comment.findFirst({
    where: { id, post: { tenantId } },
  });
  if (!comment) throw new Error("Comment not found");

  await prisma.comment.deleteMany({
    where: { parentId: id, post: { tenantId } },
  });
  return prisma.comment.delete({ where: { id } });
}

// ═══════════════════════════════════════════════════════════
// ADMIN — Get single comment
// ═══════════════════════════════════════════

export async function getCommentById(id) {
  const { session } = await requirePermission("comments_moderate");
  const tenantId = session.user.tenantId;

  return prisma.comment.findFirst({
    where: { id, post: { tenantId } },
    select: commentSelect,
  });
}
