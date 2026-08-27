import { prisma } from "@/src/app/lib/prisma";
import { requireAuth } from "@/src/app/lib/withPermission";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { deleteFileAdmin, getFileByIdAdmin, getFileShares, updateFileAdmin } from "@/src/app/lib/file_sharing/file-sharing.service";

export const GET = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  const file = await getFileByIdAdmin(id);
  return Response.json(new ApiResponse(200, file, "File fetched successfully"));
});

export const PUT = asyncHandler(async (req, { params }) => {
  const { id } = await params;

  const formData = await req.formData();

  const uploadedFile = formData.get("file");

  const data = {
    title: formData.get("title")?.toString().trim(),
    categoryId: formData.get("categoryId")?.toString().trim() || null,
    shortDesc: formData.get("shortDesc")?.toString().trim() || null,
    description: formData.get("description")?.toString().trim() || null,
    tags: formData.get("tags")?.toString().trim() || null,
    isShareable:
      formData.get("isShareable")?.toString() === "true",
  };

  const file = await updateFileAdmin(id, data, uploadedFile);

  return Response.json(
    new ApiResponse(200, file, "File updated successfully")
  );
});

export const DELETE = asyncHandler(async (req, { params }) => {
  const { id } = await params;
  await deleteFileAdmin(id);
  return Response.json(new ApiResponse(200, null, "File deleted successfully"));
});