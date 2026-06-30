import { Resend } from "resend";

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    client = new Resend(apiKey);
  }
  return client;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const from = process.env.EMAIL_FROM ?? "Vyntro Sports <noreply@vyntro.app>";
  const { error } = await getClient().emails.send({ from, to: input.to, subject: input.subject, html: input.html });
  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export function sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
  return sendEmail({
    to,
    subject: "Verify your Vyntro Sports email",
    html: `<p>Welcome to Vyntro Sports. Confirm your email address to finish setting up your account:</p>
<p><a href="${verificationUrl}">${verificationUrl}</a></p>
<p>This link expires in 24 hours.</p>`,
  });
}

export function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  return sendEmail({
    to,
    subject: "Reset your Vyntro Sports password",
    html: `<p>We received a request to reset your password. If this was you, set a new password here:</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
  });
}
