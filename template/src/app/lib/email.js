import { getEmailTemplates } from "./email-template";
import { sendEmail as sendViaProvider } from "./email/send";
import { sendTriggerEmail } from "./email/trigger";

import nodemailer from "nodemailer";

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatFieldLabel(name) {
  const raw = String(name ?? "").trim();
  if (!raw) return "";

  const spaced = raw
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");

  return spaced
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

const hasSmtpConfig =
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS;

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

// transporter.verify((error) => {
//   if (error) {
//     console.error("SMTP Error:", error);
//   } else {
//     console.log("SMTP Ready");
//   }
// });

// ── Replace {{fieldName}} variables in a string ───────────

export function replaceVariables(template, data = {}, fieldLabels = {}) {
  if (!template) return "";

  let result = template;

  // Replace {{*}} with full HTML table of all fields
  if (result.includes("{{*}}")) {
    const tableRows = Object.entries(data)
      .map(([key, value]) => {
        const label = fieldLabels[key] || formatFieldLabel(key);
        return `
        <tr>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;">${escapeHtml(label)}</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(value ?? "")}</td>
        </tr>`;
      })
      .join("");

    const table = `
      <table style="width:100%;border-collapse:collapse;font-family:sans-serif;font-size:14px;">
        ${tableRows}
      </table>`;

    result = result.replace(/\{\{\*\}\}/g, table);
  }

  // Replace individual {{fieldName}} variables
  Object.entries(data).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value ?? "");
  });

  return result;
}

// ── Send a single email ───────────────────────────────────

export async function sendEmail({ to, cc, bcc, replyTo, from, subject, html }) {
  console.log({
    to,
    subject,
  });
  try {
    const info = transporter
      ? await transporter.sendMail({
          from: from || process.env.MAIL_FROM || process.env.SMTP_FROM,
          to,
          cc,
          bcc,
          replyTo,
          subject,
          html,
        })
      : await sendViaProvider({ to, cc, bcc, replyTo, from, subject, html });

    console.log("Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("Failed to send email:", err);
    throw err;
  }
}

// ── Process all email configs for a form submission ───────

export async function sendFormEmails(
  emailConfigs,
  submissionData,
  fieldLabels = {},
) {
  if (!emailConfigs?.length) return;

  const errors = [];

  for (const emailConfig of emailConfigs) {
    let to = "";
    try {
      const subject = replaceVariables(
        emailConfig.subject,
        submissionData,
        fieldLabels,
      );
      const html = emailConfig.html
        ? emailConfig.html
        : replaceVariables(emailConfig.message, submissionData, fieldLabels);

      const htmlBody = html.includes("<") ? html : html.replace(/\n/g, "<br/>");
      to = replaceVariables(
        emailConfig.emailTo,
        submissionData,
        fieldLabels,
      ).trim();
      const cc = replaceVariables(
        emailConfig.cc,
        submissionData,
        fieldLabels,
      ).trim();
      const bcc = replaceVariables(
        emailConfig.bcc,
        submissionData,
        fieldLabels,
      ).trim();
      const replyTo = replaceVariables(
        emailConfig.replyTo,
        submissionData,
        fieldLabels,
      ).trim();

      // Build dynamic "from" display name
      const senderName = submissionData.senderName;
      const from = senderName
        ? `"${senderName} via Velocity Academy" <${process.env.MAIL_FROM}>`
        : undefined; // falls back to default in sendEmail

      if (!to) {
        console.warn("Skipping email because recipient is empty.");
        continue;
      }

      await sendEmail({
        to,
        cc: cc || undefined,
        bcc: bcc || undefined,
        replyTo: replyTo || undefined,
        from,
        subject,
        html: htmlBody,
      });
    } catch (err) {
      console.error(`[email] Failed to send email config:`, err);
      errors.push({ recipient: to, error: err.message });
    }
  }

  return errors;
}

export async function sendTriggerEmails(triggerEvent, data) {
  const results = await sendTriggerEmail(triggerEvent, data ?? {});
  if (results.length) return results;

  const configs = await getEmailTemplates(triggerEvent, data ?? {});
  if (!configs.length) return;
  return sendFormEmails(configs, data ?? {});
}

// import Mailgun from "mailgun.js";
// import FormData from "form-data";
// import { prisma } from "./prisma";
// import { getEmailTemplates } from "./email-template";

// // ── Create Mailgun client ─────────────────────────────────

// function createClient() {
//   const mailgun = new Mailgun(FormData);
//   return mailgun.client({
//     username: "api",
//     key: process.env.MAILGUN_API_KEY,
//     url: process.env.MAILGUN_URL || "https://api.mailgun.net",
//   });
// }

// // ── Replace {{fieldName}} variables in a string ───────────

// export function replaceVariables(template, data) {
//   if (!template) return "";

//   let result = template;

//   // Replace {{*}} with full HTML table of all fields
//   if (result.includes("{{*}}")) {
//     const tableRows = Object.entries(data)
//       .map(
//         ([key, value]) => `
//         <tr>
//           <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;">${key}</td>
//           <td style="padding:8px 12px;border:1px solid #e5e7eb;">${value ?? ""}</td>
//         </tr>`,
//       )
//       .join("");

//     const table = `
//       <table style="width:100%;border-collapse:collapse;font-family:sans-serif;font-size:14px;">
//         ${tableRows}
//       </table>`;

//     result = result.replace(/\{\{\*\}\}/g, table);
//   }

//   // Replace individual {{fieldName}} variables
//   Object.entries(data).forEach(([key, value]) => {
//     result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value ?? "");
//   });

//   return result;
// }

// // ── Send a single email ───────────────────────────────────

// export async function sendEmail({ to, cc, bcc, replyTo, from, subject, html }) {
//   const mg = createClient();

//   const messageData = {
//     from:
//       from ||
//       process.env.MAIL_FROM ||
//       `postmaster@${process.env.MAILGUN_DOMAIN}`,
//     to,
//     subject,
//     html,
//   };
//   if (cc) messageData.cc = cc;
//   if (bcc) messageData.bcc = bcc;
//   if (replyTo) messageData["h:Reply-To"] = replyTo;

//   console.log("[email] Sending to:", to);
//   console.log("[email] From:", messageData.from);
//   console.log("[email] Domain:", process.env.MAILGUN_DOMAIN);
//   console.log("[email] API Key exists:", !!process.env.MAILGUN_API_KEY);

//   await mg.messages.create(process.env.MAILGUN_DOMAIN, messageData);
// }
// // ── Process all email configs for a form submission ───────

// export async function sendFormEmails(emailConfigs, submissionData) {
//   if (!emailConfigs?.length) return;

//   const errors = [];

//   for (const emailConfig of emailConfigs) {
//     try {
//       const subject = replaceVariables(emailConfig.subject, submissionData);
//       const html = replaceVariables(emailConfig.message, submissionData);

//       // Convert plain text to basic HTML if needed
//       const htmlBody = html.includes("<") ? html : html.replace(/\n/g, "<br/>");

//       await sendEmail({
//         to: replaceVariables(emailConfig.emailTo, submissionData).trim(),
//         cc: replaceVariables(emailConfig.cc, submissionData).trim(),
//         bcc: replaceVariables(emailConfig.bcc, submissionData).trim(),
//         replyTo: replaceVariables(emailConfig.replyTo, submissionData).trim(),
//         from: replaceVariables(emailConfig.emailFrom, submissionData).trim(),
//         subject,
//         html: htmlBody,
//       });
//     } catch (err) {
//       console.error(`[email] Failed to send email config:`, err);
//       errors.push(err.message);
//     }
//   }

//   return errors;
// }

// export async function sendTriggerEmails(triggerEvent, data) {
//   const configs = getEmailTemplates(triggerEvent);
//   if (!configs.length) return;
//   return sendFormEmails(configs, data);
// }
