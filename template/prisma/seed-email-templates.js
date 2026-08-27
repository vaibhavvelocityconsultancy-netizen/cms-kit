import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const layoutWrap = (inner) => `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7; padding:32px 0;">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:8px; overflow:hidden;">
      <tr><td style="background:#111827; padding:20px 32px;">
        <span style="color:#fff; font-size:18px; font-weight:600;">{{siteName}}</span>
      </td></tr>
      <tr><td style="padding:32px; color:#1f2937; font-size:15px; line-height:1.6;">
        ${inner}
      </td></tr>
      <tr><td style="padding:20px 32px; background:#f9fafb; color:#9ca3af; font-size:12px;">
        This is an automated email. Please don't reply directly.
      </td></tr>
    </table>
  </td></tr>
</table>`;

const row = (label, value) => `
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;">
  <tr>
    <td style="padding:6px 0; color:#6b7280;">${label}</td>
    <td style="padding:6px 0; text-align:right; font-weight:600; color:#111827;">${value}</td>
  </tr>
</table>`;

const templates = [
  {
    triggerEvent: "COURSE_ENROLLED",
    recipientType: "CUSTOMER",
    name: "Course Enrollment Receipt",
    subject: "You're enrolled in {{courseName}}",
    variables: ["name", "email", "courseName", "currency", "amount", "siteName"],
    bodyHtml: layoutWrap(`
      <p>Hi {{name}},</p>
      <p>Your payment was successful and you now have lifetime access to:</p>
      <h2 style="margin:16px 0; color:#111827;">{{courseName}}</h2>
      ${row("Amount Paid", "{{currency}} {{amount}}")}
      <p style="margin-top:24px;">Happy learning!</p>
    `),
  },
  {
    triggerEvent: "COURSE_ENROLLED",
    recipientType: "ADMIN",
    name: "New Enrollment Notification",
    subject: "New enrollment: {{courseName}}",
    variables: ["name", "email", "courseName", "currency", "amount", "siteName"],
    bodyHtml: layoutWrap(`
      <p><b>{{name}}</b> ({{email}}) just enrolled in <b>{{courseName}}</b>.</p>
      ${row("Amount", "{{currency}} {{amount}}")}
    `),
  },
  {
    triggerEvent: "ORDER_PLACED",
    recipientType: "CUSTOMER",
    name: "Subscription Confirmation",
    subject: "Your {{planName}} subscription is active",
    variables: ["name", "planName", "billingCycle", "currency", "amount", "siteName"],
    bodyHtml: layoutWrap(`
      <p>Hi {{name}},</p>
      <p>Your payment was successful. Your subscription is now active:</p>
      ${row("Plan", "{{planName}}")}
      ${row("Billing Cycle", "{{billingCycle}}")}
      ${row("Amount Paid", "{{currency}} {{amount}}")}
    `),
  },
  {
    triggerEvent: "ORDER_PLACED",
    recipientType: "ADMIN",
    name: "New Subscription Notification",
    subject: "New plan purchase: {{planName}}",
    variables: ["name", "email", "planName", "billingCycle", "currency", "amount", "siteName"],
    bodyHtml: layoutWrap(`
      <p><b>{{name}}</b> ({{email}}) just purchased <b>{{planName}}</b>.</p>
      ${row("Billing Cycle", "{{billingCycle}}")}
      ${row("Amount", "{{currency}} {{amount}}")}
    `),
  },
  {
    triggerEvent: "PRODUCT_PURCHASED",
    recipientType: "CUSTOMER",
    name: "Order Receipt",
    subject: "Order confirmed - #{{orderNumber}}",
    variables: ["name", "orderNumber", "currency", "amount", "siteName"],
    bodyHtml: layoutWrap(`
      <p>Hi {{name}},</p>
      <p>Thanks for your order! Here's a summary:</p>
      ${row("Order Number", "#{{orderNumber}}")}
      ${row("Amount Paid", "{{currency}} {{amount}}")}
      <p style="margin-top:24px;">We'll notify you once it ships.</p>
    `),
  },
  {
    triggerEvent: "PRODUCT_PURCHASED",
    recipientType: "ADMIN",
    name: "New Order Notification",
    subject: "New order: #{{orderNumber}}",
    variables: ["name", "email", "orderNumber", "currency", "amount", "siteName"],
    bodyHtml: layoutWrap(`
      <p><b>{{name}}</b> ({{email}}) placed order <b>#{{orderNumber}}</b>.</p>
      ${row("Amount", "{{currency}} {{amount}}")}
    `),
  },
];

async function main() {
  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: {
        triggerEvent_recipientType: {
          triggerEvent: template.triggerEvent,
          recipientType: template.recipientType,
        },
      },
      update: {},
      create: template,
    });
  }

  console.log(`Seeded ${templates.length} email templates`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
