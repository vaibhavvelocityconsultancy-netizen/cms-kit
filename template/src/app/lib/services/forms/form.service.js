// import { sendFormEmails } from "../email.js";
import { sendFormEmails } from "../../email.js";
import { prisma } from "../../prisma.js";
// import { prisma } from "../prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { requirePermission } from "../../withPermission.js";

// ── Generate slug ─────────────────────────────────────────

function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ── Get all forms ─────────────────────────────────────────

export async function getAllForms() {
  const { session } = await requirePermission("settings_manage");
  const tenantId = session.user.tenantId;

  return prisma.form.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { formsubmission: true } },
    },
  });
}

// ── Get form by id ────────────────────────────────────────

export async function getFormById(id) {
  const { session } = await requirePermission("settings_manage");
  const tenantId = session.user.tenantId;

  const form = await prisma.form.findFirst({
    where: { id: Number(id), tenantId },
  });
  if (!form) throw new ApiError(404, "Form not found");
  return form;
}

// ── Get form by slug (public) ─────────────────────────────

export async function getFormBySlug(slug, tenantId) {
  const where = tenantId !== undefined ? { slug, tenantId } : { slug };
  const form = await prisma.form.findFirst({
    where,
    select: {
      id: true,
      title: true,
      slug: true,
      layout: true,
      twoColumnHeading: true,
      twoColumnParagraph: true,
      fields: true,
      submitButtonLabel: true,
      confirmationType: true,
      confirmationMessage: true,
      confirmationMessageClass: true,
      redirectUrl: true,
      status: true,
    },
  });
  if (!form) throw new ApiError(404, "Form not found");
  if (form.status !== "active") throw new ApiError(403, "Form is not active");
  return form;
}

// ── Create form ───────────────────────────────────────────

export async function createForm(input) {
  const { session } = await requirePermission("settings_manage");
  const tenantId = session.user.tenantId;

  const baseSlug = input.slug?.trim()
    ? generateSlug(input.slug)
    : generateSlug(input.title || "untitled-form");

  let slug = baseSlug;
  let counter = 1;

  while (await prisma.form.findFirst({ where: { slug, tenantId } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  return prisma.form.create({
    data: {
      title: input.title || "Untitled Form",
      slug,
      fields: input.fields ?? [],
      submitButtonLabel: input.submitButtonLabel ?? "Submit",
      layout: input.layout ?? "default",
      twoColumnHeading: input.twoColumnHeading ?? null,
      twoColumnParagraph: input.twoColumnParagraph ?? null,
      confirmationType: input.confirmationType ?? "message",
      confirmationMessage:
        input.confirmationMessage ?? "Thank you for your submission.",
      confirmationMessageClass: input.confirmationMessageClass ?? null,
      redirectUrl: input.redirectUrl ?? null,
      emails: input.emails ?? [],
      status: input.status ?? "active",
      tenantId,
    },
  });
}

// ── Update form ───────────────────────────────────────────

export async function updateForm(id, input) {
  const { session } = await requirePermission("settings_manage");
  const tenantId = session.user.tenantId;
  const { id: _, createdAt, updatedAt, ...data } = input;

  const current = await prisma.form.findFirst({
    where: { id: Number(id), tenantId },
    select: { slug: true },
  });
  if (!current) throw new ApiError(404, "Form not found");

  // Handle slug uniqueness
  if (data.slug) {
    const submittedSlug = data.slug.trim();
    data.slug =
      submittedSlug === current.slug
        ? current.slug
        : generateSlug(submittedSlug);
    const existing = await prisma.form.findFirst({
      where: {
        slug: data.slug,
        tenantId,
        NOT: { id: Number(id) },
      },
    });
    if (existing) {
      throw new ApiError(400, `Slug "${data.slug}" is already taken`);
    }
  }

  return prisma.form.update({
    where: { id: Number(id), tenantId },
    data,
  });
}

// ── Delete form ───────────────────────────────────────────

export async function deleteForm(id) {
  const { session } = await requirePermission("settings_manage");
  const tenantId = session.user.tenantId;

  return prisma.form.delete({ where: { id: Number(id), tenantId } });
}

// ── Get submissions for a form ────────────────────────────

export async function getFormSubmissions(
  formId,
  { page = 1, perPage = 20 } = {},
) {
  const { session } = await requirePermission("settings_manage");
  const tenantId = session.user.tenantId;
  const where = {
    formId: Number(formId),
    form: { tenantId },
  };

  const [total, submissions] = await Promise.all([
    prisma.formSubmission.count({ where }),
    prisma.formSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    submissions,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

// ── Submit a form ─────────────────────────────────────────

export async function submitForm(slug, data, ipAddress) {
  // Get full form including emails
  const form = await prisma.form.findFirst({ where: { slug } });
  if (!form) throw new ApiError(404, "Form not found");
  if (form.status !== "active") throw new ApiError(403, "Form is not active");

  // Validate required fields
  const fields = Array.isArray(form.fields) ? form.fields : [];
  const errors = [];

  for (const field of fields) {
    if (field.required && !data[field.name]?.toString().trim()) {
      errors.push(`${field.label || field.name} is required`);
    }
  }

  if (errors.length > 0) {
    throw new ApiError(400, errors.join(", "));
  }

  // Save submission
  const submission = await prisma.formSubmission.create({
    data: {
      formId: form.id,
      data,
      ipAddress: ipAddress || null,
    },
  });

  // Send emails
  const emailConfigs = Array.isArray(form.emails) ? form.emails : [];
  if (emailConfigs.length > 0) {
    const fieldLabels = Object.fromEntries(
      fields.map((field) => [field.name, field.label || field.name]),
    );
    await sendFormEmails(emailConfigs, data, fieldLabels);
  }

  return {
    submission,
    confirmationType: form.confirmationType,
    confirmationMessage: form.confirmationMessage,
    confirmationMessageClass: form.confirmationMessageClass,
    redirectUrl: form.redirectUrl,
  };
}

// ── Delete a submission ───────────────────────────────────

export async function deleteSubmission(id) {
  const { session } = await requirePermission("settings_manage");
  const tenantId = session.user.tenantId;

  return prisma.formSubmission.deleteMany({
    where: { id: Number(id), form: { tenantId } },
  });
}
