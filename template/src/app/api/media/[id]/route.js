import fs from "fs/promises";
import path from "path";
import { getTenantUploadDir } from "@/src/app/lib/utils/uploadconfig";
import { prisma } from "@/src/app/lib/prisma";

export const runtime = "nodejs";

export async function GET(req, { params }) {
  const { id } = await params;

  const media = await prisma.media.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!media) {
    return new Response("Media not found", { status: 404 });
  }

  // Read from the actual upload directory
  const filePath = path.join(
    getTenantUploadDir(media.tenantId),
    media.publicId,
  );

  const file = await fs.readFile(filePath);

  return new Response(file, {
    headers: {
      "Content-Type": media.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
