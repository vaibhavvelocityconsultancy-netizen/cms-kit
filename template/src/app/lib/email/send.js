import { send as sendViaNodemailer } from "./providers/nodemailer.provider";

const PROVIDERS = {
  nodemailer: sendViaNodemailer,
};

export async function sendEmail({ to, subject, html, cc, bcc, replyTo, from }) {
  const provider = getActiveProvider();
  const send = PROVIDERS[provider];

  if (!send) {
    throw new Error(`Unsupported email provider: ${provider}`);
  }

  return send({ to, subject, html, cc, bcc, replyTo, from });
}

export function getActiveProvider() {
  return process.env.EMAIL_PROVIDER || "nodemailer";
}
