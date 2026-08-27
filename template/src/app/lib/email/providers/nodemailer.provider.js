import nodemailer from "nodemailer";

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function send({ to, subject, html, cc, bcc, replyTo, from }) {
  const transporter = createTransporter();

  return transporter.sendMail({
    from: from || process.env.SMTP_FROM || process.env.MAIL_FROM,
    to,
    cc,
    bcc,
    replyTo,
    subject,
    html,
  });
}
