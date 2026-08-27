import { markFileDownloaded } from "@/src/app/lib/file_sharing/file-sharing.service";
import { resolveFileDownloadUrl } from "@/src/app/lib/utils/fileDownloadUrl";
import { prisma } from "@/src/app/lib/prisma";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const GET = asyncHandler(async (req, { params }) => {
  const resolvedParams = await params;
  const token = resolvedParams?.token?.toString?.();
  const fileId = resolvedParams?.fileId?.toString?.();

  if (!token) throw new ApiError(400, "Token is required");
  if (!fileId) throw new ApiError(400, "File ID is required");

  const share = await prisma.fileShareLink.findUnique({
    where: { token },
    include: {
      files: {
        where: { fileId },
        include: { file: true },
      },
    },
  });

  if (!share || !share.files?.length) {
    throw new ApiError(404, "Invalid link or file not part of this share");
  }

  await markFileDownloaded(token, fileId);

  const file = share.files[0].file;
  const fileUrl = resolveFileDownloadUrl(
    file.url,
    process.env.NEXT_PUBLIC_SITE_URL,
  );
  const res = await fetch(fileUrl);
  const blob = await res.arrayBuffer();

  return new Response(blob, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${file.originalName}"`,
    },
  });
});
