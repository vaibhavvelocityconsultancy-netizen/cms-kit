  import { prisma } from "../../prisma";
  import sharp from "sharp";
  import fs from "fs/promises";
  import path from "path";
  import crypto from "crypto";
  import { unzipSync } from "fflate";
  import { ApiError } from "../../utils/ApiError";
  import { requirePermission, requireAuth } from "../../withPermission";
  import { getTenantFileUrl, getTenantUploadDir } from "../../utils/uploadconfig";
  // import { getTenantUploadDir, getTenantFileUrl } from "../../lib/uploadConfig";

  // Allowed MIME Types
  const ALLOWED_TYPES = [
    // Images
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "image/gif",

    // Fonts
    "font/woff2",
    "font/woff",
    "application/font-woff2",
    "application/font-woff",
    "application/zip",
    "application/x-zip-compressed",
    "multipart/x-zip",

    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    // Video
    "video/mp4",
    "video/webm",

    // Audio
    "audio/mpeg",
    "audio/wav",
  ];

  const ZIP_TYPES = new Set([
    "application/zip",
    "application/x-zip-compressed",
    "multipart/x-zip",
  ]);
  const FONT_EXTENSION_PATTERN = /\.woff2?$/i;
  const MAX_ARCHIVE_ENTRIES = 100;
  const MAX_EXTRACTED_BYTES = 25 * 1024 * 1024;

  async function expandFontArchives(files) {
    const expandedFiles = [];

    for (const file of files) {
      if (!ZIP_TYPES.has(file.type)) {
        expandedFiles.push(file);
        continue;
      }

      const archive = unzipSync(Buffer.from(await file.arrayBuffer()));

      const archiveEntries = Object.entries(archive);

      if (archiveEntries.length > MAX_ARCHIVE_ENTRIES) {
        throw new ApiError(400, "ZIP archive contains too many files");
      }

      let extractedBytes = 0;
      let extractedFontCount = 0;

      for (const [entryPath, content] of archiveEntries) {
        if (entryPath.endsWith("/") || !FONT_EXTENSION_PATTERN.test(entryPath)) {
          continue;
        }

        const normalizedEntryPath = entryPath.replace(/\\/g, "/");
        if (
          normalizedEntryPath.startsWith("/") ||
          normalizedEntryPath.split("/").includes("..")
        ) {
          throw new ApiError(400, "ZIP archive contains an unsafe file path");
        }

        const fontBuffer = Buffer.from(content);
        extractedBytes += fontBuffer.length;

        if (extractedBytes > MAX_EXTRACTED_BYTES) {
          throw new ApiError(400, "ZIP archive contents are too large");
        }

        const extension = path.extname(normalizedEntryPath).toLowerCase();
        expandedFiles.push(
          new File([fontBuffer], path.basename(normalizedEntryPath), {
            type: extension === ".woff2" ? "font/woff2" : "font/woff",
          }),
        );
        extractedFontCount += 1;
      }

      if (extractedFontCount === 0) {
        throw new ApiError(400, "ZIP archive contains no WOFF or WOFF2 fonts");
      }
    }

    return expandedFiles;
  }

  function generateTitleFromFilename(filename) {
    return filename
      .replace(/\.[^/.]+$/, "") // remove extension
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function generateSafeFileName(originalName) {
    const ext = path.extname(originalName);
    const base = path
      .basename(originalName, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    return `${base}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  }

  // ─────────────────────────────────────────────
  // CREATE MEDIA
  // ─────────────────────────────────────────────
  export async function createMedia(input) {
    await requirePermission("media_upload");

    const session = await requireAuth();
    const tenantId = session.user.tenantId;

    const inputFiles = Array.isArray(input) ? input : [input];
    const files = await expandFontArchives(inputFiles);
    const uploadedMedia = [];

    const tenantDir = getTenantUploadDir(tenantId);
    await fs.mkdir(tenantDir, { recursive: true });

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new ApiError(400, `Unsupported file type: ${file.type}`);
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      let width = null;
      let height = null;

      let finalBuffer = buffer;
      let finalFileName = generateSafeFileName(file.name);
      let finalMimeType = file.type;

      // ─────────────────────────────────────────
      // OPTIMIZE IMAGES
      // ─────────────────────────────────────────
      if (
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/webp"
      ) {
        const metadata = await sharp(buffer).metadata();

        width = metadata.width ?? null;
        height = metadata.height ?? null;

        // Generate optimized WebP
        finalBuffer = await sharp(buffer)
          .webp({
            quality: 80,
          })
          .toBuffer();

        // Change extension to .webp
        const originalBaseName = path.basename(
          file.name,
          path.extname(file.name),
        );

        const safeBaseName = originalBaseName
          .replace(/[^a-zA-Z0-9-_]/g, "-")
          .toLowerCase();

        finalFileName = `${safeBaseName}-${crypto
          .randomBytes(6)
          .toString("hex")}.webp`;

        finalMimeType = "image/webp";
      } else if (file.type.startsWith("image/")) {
        // SVG / GIF
        const metadata = await sharp(buffer)
          .metadata()
          .catch(() => null);

        width = metadata?.width ?? null;
        height = metadata?.height ?? null;
      }

      // ─────────────────────────────────────────
      // SAVE FILE
      // ─────────────────────────────────────────

      const filePath = path.join(tenantDir, finalFileName);

      await fs.writeFile(filePath, finalBuffer);

      // ─────────────────────────────────────────
      // PUBLIC URL
      // ─────────────────────────────────────────

      const publicUrl = getTenantFileUrl(tenantId, finalFileName);

      const generatedTitle = generateTitleFromFilename(file.name);

      // ─────────────────────────────────────────
      // SAVE DATABASE RECORD
      // ─────────────────────────────────────────

      const media = await prisma.media.create({
        data: {
          fileName: finalFileName,

          // Keep the user's original filename
          originalName: file.name,

          // Public URL now points to optimized WebP
          url: publicUrl,

          publicId: finalFileName,

          // Store the actual served format
          mimeType: finalMimeType,

          // Store optimized file size
          size: finalBuffer.length,

          width,
          height,

          title: generatedTitle,

          tenantId,
        },
      });

      uploadedMedia.push(media);
    }

    return Array.isArray(input) ? uploadedMedia : uploadedMedia[0];
  }

  // ─────────────────────────────────────────────
  // GET ALL MEDIA
  // ─────────────────────────────────────────────
  export async function getAllMedia({ page = 1, limit = 20, search = "" }) {
    await requirePermission("media_upload");

    const session = await requireAuth();
    const tenantId = session.user.tenantId;

    page = Number(page);
    limit = Number(limit);

    const where = {
      tenantId: tenantId,
      ...(search && {
        OR: [
          { fileName: { contains: search } },
          { originalName: { contains: search } },
          { title: { contains: search } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.media.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─────────────────────────────────────────────
  // UPDATE MEDIA META
  // ─────────────────────────────────────────────
  export async function updateMedia(id, input) {
    await requirePermission("media_upload");

    const session = await requireAuth();
    const tenantId = session.user.tenantId;

    const existingMedia = await prisma.media.findUnique({
      where: {
        id: Number(id),
        tenantId: tenantId,
      },
    });

    if (!existingMedia) {
      throw new ApiError(404, "Media not found");
    }

    const { tenantId: inputTenantId, ...updateData } = input;

    return prisma.media.update({
      where: {
        id: Number(id),
        tenantId: tenantId,
      },
      data: {
        altText: updateData.altText ?? null,
        title: updateData.title ?? null,
        caption: updateData.caption ?? null,
        description: updateData.description ?? null,
      },
    });
  }

  // ─────────────────────────────────────────────
  // DELETE MEDIA
  // ─────────────────────────────────────────────
  export async function deleteMedia(id) {
    await requirePermission("media_delete");

    const session = await requireAuth();
    const tenantId = session.user.tenantId;

    const media = await prisma.media.findUnique({
      where: {
        id: Number(id),
        tenantId,
      },
    });

    if (!media) {
      throw new ApiError(404, "Media not found");
    }

    if (media.publicId) {
      const filePath = path.join(getTenantUploadDir(tenantId), media.publicId);

      try {
        await fs.unlink(filePath);
      } catch (err) {
        if (err.code !== "ENOENT") {
          console.error("Media file delete failed:", err);
        }
      }
    }

    await prisma.media.delete({
      where: {
        id: Number(id),
        tenantId,
      },
    });

    return true;
  }

  // ─────────────────────────────────────────────
  // BULK DELETE MEDIA
  // ─────────────────────────────────────────────
  export async function bulkDeleteMedia(ids) {
    await requirePermission("media_delete");

    const session = await requireAuth();
    const tenantId = session.user.tenantId;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, "Invalid or empty ids array provided");
    }

    const numericIds = ids.map(Number);

    const mediaItems = await prisma.media.findMany({
      where: {
        id: {
          in: numericIds,
        },
        tenantId: tenantId,
      },
      select: {
        id: true,
        publicId: true,
        mimeType: true,
      },
    });

    const foundIds = mediaItems.map((m) => m.id);
    const missingIds = numericIds.filter((id) => !foundIds.includes(id));

    if (missingIds.length > 0) {
      throw new ApiError(
        404,
        `Some media items not found or belong to different tenant: ${missingIds.join(", ")}`,
      );
    }

    const tenantDir = getTenantUploadDir(tenantId);

    await Promise.allSettled(
      mediaItems.map((media) =>
        fs.unlink(path.join(tenantDir, media.publicId)).catch(() => {}),
      ),
    );

    const result = await prisma.media.deleteMany({
      where: {
        id: {
          in: numericIds,
        },
        tenantId: tenantId,
      },
    });

    return {
      deleted: result.count,
      totalRequested: ids.length,
    };
  }

  // ─────────────────────────────────────────────
  // GET MEDIA BY ID
  // ─────────────────────────────────────────────
  export async function getMediaById(id) {
    await requirePermission("media_upload");

    const session = await requireAuth();
    const tenantId = session.user.tenantId;

    const media = await prisma.media.findUnique({
      where: {
        id: Number(id),
        tenantId: tenantId,
      },
    });

    if (!media) {
      throw new ApiError(404, "Media not found");
    }

    return media;
  }

  // ─────────────────────────────────────────────
  // GET MEDIA STATISTICS
  // ─────────────────────────────────────────────
  export async function getMediaStats() {
    await requirePermission("media_upload");

    const session = await requireAuth();
    const tenantId = session.user.tenantId;

    const [total, byType, totalSize] = await Promise.all([
      prisma.media.count({
        where: { tenantId },
      }),
      prisma.media.groupBy({
        by: ["mimeType"],
        where: { tenantId },
        _count: true,
      }),
      prisma.media.aggregate({
        where: { tenantId },
        _sum: {
          size: true,
        },
      }),
    ]);

    return {
      total,
      byType: byType.map((type) => ({
        mimeType: type.mimeType,
        count: type._count,
      })),
      totalSizeBytes: totalSize._sum.size || 0,
      totalSizeMB: ((totalSize._sum.size || 0) / (1024 * 1024)).toFixed(2),
    };
  }
