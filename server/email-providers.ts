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

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// SMTP connection pool: reuse a single transporter per host to avoid handshake overhead
const transporterPool = new Map<string, Transporter>();

function getTransporterKey(config: EmailConfig): string {
  return `${config.smtpHost}:${config.smtpPort}:${config.smtpUser}`;
}

function getOrCreateTransporter(config: EmailConfig): Transporter {
  const resendApiKey = process.env.RESEND_API_KEY;
  const effectiveHost = resendApiKey ? "smtp.resend.com" : (config.smtpHost || undefined);
  const effectiveUser = resendApiKey ? "resend" : (config.smtpUser || undefined);
  const smtpPassword = resendApiKey || config.smtpPassword || process.env.EMAIL_SMTP_PASSWORD || "";

  if (!effectiveHost || !effectiveUser || !smtpPassword) {
    throw new Error("SMTP configuration incomplete");
  }

  const key = getTransporterKey(config);
  if (transporterPool.has(key)) {
    return transporterPool.get(key)!;
  }

  const transporter = nodemailer.createTransport({
    host: effectiveHost,
    port: parseInt(config.smtpPort || "587"),
    secure: config.smtpSecure || false,
    auth: {
      user: effectiveUser,
      pass: smtpPassword,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 10,
  });

  transporterPool.set(key, transporter);
  return transporter;
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

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendViaSMTPWithRetry(options: EmailOptions, config: EmailConfig, attempt = 1): Promise<EmailResult> {
  try {
    const transporter = getOrCreateTransporter(config);
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
    const errMsg = error.message || "SMTP send failed";

    if (attempt < MAX_RETRIES) {
      console.log(`[email] Retry ${attempt}/${MAX_RETRIES} for ${options.to}: ${errMsg}`);
      await sleep(RETRY_DELAY_MS * attempt);
      return sendViaSMTPWithRetry(options, config, attempt + 1);
    }

    return { success: false, provider: "smtp", error: errMsg };
  }
}

async function sendViaSMTP(options: EmailOptions, config: EmailConfig): Promise<EmailResult> {
  return sendViaSMTPWithRetry(options, config);
}

export async function sendEmailWithProvider(
  options: EmailOptions,
  config: EmailConfig
): Promise<EmailResult> {
  return sendViaSMTP(options, config);
}

export async function testProvider(provider: EmailProvider, config: EmailConfig): Promise<EmailResult> {
  try {
    const transporter = getOrCreateTransporter(config);
    await transporter.verify();
    return { success: true, provider: "smtp" };
  } catch (error: any) {
    return { success: false, provider: "smtp", error: error.message || "SMTP connection failed" };
  }
}

export { escapeHtml };
