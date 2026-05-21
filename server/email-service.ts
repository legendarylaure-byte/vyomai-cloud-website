import { sendEmailWithProvider, testProvider, type EmailOptions, type EmailConfig, type EmailResult, type EmailProvider } from "./email-providers.js";
import { storage } from "./storage.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildEmailWrapper,
  userBookingConfirmation,
  adminBookingNotification,
  userContactConfirmation,
  adminContactNotification,
  userProjectConfirmation,
  adminProjectNotification,
  passwordResetEmail,
  pricingRequestCustomerConfirmation,
  pricingRequestAdminNotification,
} from "./email-templates.js";

let genAI: GoogleGenerativeAI | null = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  console.log("✅ Gemini API initialized - Smart email features enabled");
} else {
  console.log("⚠️ GEMINI_API_KEY not set - Smart email features will fall back to templates");
}

async function generateSmartEmailContent(type: 'booking' | 'inquiry', data: { name: string, message?: string, context?: string }): Promise<string> {
  if (!genAI) return "";

  const companyInfo = "VyomAi Cloud Pvt. Ltd (The Infinity Sky) - AI Solutions Provider in Nepal.";

  let prompt = "";
  if (type === 'booking') {
    prompt = `Write a short, happy, and excited email response to ${data.name} who just made a booking/inquiry.
    Company: ${companyInfo}
    Tone: Professional but extremely happy, futuristic, and welcoming. Use emojis.
    Context: ${data.context || "Booking a service"} or ${data.message || ""}
    Goal: Confirm we received it and will contact them within 24h.
    Signoff: Best regards, VyomAi Team.
    Format: Return ONLY the HTML body content (no <html> tags), use <p> and <br>.`;
  } else {
    prompt = `Write a short, humble, intelligent, and professional email response to ${data.name} who sent an inquiry.
    Company: ${companyInfo}
    Tone: Humble, smart, respectful, and futuristic.
    Context: ${data.message || "General inquiry"}
    Goal: Acknowledge receipt and promise a reply soon.
    Signoff: Best regards, VyomAi Team.
    Format: Return ONLY the HTML body content (no <html> tags), use <p> and <br>.`;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: "You are a professional AI email assistant.",
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("AI Email Generation Failed:", error);
    return "";
  }
}

let cachedConfig: EmailConfig | null = null;
let configLastFetched = 0;
const CONFIG_CACHE_TTL = 60000;

async function getEmailConfig(): Promise<EmailConfig> {
  const now = Date.now();
  if (cachedConfig && now - configLastFetched < CONFIG_CACHE_TTL) {
    return cachedConfig;
  }

  try {
    const settings = await storage.getSettings();

    const providerPriority = (settings.emailProviderPriority || "smtp,gmail,sendgrid")
      .split(",")
      .map((p: string) => p.trim() as EmailProvider)
      .filter((p: string) => ["gmail", "smtp", "sendgrid"].includes(p));

    cachedConfig = {
      provider: (settings.emailProvider as EmailProvider) || "smtp",
      fromName: settings.emailFromName || "VyomAi",
      fromAddress: settings.emailFromAddress || "info@vyomai.cloud",
      replyTo: settings.emailReplyTo,
      smtpHost: settings.smtpHost || process.env.SMTP_HOST,
      smtpPort: settings.smtpPort || process.env.SMTP_PORT || "587",
      smtpUser: settings.smtpUser || process.env.SMTP_USER,
      smtpPassword: settings.smtpPassword || process.env.EMAIL_SMTP_PASSWORD || process.env.SMTP_PASSWORD,
      smtpSecure: settings.smtpSecure !== undefined ? settings.smtpSecure : process.env.SMTP_SECURE === "true",
      sendgridFromEmail: settings.sendgridFromEmail,
      providerPriority: providerPriority.length > 0 ? providerPriority : ["smtp", "gmail", "sendgrid"],
    };
    configLastFetched = now;
    return cachedConfig;
  } catch (error) {
    const resendKey = process.env.RESEND_API_KEY;
    return {
      provider: "smtp",
      fromName: "VyomAi",
      fromAddress: "info@vyomai.cloud",
      smtpHost: process.env.SMTP_HOST || (resendKey ? "smtp.resend.com" : undefined),
      smtpPort: process.env.SMTP_PORT || "587",
      smtpUser: process.env.SMTP_USER || (resendKey ? "resend" : undefined),
      smtpPassword: process.env.EMAIL_SMTP_PASSWORD || process.env.SMTP_PASSWORD || resendKey,
      providerPriority: ["smtp", "gmail", "sendgrid"],
    };
  }
}

export function clearEmailConfigCache(): void {
  cachedConfig = null;
  configLastFetched = 0;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const config = await getEmailConfig();
  const result = await sendEmailWithProvider(options, config);
  return result.success;
}

export async function sendEmailWithResult(options: EmailOptions): Promise<EmailResult> {
  const config = await getEmailConfig();
  return sendEmailWithProvider(options, config);
}

export async function testEmailProvider(provider?: EmailProvider): Promise<EmailResult> {
  const config = await getEmailConfig();
  const providerToTest = provider || config.provider;
  return testProvider(providerToTest, config);
}

export async function getProviderStatuses(): Promise<Record<EmailProvider, { available: boolean; error?: string }>> {
  const config = await getEmailConfig();
  const results: Record<EmailProvider, { available: boolean; error?: string }> = {
    gmail: { available: false },
    smtp: { available: false },
    sendgrid: { available: false },
  };

  const tests = await Promise.all([
    testProvider("gmail", config),
    testProvider("smtp", config),
    testProvider("sendgrid", config),
  ]);

  results.gmail = { available: tests[0].success, error: tests[0].error };
  results.smtp = { available: tests[1].success, error: tests[1].error };
  results.sendgrid = { available: tests[2].success, error: tests[2].error };

  return results;
}

export async function sendContactFormEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<EmailResult> {
  const config = await getEmailConfig();

  const adminHtml = buildEmailWrapper(
    adminContactNotification(data.name, data.email, data.subject, data.message),
    { type: "admin" }
  );

  const adminResult = await sendEmailWithResult({
    to: config.fromAddress,
    subject: `New Contact: ${data.subject}`,
    html: adminHtml,
  });

  if (!adminResult.success) {
    console.error(`Failed to send admin contact notification: ${adminResult.error}`);
  }

  const userContent = userContactConfirmation(data.name, data.message);
  const aiResponse = await generateSmartEmailContent('inquiry', { name: data.name, message: data.message });
  const finalContent = aiResponse || userContent;
  const userHtml = buildEmailWrapper(finalContent, { recipientName: data.name, type: "user" });

  const userResult = await sendEmailWithResult({
    to: data.email,
    subject: "We received your message - VyomAi",
    html: userHtml,
  });

  if (!userResult.success) {
    console.error(`Failed to send contact confirmation to ${data.email}: ${userResult.error}`);
  }

  return { success: adminResult.success || userResult.success };
}

export async function sendOneTimePricingRequestEmail(data: {
  name: string;
  email: string;
  mobileNumber: string;
  packageName: string;
  request: string;
  estimatedPrice: number;
  currency: string;
  adminEmail?: string;
}): Promise<void> {
  const config = await getEmailConfig();

  const adminHtml = buildEmailWrapper(
    pricingRequestAdminNotification(
      data.name, data.email, data.mobileNumber, data.packageName,
      data.request, data.estimatedPrice, data.currency
    ),
    { type: "admin" }
  );

  const adminResult = await sendEmailWithResult({
    to: data.adminEmail || config.fromAddress,
    subject: `New Custom Pricing Request for ${data.packageName}`,
    html: adminHtml,
  });

  if (!adminResult.success) {
    console.error(`Failed to send pricing admin notification: ${adminResult.error}`);
  }

  const userHtml = buildEmailWrapper(
    pricingRequestCustomerConfirmation(
      data.name, data.packageName, data.estimatedPrice.toString(),
      data.currency, data.mobileNumber
    ),
    { recipientName: data.name, type: "user" }
  );

  const userResult = await sendEmailWithResult({
    to: data.email,
    subject: `Custom Pricing Request Received - ${data.packageName}`,
    html: userHtml,
  });

  if (!userResult.success) {
    console.error(`Failed to send pricing confirmation to ${data.email}: ${userResult.error}`);
  }
}

export async function sendPasswordResetEmail(
  recipientEmail: string,
  verificationCode: string
): Promise<void> {
  const html = buildEmailWrapper(
    passwordResetEmail(verificationCode),
    { type: "system" }
  );

  if (process.env.NODE_ENV !== "production") {
    console.log("🔐 PASSWORD RESET CODE");
    console.log("═".repeat(50));
    console.log(`Email: ${recipientEmail}`);
    console.log(`Code: ${verificationCode}`);
    console.log(`Expires in: 15 minutes`);
    console.log("═".repeat(50));
  }

  await sendEmail({
    to: recipientEmail,
    subject: "Password Reset Verification Code - VyomAi",
    html,
  });
}

export async function sendOTPEmail(recipientEmail: string, otp: string): Promise<void> {
  const html = buildEmailWrapper(`
<h2>✦ Login Verification Code</h2>
<p>Use the code below to complete your login to <strong>VyomAi</strong> admin panel:</p>
<div style="text-align:center;margin:28px 0">
<div style="display:inline-block;background:#f0f0ff;border:2px dashed #8B5CF6;border-radius:12px;padding:16px 32px">
<span style="font-size:32px;font-weight:700;color:#8B5CF6;letter-spacing:8px;font-family:monospace">${otp}</span>
</div>
</div>
<p>This code expires in <strong>10 minutes</strong>. Do not share this code with anyone.</p>
<p style="margin-top:16px;font-size:13px;color:#64748b">If you didn't attempt to login, you can safely ignore this email.</p>
<p style="margin-top:20px">— The VyomAi Team</p>
`, { type: "user" });

  await sendEmail({
    to: recipientEmail,
    subject: "Login Verification Code - VyomAi",
    html,
  });
}

export async function sendEmailWithAttachment(options: {
  to: string;
  subject: string;
  html: string;
  attachmentBuffer: Buffer;
  attachmentFilename: string;
}): Promise<boolean> {
  const config = await getEmailConfig();

  try {
    const nodemailer = await import("nodemailer");
    const smtpPassword = process.env.EMAIL_SMTP_PASSWORD;

    if (!config.smtpHost || !config.smtpUser || !smtpPassword) {
      if (!process.env.REPLIT_CONNECTORS_HOSTNAME) {
        console.error("No email provider available for attachments");
        return false;
      }

      const { getUncachableGmailClient } = await import("./gmail-client.js");
      const gmail = await getUncachableGmailClient();

      const boundary = `----WebKitFormBoundary${Math.random().toString(36).substr(2, 9)}`;

      const emailContent = [
        `To: ${options.to}`,
        `Subject: ${options.subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/html; charset=utf-8`,
        `Content-Transfer-Encoding: quoted-printable`,
        ``,
        options.html,
        ``,
        `--${boundary}`,
        `Content-Type: application/pdf; name="${options.attachmentFilename}"`,
        `Content-Disposition: attachment; filename="${options.attachmentFilename}"`,
        `Content-Transfer-Encoding: base64`,
        ``,
        options.attachmentBuffer.toString("base64").match(/.{1,76}/g)?.join("\n") || "",
        ``,
        `--${boundary}--`
      ].join("\n");

      const encodedMessage = Buffer.from(emailContent)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

      await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw: encodedMessage },
      });

      return true;
    }

    const transporter = nodemailer.default.createTransport({
      host: config.smtpHost,
      port: parseInt(config.smtpPort || "587"),
      secure: config.smtpSecure || false,
      auth: { user: config.smtpUser, pass: smtpPassword },
    });

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromAddress}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: [{
        filename: options.attachmentFilename,
        content: options.attachmentBuffer,
      }],
    });

    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Email with attachment send error:", error);
    }
    return false;
  }
}

export async function sendBookingConfirmationEmail(data: {
  name: string;
  email: string;
  companyOrPersonal: string;
  message?: string;
}): Promise<EmailResult> {
  const config = await getEmailConfig();

  const adminHtml = buildEmailWrapper(
    adminBookingNotification(data.name, data.email, data.companyOrPersonal, data.message),
    { type: "admin" }
  );

  const adminResult = await sendEmailWithResult({
    to: config.fromAddress,
    subject: `New Booking Request from ${data.name}`,
    html: adminHtml,
  });

  if (!adminResult.success) {
    console.error(`Failed to send booking admin notification: ${adminResult.error}`);
  }

  const userContent = userBookingConfirmation(data.name, data.email, data.companyOrPersonal, data.message);
  const aiResponse = await generateSmartEmailContent('booking', { name: data.name, message: data.message, context: data.companyOrPersonal });
  const finalContent = aiResponse || userContent;
  const userHtml = buildEmailWrapper(finalContent, { recipientName: data.name, type: "user" });

  const userResult = await sendEmailWithResult({
    to: data.email,
    subject: "Booking Request Confirmed - VyomAi",
    html: userHtml,
  });

  if (!userResult.success) {
    console.error(`Failed to send booking confirmation to ${data.email}: ${userResult.error}`);
  }

  return { success: adminResult.success || userResult.success };
}
