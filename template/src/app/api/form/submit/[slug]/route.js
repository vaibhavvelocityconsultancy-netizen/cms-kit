import { uploadFormFile } from "@/src/app/lib/services/forms/form-upload.service";
import {
  getFormBySlug,
  submitForm,
} from "../../../../lib/services/forms/form.service";
import { ApiResponse } from "../../../../lib/utils/ApiResponse";
import { asyncHandler } from "../../../../lib/utils/asyncHandler";
// import { uploadFormFile } from "../../../../lib/services/forms/form-upload.service";
// import { getFormBySlug } from "../../../../lib/services/forms/form.service"; // 👈 to fetch field config for validation

export const POST = asyncHandler(async (req, context) => {
  const { slug } = await context.params;
  const contentType = req.headers.get("content-type") || "";
  console.log("Content-Type received:", contentType); // 👈 add this

  const ipAddress =
    req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;

  let body = {};

  if (contentType.includes("multipart/form-data")) {
    const form = await getFormBySlug(slug); // fetch field defs for validation
    const fieldsByName = Object.fromEntries(
      (form.fields || []).map((f) => [f.name, f]),
    );

    const formData = await req.formData();
    const fileEntries = [];

    for (const [key, value] of formData.entries()) {
      console.log(
        "FormData entry:",
        key,
        value instanceof File ? `FILE: ${value.name}` : value,
      ); // 👈 add this
      if (value instanceof File) {
        fileEntries.push({ fieldName: key, file: value });
      } else {
        body[key] = value;
      }
    }

    for (const { fieldName, file } of fileEntries) {
      const fieldConfig = fieldsByName[fieldName] || {};
      const uploaded = await uploadFormFile(file, slug, fieldConfig);

      if (body[fieldName]) {
        body[fieldName] = Array.isArray(body[fieldName])
          ? [...body[fieldName], uploaded.url]
          : [body[fieldName], uploaded.url];
      } else {
        body[fieldName] = uploaded.url;
      }
    }
  } else {
    body = await req.json();
  }

  const result = await submitForm(slug, body, ipAddress);

  return Response.json(
    new ApiResponse(200, result, "Form submitted successfully"),
    { status: 200 },
  );
});
