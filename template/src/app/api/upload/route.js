// import { uploadFile } from "../../lib/services/upload.service";
// import { ApiError } from "../../lib/utils/ApiError";
// import { ApiResponse } from "../../lib/utils/ApiResponse";
// import { asyncHandler } from "../../lib/utils/asyncHandler";

import { uploadFile } from "../../lib/services/settings/upload.service";
import { ApiError } from "../../lib/utils/ApiError";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";

export const POST = asyncHandler(async (req) => {
  const formData = await req.formData();
  const file = formData.get("file");

  const url = await uploadFile(file);

  if (!url) {
    throw new ApiError(500, "File upload failed");
  }

  return Response.json(
    new ApiResponse(201, { url }, "File uploaded successfully"),
    { status: 201 },
  );
});
