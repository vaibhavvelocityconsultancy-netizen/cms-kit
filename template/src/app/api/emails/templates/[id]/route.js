// import prisma from "@/lib/prisma";
// import { requireAuth, requirePermission } from "@/lib/auth";

import { prisma } from "@/src/app/lib/prisma";
import { requireAuth, requirePermission } from "@/src/app/lib/withPermission";

async function getTemplateId(params) {
  const resolvedParams = await params;
  return resolvedParams?.id;
}

export async function GET(_req, { params }) {
  await requireAuth();
  await requirePermission("MANAGE_EMAILS");

  const id = await getTemplateId(params);
  if (!id) {
    return Response.json({ error: "Template id is required" }, { status: 400 });
  }

  const template = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!template) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ template });
}

export async function PATCH(req, { params }) {
  await requireAuth();
  await requirePermission("MANAGE_EMAILS");

  const id = await getTemplateId(params);
  if (!id) {
    return Response.json({ error: "Template id is required" }, { status: 400 });
  }

  const body = await req.json();
  const { subject, bodyHtml, isActive, name } = body;

  const template = await prisma.emailTemplate.update({
    where: { id },
    data: {
      ...(subject !== undefined && { subject }),
      ...(bodyHtml !== undefined && { bodyHtml }),
      ...(isActive !== undefined && { isActive }),
      ...(name !== undefined && { name }),
    },
  });

  return Response.json({ template });
}
