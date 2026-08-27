import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
// import { requirePermission } from "@/src/lib/withPermission";
import {
  getFormSubmissions,
  deleteSubmission,
} from "../../../../lib/services/forms/form.service";
import { requirePermission } from "@/src/app/lib/withPermission";
// import { getFormSubmissions, deleteSubmission } from "@/lib/services/form.service";

export const GET = asyncHandler(async (req, context) => {
  await requirePermission("settings_manage");

  const { id } = await context.params;

  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "10");

  const data = await getFormSubmissions(id, { page, perPage });

  return Response.json(new ApiResponse(200, data, "Submissions fetched"), {
    status: 200,
  });
});

export const DELETE = asyncHandler(async (req, context) => {
  await requirePermission("settings_manage");

  const { id: formId } = await context.params;

  const { id } = await req.json();

  await deleteSubmission(id);

  return Response.json(new ApiResponse(200, null, "Submission deleted"), {
    status: 200,
  });
});
