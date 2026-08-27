// import prisma from "@/lib/prisma";
import { prisma } from "@/src/app/lib/prisma";
import { requireAuth, requirePermission } from "@/src/app/lib/withPermission";
// import { requireAuth, requirePermission } from "@/lib/auth"; // your existing helpers

export async function GET() {
  await requireAuth();
  await requirePermission("MANAGE_EMAILS");

  const templates = await prisma.emailTemplate.findMany({
    orderBy: [{ triggerEvent: "asc" }, { recipientType: "asc" }],
  });

  return Response.json({ templates });
}
