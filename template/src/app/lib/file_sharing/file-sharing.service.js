import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { prisma } from "../prisma";
import { requireAuth, requirePermission } from "../withPermission";
import { sendTriggerEmails } from "../email";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { requireActiveSubscription } from "../utils/subscription-access";
export { resolveFileDownloadUrl } from "../utils/fileDownloadUrl";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",

  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",

  "video/mp4",
  "video/webm",

  "audio/mpeg",
  "audio/wav",
];

function generateSharePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(chars.length)];
  }
  return `SHR-${code}`;
}

// ─── Local storage helpers ──────────────────────────────────

function getTenantUploadDir(tenantId) {
  return path.join(
    process.cwd(),
    "public",
    "uploads",
    "subscriber-files",
    `tenant-${tenantId}`,
  );
}

function generateSafeFileName(originalName) {
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);

  const safeBaseName = baseName.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");

  const uniqueSuffix = crypto.randomBytes(6).toString("hex");

  return `${safeBaseName}-${uniqueSuffix}${ext.toLowerCase()}`;
}

async function saveFileToDisk(uploadedFile, tenantId) {
  const uploadDir = getTenantUploadDir(tenantId);
  await fs.mkdir(uploadDir, { recursive: true });

  const fileName = generateSafeFileName(uploadedFile.name);
  const filePath = path.join(uploadDir, fileName);

  const bytes = await uploadedFile.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await fs.writeFile(filePath, buffer);

  return {
    fileName,
    originalName: uploadedFile.name,
    url: `/uploads/subscriber-files/tenant-${tenantId}/${fileName}`,
    mimeType: uploadedFile.type,
    size: uploadedFile.size,
  };
}

async function deleteFileFromDisk(fileName, tenantId) {
  if (!fileName) return;

  const filePath = path.join(getTenantUploadDir(tenantId), fileName);

  try {
    await fs.unlink(filePath);
  } catch (err) {
    // Ignore if the file no longer exists on disk
    if (err.code !== "ENOENT") {
      console.error("Local file delete failed:", err);
    }
  }
}

// ─── Create (multi-file) ────────────────────────────────────

export async function shareFiles(fileIds, { email, message, password }) {
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    throw new ApiError(400, "At least one file ID is required");
  }

  const uniqueFileIds = [...new Set(fileIds.map(String))];

  const session = await requireActiveSubscription();
  const tenantId = session.user.tenantId;

  const files = await prisma.uploadedFile.findMany({
    where: {
      id: { in: uniqueFileIds },
      tenantId,
    },
    include: {
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  if (files.length !== uniqueFileIds.length) {
    const foundIds = new Set(files.map((f) => f.id));
    const missing = uniqueFileIds.filter((id) => !foundIds.has(id));
    throw new ApiError(
      404,
      `File(s) not found or not accessible: ${missing.join(", ")}`,
    );
  }

  const nonShareable = files.filter((f) => !f.isShareable);
  if (nonShareable.length > 0) {
    throw new ApiError(
      400,
      `These files are not shareable: ${nonShareable.map((f) => f.title).join(", ")}`,
    );
  }

  if (password && password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const plainPassword = password || generateSharePassword();
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const share = await prisma.$transaction(async (tx) => {
    const createdShare = await tx.fileShareLink.create({
      data: {
        sharedWith: email,
        message: message ?? null,
        password: hashedPassword,
        createdBy: Number(session.user.id),
      },
    });

    await tx.fileShareFile.createMany({
      data: uniqueFileIds.map((fileId) => ({
        shareLinkId: createdShare.id,
        fileId,
      })),
    });

    return createdShare;
  });

  const uniqueCategories = [
    ...new Set(files.map((f) => f.category?.name ?? "Uncategorized")),
  ];

  const emailCategory = uniqueCategories.join(", ");

  await sendTriggerEmails("FILE_SHARED", {
    sharedWith: email,
    fileCount: files.length,
    fileTitles: files.map((f) => f.title),
    title: files[0]?.title ?? null,
    category: emailCategory,
    message: message ?? "",
    link: `${process.env.NEXT_PUBLIC_SITE_URL}/shared/${share.token}`,
    password: plainPassword,
    senderName: session.user.name,
  });

  return { share };
}

// ─── Public access (no auth — token/password gated) ─────────

export async function verifySharePassword(token, password) {
  const share = await prisma.fileShareLink.findUnique({
    where: { token },
    include: { files: { include: { file: true } } },
  });
  if (!share) throw new ApiError(404, "Invalid link");

  const valid = await bcrypt.compare(password, share.password);
  if (!valid) throw new ApiError(400, "Incorrect password");

  if (!share.viewedAt) {
    await prisma.fileShareLink.update({
      where: { id: share.id },
      data: { viewedAt: new Date() },
    });
  }

  return {
    sharedWith: share.sharedWith,
    message: share.message,
    files: share.files.map((item) => ({
      itemId: item.id,
      fileId: item.file.id,
      fileUrl: item.file.url,
      mimeType: item.file.mimeType,
      fileName: item.file.originalName,
      title: item.file.title,
      size: item.file.size,
      downloadedAt: item.downloadedAt,
    })),
  };
}

export async function markFileDownloaded(token, fileId) {
  const share = await prisma.fileShareLink.findUnique({ where: { token } });
  if (!share) throw new ApiError(404, "Invalid link");

  const item = await prisma.fileShareFile.findUnique({
    where: {
      shareLinkId_fileId: { shareLinkId: share.id, fileId: String(fileId) },
    },
  });
  if (!item) throw new ApiError(404, "File not part of this share");

  await prisma.fileShareFile.update({
    where: { id: item.id },
    data: { downloadedAt: new Date() },
  });
}

export async function markZipDownloaded(token) {
  const share = await prisma.fileShareLink.findUnique({ where: { token } });
  if (!share) throw new ApiError(404, "Invalid link");

  await prisma.fileShareLink.update({
    where: { id: share.id },
    data: { zipDownloadedAt: new Date() },
  });
}

export async function getShareMeta(token) {
  const share = await prisma.fileShareLink.findUnique({
    where: { token },
    include: {
      files: {
        include: {
          file: {
            select: { title: true, category: { select: { name: true } } },
          },
        },
      },
    },
  });
  if (!share) throw new ApiError(404, "Invalid link");

  return {
    fileCount: share.files.length,
    files: share.files.map((i) => ({
      title: i.file.title,
      category: i.file.category?.name ?? null,
    })),
  };
}

// ─── Shares list per file (admin/subscriber view) ───────────

export async function getFileShares(fileId) {
  const session = await requireActiveSubscription();
  const tenantId = session.user.tenantId;
  const userId = Number(session.user.id);

  const file = await prisma.uploadedFile.findFirst({
    where: { id: fileId, tenantId },
  });
  if (!file) throw new ApiError(404, "File not found");

  const items = await prisma.fileShareFile.findMany({
    where: {
      fileId,
      shareLink: { createdBy: userId },
    },
    orderBy: { shareLink: { createdAt: "desc" } },
    include: {
      shareLink: {
        select: {
          id: true,
          sharedWith: true,
          message: true,
          viewedAt: true,
          zipDownloadedAt: true,
          createdAt: true,
          _count: { select: { files: true } },
        },
      },
    },
  });

  return items.map((item) => ({
    shareId: item.shareLink.id,
    sharedWith: item.shareLink.sharedWith,
    message: item.shareLink.message,
    viewedAt: item.shareLink.viewedAt,
    zipDownloadedAt: item.shareLink.zipDownloadedAt,
    downloadedAt: item.downloadedAt,
    createdAt: item.shareLink.createdAt,
    otherFilesCount: item.shareLink._count.files - 1,
  }));
}

// ─── Admin CRUD ──────────────────────────────────────────────

export async function getAllFilesAdmin() {
  await requirePermission("subscriber_upload_files_info");
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  return prisma.uploadedFile.findMany({
    where: { tenantId },
    include: {
      uploader: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFileByIdAdmin(fileId) {
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const file = await prisma.uploadedFile.findFirst({
    where: { id: fileId, tenantId },
    include: {
      uploader: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!file) throw new ApiError(404, "File not found");

  return file;
}

// Edit file metadata (title, descriptions, category, shareability).
// Optionally replaces the uploaded file itself.
export async function updateFileAdmin(fileId, data, uploadedFile) {
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const existing = await prisma.uploadedFile.findFirst({
    where: { id: fileId, tenantId },
  });
  if (!existing) throw new ApiError(404, "File not found");

  if (data.title !== undefined && !data.title.trim()) {
    throw new ApiError(400, "Title cannot be empty");
  }

  if (data.categoryId) {
    const category = await prisma.fileCategory.findUnique({
      where: { id: data.categoryId, tenantId },
    });
    if (!category)
      throw new ApiError(400, "Category not found for this tenant");
  }

  // Replace uploaded file if a new one is selected
  if (uploadedFile && typeof uploadedFile !== "string") {
    if (!ALLOWED_TYPES.includes(uploadedFile.type)) {
      throw new ApiError(400, `Unsupported file type: ${uploadedFile.type}`);
    }

    const saved = await saveFileToDisk(uploadedFile, tenantId);

    // Delete old file from disk after successful save
    await deleteFileFromDisk(existing.fileName, tenantId);

    data.fileName = saved.fileName;
    data.originalName = saved.originalName;
    data.url = saved.url;
    data.mimeType = saved.mimeType;
    data.size = saved.size;
  }

  return prisma.uploadedFile.update({
    where: { id: fileId },
    data: {
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(data.shortDesc !== undefined && {
        shortDesc: data.shortDesc?.trim() || null,
      }),
      ...(data.description !== undefined && {
        description: data.description?.trim() || null,
      }),
      ...(data.isShareable !== undefined && {
        isShareable: !!data.isShareable,
      }),
      ...(data.categoryId !== undefined && {
        categoryId: data.categoryId || null,
      }),
      ...(data.tags !== undefined && { tags: data.tags?.trim() || null }),

      ...(data.fileName && { fileName: data.fileName }),
      ...(data.originalName && { originalName: data.originalName }),
      ...(data.url && { url: data.url }),
      ...(data.mimeType && { mimeType: data.mimeType }),
      ...(data.size && { size: data.size }),
    },
    include: { category: true },
  });
}

export async function deleteFileAdmin(fileId) {
  const session = await requireAuth();
  const tenantId = session.user.tenantId;

  const file = await prisma.uploadedFile.findFirst({
    where: {
      id: fileId,
      tenantId,
    },
  });

  if (!file) {
    throw new ApiError(404, "File not found");
  }

  await deleteFileFromDisk(file.fileName, tenantId);

  await prisma.uploadedFile.delete({
    where: {
      id: fileId,
    },
  });

  return new ApiResponse(200, null, "File deleted successfully");
}
