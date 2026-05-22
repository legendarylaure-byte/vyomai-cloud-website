import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export type EmailProvider = "smtp";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailWithAttachmentOptions extends EmailOptions {
  attachmentBuffer: Buffer;
  attachmentFilename: string;
}

export interface EmailResult {
  success: boolean;
  provider?: EmailProvider;
  error?: string;
  messageId?: string;
}

export interface EmailConfig {
  provider: EmailProvider;
  fromName: string;
  fromAddress: string;
  replyTo?: string;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
}

function escapeHtml(text: string): string {
  const escapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => escapeMap[char] || char);
}

async function sendViaSMTP(options: EmailOptions, config: EmailConfig): Promise<EmailResult> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const effectiveHost = config.smtpHost || (resendApiKey ? "smtp.resend.com" : undefined);
    const effectiveUser = config.smtpUser || (resendApiKey ? "resend" : undefined);
    const smtpPassword = config.smtpPassword || process.env.EMAIL_SMTP_PASSWORD || resendApiKey || "";

    if (!effectiveHost || !effectiveUser || !smtpPassword) {
      return { success: false, error: "SMTP configuration incomplete" };
    }

    const transporter: Transporter = nodemailer.createTransport({
      host: effectiveHost,
      port: parseInt(config.smtpPort || "587"),
      secure: config.smtpSecure || false,
      auth: {
        user: effectiveUser,
        pass: smtpPassword,
      },
    });

    const fromAddress = options.from || `"${config.fromName}" <${config.fromAddress}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: options.to,
      replyTo: options.replyTo || config.replyTo,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return { success: true, provider: "smtp", messageId: info.messageId };
  } catch (error: any) {
    return { success: false, provider: "smtp", error: error.message || "SMTP send failed" };
  }
}

export async function sendEmailWithProvider(
  options: EmailOptions,
  config: EmailConfig
): Promise<EmailResult> {
  return sendViaSMTP(options, config);
}

export async function testProvider(provider: EmailProvider, config: EmailConfig): Promise<EmailResult> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const effectiveHost = config.smtpHost || (resendApiKey ? "smtp.resend.com" : undefined);
    const effectiveUser = config.smtpUser || (resendApiKey ? "resend" : undefined);
    const smtpPassword = config.smtpPassword || process.env.EMAIL_SMTP_PASSWORD || resendApiKey || "";

    if (!effectiveHost || !effectiveUser || !smtpPassword) {
      return { success: false, error: "SMTP configuration incomplete" };
    }

    const transporter = nodemailer.createTransport({
      host: effectiveHost,
      port: parseInt(config.smtpPort || "587"),
      secure: config.smtpSecure || false,
      auth: { user: effectiveUser, pass: smtpPassword },
    });

    await transporter.verify();
    return { success: true, provider: "smtp" };
  } catch (error: any) {
    return { success: false, provider: "smtp", error: error.message || "SMTP connection failed" };
  }
}

export { escapeHtml };
