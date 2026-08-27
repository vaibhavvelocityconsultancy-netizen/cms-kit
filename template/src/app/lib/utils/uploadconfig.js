// src/lib/uploadConfig.js
import path from "path";

// ─────────────────────────────────────────────
// UPLOAD ROOT
// ─────────────────────────────────────────────
// Local dev:   UPLOAD_DIR=public/uploads        -> <project>/public/uploads
// Production:  UPLOAD_DIR=/home/d15269/public_html/newweb/uploads
//
// Falls back to public/uploads relative to cwd if UPLOAD_DIR isn't set,
// but you should ALWAYS set UPLOAD_DIR explicitly in production —
// process.cwd() is unreliable in a Next.js standalone build.
export const uploadRoot = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "public", "uploads");

  console.log("UPLOAD_DIR:", process.env.UPLOAD_DIR);
console.log("uploadRoot:", uploadRoot);

// ─────────────────────────────────────────────
// DIRECTORY HELPERS
// ─────────────────────────────────────────────

// public/uploads/tenant-{id}
export function getTenantUploadDir(tenantId) {
  return path.join(uploadRoot, `tenant-${tenantId}`);
}

// public/uploads/subscriber-files/tenant-{id}
export function getSubscriberUploadDir(tenantId) {
  return path.join(uploadRoot, "subscriber-files", `tenant-${tenantId}`);
}

// ─────────────────────────────────────────────
// URL HELPERS
// ─────────────────────────────────────────────
// URL formats stay the same regardless of where UPLOAD_DIR physically
// points on disk — the browser only ever sees /uploads/...

export function getTenantFileUrl(tenantId, fileName) {
  return `/uploads/tenant-${tenantId}/${fileName}`;
}

export function getSubscriberFileUrl(tenantId, fileName) {
  return `/uploads/subscriber-files/tenant-${tenantId}/${fileName}`;
}


// public/uploads/media/tenant-{id}
export function getMediaUploadDir(tenantId) {
  return path.join(uploadRoot, "media", `tenant-${tenantId}`);
  
}

export function getMediaFileUrl(tenantId, fileName) {
  return `/uploads/media/tenant-${tenantId}/${fileName}`;
}