// import prisma from "@/lib/prisma";
// import { requireAuth, requirePermission } from "@/lib/auth";

import { prisma } from "@/src/app/lib/prisma";
import { requireAuth, requirePermission } from "@/src/app/lib/withPermission";

export async function GET(req) {
  await requireAuth(req);
  await requirePermission(req, "MANAGE_EMAILS");

  let settings = await prisma.emailSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) settings = await prisma.emailSettings.create({ data: { id: "singleton" } });

  return Response.json({ settings });
}

export async function PATCH(req) {
  await requireAuth(req);
  await requirePermission(req, "MANAGE_EMAILS");

  const body = await req.json();
  const settings = await prisma.emailSettings.upsert({
    where: { id: "singleton" },
    update: body,
    create: { id: "singleton", ...body },
  });

  return Response.json({ settings });
}