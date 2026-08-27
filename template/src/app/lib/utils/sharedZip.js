import fs from "fs/promises";
import path from "path";
import { createRequire } from "module";
import { uploadRoot } from "./uploadconfig.js";

const require = createRequire(import.meta.url);
const { ZipArchive } = require("archiver");

function normalizeRelativeUploadPath(fileUrl) {
  if (!fileUrl) return null;

  const cleanedUrl = fileUrl.split(/[?#]/)[0];
  const withoutLeadingSlash = cleanedUrl.replace(/^\/+/, "");

  if (!withoutLeadingSlash) return null;
  if (withoutLeadingSlash.startsWith("uploads/")) {
    return withoutLeadingSlash.slice("uploads/".length);
  }

  return withoutLeadingSlash;
}

async function resolveLocalFilePath(fileUrl) {
  if (!fileUrl || /^https?:\/\//i.test(fileUrl)) {
    return null;
  }

  const relativeUploadPath = normalizeRelativeUploadPath(fileUrl);
  if (!relativeUploadPath) return null;

  const configuredUploadRoot = process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : uploadRoot;

  const candidates = [
    path.join(configuredUploadRoot, relativeUploadPath),
    path.join(process.cwd(), "public", relativeUploadPath),
  ];

  let current = process.cwd();
  while (true) {
    candidates.push(path.join(current, "public", relativeUploadPath));
    candidates.push(
      path.join(current, ".next", "standalone", "public", relativeUploadPath),
    );

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  const uniqueCandidates = [...new Set(candidates)];

  for (const candidate of uniqueCandidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // keep trying the next candidate
    }
  }

  return uniqueCandidates[0] ?? null;
}

export async function buildSharedZipBuffer(files) {
  const archive = new ZipArchive({ zlib: { level: 9 } });
  const chunks = [];
  let addedFiles = 0;

  const zipPromise = new Promise((resolve, reject) => {
    archive.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);
  });

  for (const item of files) {
    const file = item?.file ?? item;
    const fileName = file.originalName || file.title || "downloaded-file";
    const fileUrl = file?.url;

    try {
      let buffer;

      if (!fileUrl) {
        throw new Error(`Missing file URL for ${fileName}`);
      }

      if (/^https?:\/\//i.test(fileUrl)) {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch remote file ${fileName}: ${response.status} ${response.statusText}`,
          );
        }
        buffer = Buffer.from(await response.arrayBuffer());
      } else {
        const filePath = await resolveLocalFilePath(fileUrl);
        if (!filePath) {
          throw new Error(`Could not resolve local path for ${fileName} (url: ${fileUrl})`);
        }
        buffer = await fs.readFile(filePath);
      }

      archive.append(buffer, { name: fileName });
      addedFiles += 1;
    } catch (error) {
      console.error(`Skipping file in shared zip: ${fileName}`, error);
    }
  }

  if (addedFiles === 0) {
    throw new Error("No valid files were available to include in the zip");
  }

  archive.finalize();
  return zipPromise;
}