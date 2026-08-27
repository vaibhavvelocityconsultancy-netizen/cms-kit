// import prisma from "@/lib/prisma";
// import { requireAuth, requirePermission } from "@/lib/auth";
// import { sendEmail } from "@/lib/email/send";

import { sendEmail } from "@/src/app/lib/email";
import { prisma } from "@/src/app/lib/prisma";
import { requireAuth, requirePermission } from "@/src/app/lib/withPermission";

export async function POST(req) {
  await requireAuth(req);
  await requirePermission(req, "MANAGE_EMAILS");

  const { testEmail } = await req.json();
  const settings = await prisma.emailSettings.findUnique({ where: { id: "singleton" } });

  try {
    await sendEmail({
      to: testEmail,
      subject: "Test email from your CMS",
      html: `<p>This is a test email sent from <b>${settings.senderName || "your site"}</b>. If you're reading this, your email setup is working.</p>`,
    });

    await prisma.emailSettings.update({
      where: { id: "singleton" },
      data: { lastTestStatus: "SUCCESS", lastTestAt: new Date(), lastTestError: null },
    });

    return Response.json({ success: true });
  } catch (err) {
    await prisma.emailSettings.update({
      where: { id: "singleton" },
      data: { lastTestStatus: "FAILED", lastTestAt: new Date(), lastTestError: err.message },
    });

    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}