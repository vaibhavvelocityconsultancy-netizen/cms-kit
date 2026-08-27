import { prisma } from "../prisma";
import { sendEmail, getActiveProvider } from "./send";

function fillPlaceholders(value = "", data = {}) {
  return value.replace(/{{(\w+)}}/g, (_, key) => data[key] ?? "");
}

function getRecipient(template, data = {}) {
  if (template.recipientType === "ADMIN") return process.env.ADMIN_EMAIL;
  return data.email;
}

export async function sendTriggerEmail(triggerEvent, data = {}) {
  const templates = await prisma.emailTemplate.findMany({
    where: { triggerEvent, isActive: true },
    orderBy: { recipientType: "asc" },
  });

  const results = [];
  const provider = getActiveProvider();
  const templateData = {
    siteName:
      process.env.SITE_NAME || process.env.NEXT_PUBLIC_SITE_NAME || "IPDAV",
    ...data,
  };

  for (const template of templates) {
    const emailTo = getRecipient(template, templateData);
    const subject = fillPlaceholders(template.subject, templateData);
    const html = fillPlaceholders(template.bodyHtml, templateData);

    if (!emailTo) {
      results.push({
        recipientType: template.recipientType,
        status: "SKIPPED",
        error: "Recipient email is missing",
      });
      continue;
    }

    const log = await prisma.emailLog.create({
      data: {
        templateId: template.id,
        triggerEvent,
        recipientType: template.recipientType,
        emailTo,
        subject,
        status: "PENDING",
        provider,
        metadata: templateData,
      },
    });

    try {
      await sendEmail({ to: emailTo, subject, html });
      await prisma.emailLog.update({
        where: { id: log.id },
        data: { status: "SENT", sentAt: new Date() },
      });
      results.push({ recipientType: template.recipientType, status: "SENT" });
    } catch (error) {
      const message = error?.message || "Email send failed";
      await prisma.emailLog.update({
        where: { id: log.id },
        data: { status: "FAILED", error: message },
      });
      results.push({
        recipientType: template.recipientType,
        status: "FAILED",
        error: message,
      });
    }
  }

  return results;
}
