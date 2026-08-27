import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../lib/withPermission";
import { ApiError } from "../../lib/utils/ApiError";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";
import { requireActiveSubscription } from "../../lib/utils/subscription-access";
import { getSubscriberFileUrl, getSubscriberUploadDir } from "../../lib/utils/uploadconfig";

const ALLOWED_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",

  // Documents
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

  // Video
  "video/mp4",
  "video/webm",

  // Audio
  "audio/mpeg",
  "audio/wav",
];

function getResourceType(mimeType) {
  if (mimeType.startsWith("video/") || mimeType.startsWith("audio/")) {
    return "video";
  }

  if (
    mimeType === "application/pdf" ||
    mimeType === "application/msword" ||
    mimeType.includes("officedocument") ||
    mimeType === "application/zip" ||
    mimeType === "text/plain"
  ) {
    return "raw";
  }

  return "image";
}

function generateTitleFromFilename(filename) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const GET = asyncHandler(async () => {
  const { user } = await requireAuth();

  const files = await prisma.uploadedFile.findMany({
    where: {
      tenantId: Number(user.tenantId),
      uploadedBy: Number(user.id),
    },
    include: {
      uploader: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return Response.json(
    new ApiResponse(200, files, "Files fetched successfully"),
  );
});

export const POST = asyncHandler(async (req) => {
  const { user } = await requireAuth();
  await requireActiveSubscription(user.id);

  const formData = await req.formData();
  const file = formData.get("file") ?? formData.getAll("files")[0];

  if (!file || typeof file === "string") {
    throw new ApiError(400, "File is required");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ApiError(400, `Unsupported file type: ${file.type}`);
  }

  const title =
    (formData.get("title")?.toString().trim() || "").trim() ||
    generateTitleFromFilename(file.name);

  // 🔧 FIXED — read categoryId, not category
  const categoryId = formData.get("categoryId")?.toString().trim() || null;

  const shortDesc = formData.get("shortDesc")?.toString().trim() || null;
  const description = formData.get("description")?.toString().trim() || null;
  const tags = formData.get("tags")?.toString().trim() || null;

  // FormData sends everything as strings — "true"/"false" need explicit parsing
  const isShareableRaw = formData.get("isShareable")?.toString();
  const isShareable =
    isShareableRaw === undefined ? true : isShareableRaw === "true";

  // 🔧 NEW — validate categoryId belongs to this tenant, same check we use elsewhere
  if (categoryId) {
    const category = await prisma.fileCategory.findUnique({
      where: { id: categoryId, tenantId: Number(user.tenantId) },
    });
    if (!category) {
      throw new ApiError(400, "Category not found for this tenant");
    }
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = getSubscriberUploadDir(user.tenantId);

  await fs.mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name);

  const base = path
    .basename(file.name, ext)
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase();

  const fileName = `${base}-${crypto.randomBytes(6).toString("hex")}${ext}`;

  const filePath = path.join(uploadDir, fileName);

  console.log("UPLOAD DIR:", uploadDir);
  console.log("FILE PATH:", filePath);

  await fs.writeFile(filePath, buffer);

  const exists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);

  console.log("FILE EXISTS:", exists);
  const created = await prisma.uploadedFile.create({
    data: {
      title,
      shortDesc,
      description,
      isShareable,
      tags,
      categoryId, // 🔧 FIXED — was `category`, now matches the schema field
      fileName: fileName,
      originalName: file.name,
      url: getSubscriberFileUrl(user.tenantId, fileName),
      mimeType: file.type,
      size: file.size,
      uploadedBy: Number(user.id),
      tenantId: Number(user.tenantId),
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  return Response.json(
    new ApiResponse(201, created, "File uploaded successfully"),
    { status: 201 },
  );
});
