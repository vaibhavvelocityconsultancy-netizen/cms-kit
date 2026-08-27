import {
  deleteForm,
  getFormById,
  updateForm,
} from "@/src/app/lib/services/forms/form.service";
import { ApiResponse } from "@/src/app/lib/utils/ApiResponse";
import { asyncHandler } from "@/src/app/lib/utils/asyncHandler";
import { requirePermission } from "@/src/app/lib/withPermission";

export const GET = asyncHandler(async (req, context) => {
  await requirePermission("settings_manage");

  const { id } = await context.params;

  const form = await getFormById(id);

  return Response.json(new ApiResponse(200, form, "Form fetched"), {
    status: 200,
  });
});

export const PATCH = asyncHandler(async (req, context) => {
  await requirePermission("settings_manage");

  const { id } = await context.params;

  const body = await req.json();

  const updated = await updateForm(id, body);

  return Response.json(new ApiResponse(200, updated, "Form updated"), {
    status: 200,
  });
});

export const DELETE = asyncHandler(async (req, context) => {
  await requirePermission("settings_manage");

  const { id } = await context.params;

  await deleteForm(id);

  return Response.json(new ApiResponse(200, null, "Form deleted"), {
    status: 200,
  });
});
