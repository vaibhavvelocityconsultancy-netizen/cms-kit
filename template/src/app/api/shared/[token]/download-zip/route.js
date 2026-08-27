import { prisma } from "@/src/app/lib/prisma";
import { markZipDownloaded } from "@/src/app/lib/file_sharing/file-sharing.service";
import { buildSharedZipBuffer } from "@/src/app/lib/utils/sharedZip";

export async function GET(request, { params }) {
  const { token } = await params;

  if (!token || !String(token).trim()) {
    return new Response("Token is required", { status: 400 });
  }

  const share = await prisma.fileShareLink.findUnique({
    where: { token: String(token) },
    include: { files: { include: { file: true } } },
  });

  if (!share) {
    return new Response("Invalid link", { status: 404 });
  }

  if (!share.files || share.files.length === 0) {
    return new Response("No files in this share", { status: 404 });
  }

  try {
    const zipBuffer = await buildSharedZipBuffer(share.files);
    markZipDownloaded(token).catch((err) =>
      console.error("Failed to mark zip download:", err),
    );

    return new Response(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="shared-files-${token}.zip"`,
      },
    });
  } catch (error) {
    console.error("Failed to build shared zip:", error);
    return new Response("Could not generate zip download", { status: 500 });
  }
}
