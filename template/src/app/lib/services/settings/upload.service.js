import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { requirePermission } from "../../withPermission";
import {
  getSubscriberFileUrl,
  getSubscriberUploadDir,
} from "../../utils/uploadconfig";

export async function uploadFile(file) {
  console.log("=== uploadFile() called ===");

  const { session } = await requirePermission("media_upload");
  const tenantId = session.user.tenantId;

  console.log("Tenant:", tenantId);

  if (!file) {
    throw new Error("No file provided");
  }

  const uploadDir = getSubscriberUploadDir(tenantId);
  console.log("Upload dir:", uploadDir);

  await fs.mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name);

  const base = path
    .basename(file.name, ext)
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase();

  const fileName = `${base}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  const filePath = path.join(uploadDir, fileName);

  console.log("File path:", filePath);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  await fs.writeFile(filePath, buffer);

  console.log("File written");

  const exists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);

  console.log("Exists:", exists);

  return {
    url: getSubscriberFileUrl(tenantId, fileName),
    publicId: fileName,
  };
}