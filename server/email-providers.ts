import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export type EmailProvider = "gmail" | "smtp" | "sendgrid";

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
  smtpPassword?: string; // Added to interface
  smtpSecure?: boolean;
  sendgridFromEmail?: string;
  providerPriority: EmailProvider[];
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

async function sendViaGmail(options: EmailOptions): Promise<EmailResult> {
  try {
    if (!process.env.REPLIT_CONNECTORS_HOSTNAME) {
      return { success: false, error: "Gmail connector not available (not running on Replit)" };
    }

    const { getUncachableGmailClient } = await import("./gmail-client.js");
    const gmail = await getUncachableGmailClient();
    
    const message = [
      `To: ${options.to}`,
      options.from ? `From: ${options.from}` : "",
      options.replyTo ? `Reply-To: ${options.replyTo}` : "",
      `Subject: ${options.subject}`,
      "Content-Type: text/html; charset=utf-8",
      "",
      options.html,
    ].filter(Boolean).join("\n");

    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage },
    });

    return { success: true, provider: "gmail" };
  } catch (error: any) {
    return { success: false, provider: "gmail", error: error.message || "Gmail send failed" };
  }
}

async function sendViaSMTP(options: EmailOptions, config: EmailConfig): Promise<EmailResult> {
  try {
    const smtpPassword = process.env.EMAIL_SMTP_PASSWORD || config.smtpPassword;
    
    if (!config.smtpHost || !config.smtpUser || !smtpPassword) {
      return { success: false, error: "SMTP configuration incomplete" };
    }

    const transporter: Transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: parseInt(config.smtpPort || "587"),
      secure: config.smtpSecure || false,
      auth: {
        user: config.smtpUser,
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

async function sendViaSendGrid(options: EmailOptions, config: EmailConfig): Promise<EmailResult> {
  try {
    const apiKey = process.env.EMAIL_SENDGRID_API_KEY || process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      return { success: false, error: "SendGrid API key not configured" };
    }

    const fromEmail = config.sendgridFromEmail || config.fromAddress;

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: options.to }] }],
        from: { email: fromEmail, name: config.fromName },
        reply_to: options.replyTo || config.replyTo ? { email: options.replyTo || config.replyTo } : undefined,
        subject: options.subject,
        content: [
          { type: "text/html", value: options.html },
          ...(options.text ? [{ type: "text/plain", value: options.text }] : []),
        ],
      }),
    });

    if (response.ok || response.status === 202) {
      return { success: true, provider: "sendgrid" };
    }

    const errorText = await response.text();
    return { success: false, provider: "sendgrid", error: `SendGrid error: ${response.status} - ${errorText}` };
  } catch (error: any) {
    return { success: false, provider: "sendgrid", error: error.message || "SendGrid send failed" };
  }
}

export async function sendEmailWithProvider(
  options: EmailOptions,
  config: EmailConfig
): Promise<EmailResult> {
  const providers = config.providerPriority;
  const errors: string[] = [];

  for (const provider of providers) {
    let result: EmailResult;

    switch (provider) {
      case "gmail":
        result = await sendViaGmail(options);
        break;
      case "smtp":
        result = await sendViaSMTP(options, config);
        break;
      case "sendgrid":
        result = await sendViaSendGrid(options, config);
        break;
      default:
        continue;
    }

    if (result.success) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`✅ Email sent via ${provider} to ${options.to}`);
      }
      return result;
    }

    errors.push(`${provider}: ${result.error}`);
    if (process.env.NODE_ENV !== "production") {
      console.log(`⚠️ ${provider} failed: ${result.error}`);
    }
  }

  return {
    success: false,
    error: `All providers failed: ${errors.join("; ")}`,
  };
}

export async function testProvider(provider: EmailProvider, config: EmailConfig): Promise<EmailResult> {
  switch (provider) {
    case "gmail":
      try {
        if (!process.env.REPLIT_CONNECTORS_HOSTNAME) {
          return { success: false, error: "Not running on Replit - Gmail connector unavailable" };
        }
        const { getUncachableGmailClient } = await import("./gmail-client.js");
        const gmail = await getUncachableGmailClient();
        await gmail.users.getProfile({ userId: "me" });
        return { success: true, provider: "gmail" };
      } catch (error: any) {
        return { success: false, provider: "gmail", error: error.message || "Gmail connection failed" };
      }

    case "smtp":
      try {
        const smtpPassword = process.env.EMAIL_SMTP_PASSWORD || config.smtpPassword;
        if (!config.smtpHost || !config.smtpUser || !smtpPassword) {
          return { success: false, error: "SMTP configuration incomplete" };
        }
        const transporter = nodemailer.createTransport({
          host: config.smtpHost,
          port: parseInt(config.smtpPort || "587"),
          secure: config.smtpSecure || false,
          auth: { user: config.smtpUser, pass: smtpPassword },
        });
        await transporter.verify();
        return { success: true, provider: "smtp" };
      } catch (error: any) {
        return { success: false, provider: "smtp", error: error.message || "SMTP connection failed" };
      }

    case "sendgrid":
      const apiKey = process.env.EMAIL_SENDGRID_API_KEY || process.env.SENDGRID_API_KEY;
      if (!apiKey) {
        return { success: false, error: "SendGrid API key not configured" };
      }
      return { success: true, provider: "sendgrid" };

    default:
      return { success: false, error: "Unknown provider" };
  }
}

export { escapeHtml };
