import { createMedia } from "@/src/app/lib/services/media/media.service";
import { ApiError } from "@/src/app/lib/utils/ApiError";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";

export const runtime = "nodejs";

export const POST = asyncHandler(async (req) => {
  const formData = await req.formData();

  const files = formData.getAll("files");

  if (!files.length) {
    throw new ApiError(400, "Files are required");
  }

  const media = await createMedia(files);

  return Response.json(
    new ApiResponse(201, media, "Media uploaded successfully"),
    {
      status: 201,
    },
  );
});
