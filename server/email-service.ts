import { sendEmailWithProvider, testProvider, escapeHtml, type EmailOptions, type EmailConfig, type EmailResult, type EmailProvider } from "./email-providers.js";
import { storage } from "./storage.js";
import OpenAI from "openai";

// Initialize OpenAI client
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  const sanitizedKey = process.env.OPENAI_API_KEY.trim().replace(/[\n\r]/g, '').replace(/y$/, '');
  openai = new OpenAI({ apiKey: sanitizedKey });
} else {
  console.log("⚠️ OPENAI_API_KEY not set - Smart email features will fall back to templates");
}

async function generateSmartEmailContent(type: 'booking' | 'inquiry', data: { name: string, message?: string, context?: string }): Promise<string> {
  if (!openai) return "";

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
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: "You are a professional AI email assistant." }, { role: "user", content: prompt }],
      max_tokens: 300,
    });
    return completion.choices[0].message.content || "";
  } catch (error) {
    console.error("AI Email Generation Failed:", error);
    return "";
  }
}

let cachedConfig: EmailConfig | null = null;
let configLastFetched = 0;
const CONFIG_CACHE_TTL = 60000; // 1 minute

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
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort || "587",
      smtpUser: settings.smtpUser,
      smtpPassword: settings.smtpPassword,
      smtpSecure: settings.smtpSecure || false,
      sendgridFromEmail: settings.sendgridFromEmail,
      providerPriority: providerPriority.length > 0 ? providerPriority : ["smtp", "gmail", "sendgrid"],
    };
    configLastFetched = now;
    return cachedConfig;
  } catch (error) {
    return {
      provider: "smtp",
      fromName: "VyomAi",
      fromAddress: "info@vyomai.cloud",
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
}): Promise<void> {
  const config = await getEmailConfig();
  
  const html = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
    <p><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(data.message).replace(/\n/g, "<br>")}</p>
  `;

  const text = `
    New Contact Form Submission
    
    Name: ${data.name}
    Email: ${data.email}
    Subject: ${data.subject}
    
    Message:
    ${data.message}
  `;

  await sendEmail({
    to: config.fromAddress,
    subject: `New Contact: ${data.subject}`,
    html,
    text,
  });

  // Generate AI Response
  const aiResponse = await generateSmartEmailContent('inquiry', { name: data.name, message: data.message });
  
  const confirmHtml = aiResponse || `
    <h2>Thank you for contacting VyomAi!</h2>
    <p>Hi ${escapeHtml(data.name)},</p>
    <p>We received your message and will get back to you soon.</p>
    <p><strong>Your Message:</strong></p>
    <p>${escapeHtml(data.message).replace(/\n/g, "<br>")}</p>
    <p>Best regards,<br>VyomAi Team</p>
  `;

  // Use sendEmailWithResult to check if the user email failed
  const userResult = await sendEmailWithResult({
    to: data.email,
    subject: "We received your message - VyomAi",
    html: confirmHtml,
  });

  if (!userResult.success) {
    console.error(`Failed to send confirmation to user ${data.email}: ${userResult.error}`);
    // If the error indicates invalid recipient, we can throw a specific error
    if (userResult.error?.includes("Recipient address rejected") || userResult.error?.includes("User unknown") || userResult.error?.includes("550")) {
      throw new Error("User does not exist or email is invalid");
    }
    // For other errors, we might still want to alert the caller, or just log if admin email succeeded.
    // However, the user explicitly wants to know if they input wrong email.
    throw new Error(`Failed to send confirmation email: ${userResult.error}`);
  }
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
  const currencySymbols: Record<string, string> = { USD: "$", EUR: "€", INR: "₹", NPR: "₨" };
  const symbol = currencySymbols[data.currency] || "$";

  const adminHtml = `
    <h2>New Custom Pricing Request</h2>
    <p><strong>Package:</strong> ${escapeHtml(data.packageName)}</p>
    <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
    <p><strong>Mobile:</strong> ${escapeHtml(data.mobileNumber)}</p>
    <p><strong>Estimated Price:</strong> ${symbol}${data.estimatedPrice} ${data.currency}</p>
    <p><strong>Custom Requirements:</strong></p>
    <p>${escapeHtml(data.request).replace(/\n/g, "<br>")}</p>
    <p><strong>Action:</strong> Contact the customer to discuss their custom needs and provide a detailed quote.</p>
  `;

  await sendEmail({
    to: data.adminEmail || config.fromAddress,
    subject: `New Custom Pricing Request for ${data.packageName}`,
    html: adminHtml,
  });

  const customerHtml = `
    <h2>We Received Your Custom Pricing Request!</h2>
    <p>Hi ${escapeHtml(data.name)},</p>
    <p>Thank you for your interest in our <strong>${escapeHtml(data.packageName)}</strong> package with custom requirements.</p>
    <p>We've received your request and our team will review your specific needs.</p>
    <p><strong>Your Package:</strong> ${escapeHtml(data.packageName)}</p>
    <p><strong>Estimated Price Range:</strong> ${symbol}${data.estimatedPrice} ${data.currency}</p>
    <p>Our team will contact you at <strong>${escapeHtml(data.mobileNumber)}</strong> within 24 hours to discuss your custom needs and provide you with a detailed personalized quote.</p>
    <p>We look forward to helping you!</p>
    <p>Best regards,<br><strong>VyomAi Team</strong></p>
  `;

  await sendEmail({
    to: data.email,
    subject: `Custom Pricing Request Received - ${data.packageName}`,
    html: customerHtml,
  });
}

export async function sendPasswordResetEmail(
  recipientEmail: string,
  verificationCode: string
): Promise<void> {
  const html = `
    <h2>Password Reset Request</h2>
    <p>You requested to reset your admin password.</p>
    <p>Your verification code is: <strong style="font-size: 24px; color: #667eea;">${escapeHtml(verificationCode)}</strong></p>
    <p>This code expires in 15 minutes.</p>
    <p>Do not share this code with anyone.</p>
    <p>If you didn't request this, you can ignore this email.</p>
  `;

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
}): Promise<void> {
  const config = await getEmailConfig();
  
  const html = `
    <h2>Booking Request Received!</h2>
    <p>Hi ${escapeHtml(data.name)},</p>
    <p>Thank you for your interest in VyomAi's services. We have received your booking request and will contact you shortly.</p>
    
    <h3>Your Details:</h3>
    <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
    <p><strong>Company/Personal:</strong> ${escapeHtml(data.companyOrPersonal)}</p>
    ${data.message ? `<p><strong>Message:</strong> ${escapeHtml(data.message).replace(/\n/g, "<br>")}</p>` : ""}
    
    <p>Our team will contact you within 24 hours.</p>
    <p>Best regards,<br>VyomAi Team</p>
  `;

  const companyHtml = `
    <h2>New Booking Request</h2>
    <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
    <p><strong>Company/Personal:</strong> ${escapeHtml(data.companyOrPersonal)}</p>
    ${data.message ? `<p><strong>Message:</strong> ${escapeHtml(data.message).replace(/\n/g, "<br>")}</p>` : ""}
  `;

  await sendEmail({
    to: config.fromAddress,
    subject: `New Booking Request from ${data.name}`,
    html: companyHtml,
  });

  // Generate AI Response
  const aiResponse = await generateSmartEmailContent('booking', { name: data.name, message: data.message, context: data.companyOrPersonal });

  const confirmHtml = aiResponse || `
    <h2>Booking Request Received!</h2>
    <p>Hi ${escapeHtml(data.name)},</p>
    <p>Thank you for your interest in VyomAi's services. We have received your booking request and will contact you shortly.</p>
    
    <h3>Your Details:</h3>
    <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
    <p><strong>Company/Personal:</strong> ${escapeHtml(data.companyOrPersonal)}</p>
    ${data.message ? `<p><strong>Message:</strong> ${escapeHtml(data.message).replace(/\n/g, "<br>")}</p>` : ""}
    
    <p>Our team will contact you within 24 hours.</p>
    <p>Best regards,<br>VyomAi Team</p>
  `;

  // Use sendEmailWithResult to check if the user email failed
  const userResult = await sendEmailWithResult({
    to: data.email,
    subject: "Booking Request Confirmed - VyomAi",
    html: confirmHtml,
  });

  if (!userResult.success) {
    console.error(`Failed to send booking confirmation to user ${data.email}: ${userResult.error}`);
    if (userResult.error?.includes("Recipient address rejected") || userResult.error?.includes("User unknown") || userResult.error?.includes("550")) {
       throw new Error("User does not exist or email is invalid");
    }
  }
}
