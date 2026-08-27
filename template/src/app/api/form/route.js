export const dynamic = "force-dynamic";
// import { asyncHandler }    from "@/src/app/lib/utils/asyncHandler";
// import { ApiResponse }     from "@/src/app/lib/utils/ApiResponse";
// import { requirePermission } from "@/src/lib/withPermission";
// import { getAllForms, createForm } from "@/lib/services/form.service";

import { createForm, getAllForms } from "../../lib/services/forms/form.service";
import { ApiResponse } from "../../lib/utils/ApiResponse";
import { asyncHandler } from "../../lib/utils/asyncHandler";
import { requirePermission } from "../../lib/withPermission";

export const GET = asyncHandler(async () => {
  await requirePermission("settings_manage");
  const forms = await getAllForms();
  return Response.json(new ApiResponse(200, forms, "Forms fetched"), {
    status: 200,
  });
});

export const POST = asyncHandler(async (req) => {
  await requirePermission("settings_manage");
  const body = await req.json();
  const form = await createForm(body);
  return Response.json(new ApiResponse(201, form, "Form created"), {
    status: 201,
  });
});
