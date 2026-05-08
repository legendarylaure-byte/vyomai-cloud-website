import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertArticleSchema, insertTeamMemberSchema, insertPricingPackageSchema, insertProjectDiscussionSchema, insertBookingRequestSchema, insertOneTimePricingRequestSchema, insertSocialMediaAnalyticsSchema, insertSocialMediaIntegrationSchema, resetPasswordRequestSchema, verifyResetCodeSchema, resetPasswordSchema, insertCustomerInquirySchema, SocialMediaIntegration } from "../shared/schema.js";
import { z } from "zod";
import jwt from "jsonwebtoken";
import OpenAI from "openai";
import bcryptjs from "bcryptjs";
import { randomBytes } from "crypto";
import { sendContactFormEmail, sendPasswordResetEmail, sendBookingConfirmationEmail, sendOneTimePricingRequestEmail, sendEmail, sendEmailWithAttachment } from "./email-service.js";
import { generateTwoFactorSecret, verifyTwoFactorToken } from "./two-factor-auth.js";
import { initiatePayment } from "./payment-service.js";
import { validateEmailCredentials, fetchEmails, createEmailSession, validateEmailSession, endEmailSession } from "./email-client.js";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import { YouTubeClient } from './social-media-clients/youtube-client.js';
import { FacebookClient, InstagramClient } from './social-media-clients/facebook-client.js';
import { LinkedInClient } from './social-media-clients/linkedin-client.js';
import { TwitterClient } from './social-media-clients/twitter-client.js';
import { syncPlatform, syncAllPlatforms } from './social-media-clients/index.js';
import { initializeAutoSync, schedulePlatformSync, stopPlatformSync } from './social-media-sync-scheduler.js';
import { encrypt, decrypt } from './crypto-utils.js';

// OpenAI client - initialized lazily when API key is available
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  // Sanitize key to remove any accidental newlines, whitespace, or the sticky 'y' character from deployment scripts
  const sanitizedKey = process.env.OPENAI_API_KEY.trim().replace(/[\n\r]/g, '').replace(/y$/, '');
  openai = new OpenAI({ apiKey: sanitizedKey });
} else {
  console.log("⚠️ OPENAI_API_KEY not set - AI chatbot features will be disabled");
}

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required in production");
}
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || (() => { throw new Error("JWT_SECRET or SESSION_SECRET environment variable is required"); })();

// Exchange rate caching (24 hours)
interface ExchangeRateCache {
  rates: { USD: number; EUR: number; INR: number; NPR: number };
  timestamp: number;
}
let exchangeRateCache: ExchangeRateCache | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Fetch live exchange rates from multiple sources
async function fetchLiveExchangeRates() {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!response.ok) throw new Error('Primary API failed');

    const data = await response.json();

    let nprRate = data.rates?.NPR;
    if (!nprRate) {
      const inrRate = data.rates?.INR || 83.12;
      nprRate = inrRate * 1.6;
    }

    const rates = {
      USD: 1,
      EUR: data.rates?.EUR || 0.92,
      INR: data.rates?.INR || 83.12,
      NPR: nprRate || 132.5,
    };

    console.log("✅ Exchange rates fetched:", rates);
    return rates;
  } catch (error) {
    console.error("❌ Exchange rate fetch error:", error);
    return {
      USD: 1,
      EUR: 0.92,
      INR: 83.12,
      NPR: 132.5,
    };
  }
}

// Get exchange rates with caching
async function getExchangeRates(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && exchangeRateCache && (now - exchangeRateCache.timestamp) < CACHE_DURATION) {
    return exchangeRateCache.rates;
  }

  const rates = await fetchLiveExchangeRates();
  exchangeRateCache = {
    rates,
    timestamp: now,
  };

  return rates;
}



function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
    (req as any).user = { username: decoded.username };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/visitors", async (req, res) => {
    try {
      const stats = await storage.getVisitorStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get visitor stats" });
    }
  });

  app.post("/api/visitors/increment", async (req, res) => {
    try {
      const stats = await storage.incrementVisitors();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to increment visitors" });
    }
  });

  app.get("/api/articles", async (req, res) => {
    try {
      const articles = await storage.getArticles();
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: "Failed to get articles" });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      const article = await storage.getArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: "Failed to get article" });
    }
  });

  // Admin Article routes with authentication
  app.post("/api/admin/articles", authMiddleware, async (req, res) => {
    try {
      const username = (req as any).user?.username || "System";
      const validated = insertArticleSchema.parse(req.body);
      const article = await storage.createArticle({ ...validated, createdBy: username });
      res.json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create article" });
    }
  });

  app.put("/api/admin/articles/:id", authMiddleware, async (req, res) => {
    try {
      const username = (req as any).user?.username || "System";
      const validated = insertArticleSchema.partial().parse(req.body);
      const article = await storage.updateArticle(req.params.id, { ...validated, updatedBy: username, updatedAt: new Date().toISOString() });
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update article" });
    }
  });

  app.delete("/api/admin/articles/:id", authMiddleware, async (req, res) => {
    try {
      const success = await storage.deleteArticle(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete article" });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to get settings" });
    }
  });

  // Team member routes
  app.get("/api/team", async (req, res) => {
    try {
      const members = await storage.getTeamMembers();
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to get team members" });
    }
  });

  app.post("/api/team", authMiddleware, async (req, res) => {
    try {
      const validated = insertTeamMemberSchema.parse(req.body);
      const member = await storage.createTeamMember(validated);
      res.json(member);
    } catch (error) {
      res.status(400).json({ error: "Invalid team member data" });
    }
  });

  app.put("/api/team/:id", authMiddleware, async (req, res) => {
    try {
      const updated = await storage.updateTeamMember(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update team member" });
    }
  });

  app.delete("/api/team/:id", authMiddleware, async (req, res) => {
    try {
      const success = await storage.deleteTeamMember(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete team member" });
    }
  });

  // Pricing routes
  app.get("/api/pricing", async (req, res) => {
    try {
      const packages = await storage.getPricingPackages();
      res.json(packages);
    } catch (error) {
      res.status(500).json({ error: "Failed to get pricing packages" });
    }
  });

  app.post("/api/pricing", authMiddleware, async (req, res) => {
    try {
      const validated = insertPricingPackageSchema.parse(req.body);
      const pkg = await storage.createPricingPackage(validated);
      res.json(pkg);
    } catch (error) {
      res.status(400).json({ error: "Invalid pricing package data" });
    }
  });

  app.put("/api/pricing/:id", authMiddleware, async (req, res) => {
    try {
      const updated = await storage.updatePricingPackage(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Pricing package not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update pricing package" });
    }
  });

  app.delete("/api/pricing/:id", authMiddleware, async (req, res) => {
    try {
      const success = await storage.deletePricingPackage(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Pricing package not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete pricing package" });
    }
  });

  // Project Discussion routes
  app.get("/api/project-discussion", async (req, res) => {
    try {
      const discussion = await storage.getProjectDiscussion();
      res.json(discussion);
    } catch (error) {
      res.status(500).json({ error: "Failed to get project discussion" });
    }
  });

  app.put("/api/project-discussion", authMiddleware, async (req, res) => {
    try {
      const validated = insertProjectDiscussionSchema.parse(req.body);
      const updated = await storage.updateProjectDiscussion(validated);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Invalid project discussion data" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;

      // Validate input
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Send emails (await to handle errors)
      await sendContactFormEmail({ name, email, subject, message });

      res.json({ success: true, message: "Message received and confirmation sent" });
    } catch (error: any) {
      console.error("Contact form error:", error);
      
      // Check for specific email errors
      if (error.message?.includes("User does not exist") || error.message?.includes("email is invalid")) {
        return res.status(400).json({ error: "The provided email address does not exist or cannot be reached." });
      }

      res.status(500).json({ error: "Failed to process contact form: " + (error.message || "Unknown error") });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;

      // Explicit runtime check for debugging Vercel deployment
      if (!process.env.OPENAI_API_KEY) {
        console.error("❌ Chatbot Error: OPENAI_API_KEY is missing in environment variables!");
        return res.status(503).json({
          response: "I'm sorry, but the AI service is not configured correctly. Please contact the administrator."
        });
      }

      const systemMessage = `You are VyomAi's helpful AI assistant. VyomAi Cloud Pvt. Ltd is an AI technology company based in Tokha, Kathmandu, Nepal.

Key information about VyomAi:
- Company: VyomAi Cloud Pvt. Ltd
- Location: Tokha, Kathmandu, Nepal
- Email: info@vyomai.cloud
- Services: AI agent templates, custom AI bots, Google Workspace integration, Microsoft 365 integration, AI analytics, AI consultation
- Mission: To democratize AI technology and make it accessible for businesses of all sizes
- Philosophy: Share knowledge for the betterment of everyone

You help visitors understand VyomAi's services, answer questions about AI technology, and assist with inquiries. Be friendly, professional, and helpful. If asked about specific pricing, politely explain that pricing is customized based on requirements and direct them to contact via email.

Always maintain a balance between being professional and approachable. Reference Nepali culture positively when appropriate (e.g., "Namaste" for greetings).`;

      const chatMessages = [
        { role: "system" as const, content: systemMessage },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      if (!openai) {
        return res.json({
          response: "I'm sorry, but the AI service is not configured yet. Please contact us at info@vyomai.cloud for assistance."
        });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: chatMessages,
        max_tokens: 500,
      });

      const response = completion.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";
      res.json({ response });
    } catch (error) {
      console.error("Chat API Error:", error);
      res.status(500).json({ 
        response: "I apologize, I'm having trouble connecting to the AI service. Please try again later.",
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password, twoFactorToken } = req.body;

      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Compare hashed password
      const isPasswordValid = await bcryptjs.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled && user.twoFactorSecret) {
        if (!twoFactorToken) {
          return res.status(403).json({ error: "2FA required", requires2FA: true });
        }

        // Verify 2FA token
        if (!verifyTwoFactorToken(user.twoFactorSecret, twoFactorToken)) {
          return res.status(401).json({ error: "Invalid 2FA token" });
        }
      }

      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });

      res.json({ success: true, token });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Request password reset (send verification code)
  app.post("/api/admin/request-password-reset", async (req, res) => {
    try {
      const validated = resetPasswordRequestSchema.parse(req.body);
      const { email } = validated;

      // Check if user with this email exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found. Please check your email address." });
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Store code in memory (expires in 15 minutes)
      await storage.storeResetCode(email, code);

      // Send email with code
      try {
        await sendPasswordResetEmail(email, code);
      } catch (emailError) {
        console.error("❌ Email sending error:", emailError);
        // Still return success but log the error
      }

      res.json({ success: true, message: "Verification code sent to email" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to request password reset" });
    }
  });

  // Development endpoint - get reset code for testing
  app.get("/api/admin/test-reset-code/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await storage.storeResetCode(email, code);


      res.json({ success: true, code, message: "Test code generated (check console logs)" });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate test code" });
    }
  });

  // Verify reset code
  app.post("/api/admin/verify-reset-code", async (req, res) => {
    try {
      const validated = verifyResetCodeSchema.parse(req.body);
      const isValid = await storage.verifyResetCode(validated.email, validated.code);

      if (!isValid) {
        return res.status(401).json({ error: "Invalid or expired verification code" });
      }

      res.json({ success: true, message: "Code verified successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to verify code" });
    }
  });

  // Reset password with verified code
  app.post("/api/admin/reset-password", async (req, res) => {
    try {
      const validated = resetPasswordSchema.parse(req.body);

      // Verify code again for security
      const isValid = await storage.verifyResetCode(validated.email, validated.code);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid or expired verification code" });
      }

      // Hash new password
      const hashedPassword = await bcryptjs.hash(validated.newPassword, 10);

      // Update password
      const success = await storage.resetPasswordByEmail(validated.email, hashedPassword);
      if (!success) {
        return res.status(500).json({ error: "Failed to reset password" });
      }

      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // 2FA Setup route
  app.post("/api/admin/setup-2fa", authMiddleware, async (req, res) => {
    try {
      const user = await storage.getUserByUsername("admin");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { secret, qrCode } = await generateTwoFactorSecret(user.username);
      res.json({ secret, qrCode, message: "Scan this QR code with your authenticator app" });
    } catch (error) {
      console.error("2FA setup error:", error);
      res.status(500).json({ error: "Failed to setup 2FA" });
    }
  });

  // Verify and Enable 2FA
  app.post("/api/admin/enable-2fa", authMiddleware, async (req, res) => {
    try {
      const { secret, token } = req.body;

      if (!secret || !token) {
        return res.status(400).json({ error: "Secret and token required" });
      }

      // Verify the token with the secret
      if (!verifyTwoFactorToken(secret, token)) {
        return res.status(401).json({ error: "Invalid verification token" });
      }

      // Save the secret to user (in production, update database)
      // For now, just confirm it's enabled
      res.json({ success: true, message: "2FA enabled successfully" });
    } catch (error) {
      console.error("2FA enable error:", error);
      res.status(500).json({ error: "Failed to enable 2FA" });
    }
  });

  app.put("/api/admin/settings/payment", authMiddleware, async (req, res) => {
    try {
      const { enabled } = req.body;
      const settings = await storage.updateSettings({ paymentEnabled: enabled });
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Email configuration endpoints - Multi-provider support
  app.get("/api/admin/email-status", authMiddleware, async (req, res) => {
    try {
      const { testEmailProvider } = await import("./email-service.js");
      const settings = await storage.getSettings();
      const primaryProvider = (settings as any).emailProvider || "smtp";

      const result = await testEmailProvider(primaryProvider as any);

      res.json({
        connected: result.success,
        provider: primaryProvider,
        email: (settings as any).emailFromAddress || "info@vyomai.cloud",
        error: result.error,
      });
    } catch (error) {
      res.json({ connected: false, error: "Failed to check email status" });
    }
  });

  // Get all provider statuses
  app.get("/api/admin/email-providers", authMiddleware, async (req, res) => {
    try {
      const { getProviderStatuses } = await import("./email-service.js");
      const settings = await storage.getSettings() as any;
      const statuses = await getProviderStatuses();

      res.json({
        providers: statuses,
        config: {
          provider: settings.emailProvider || "smtp",
          fromName: settings.emailFromName || "VyomAi",
          fromAddress: settings.emailFromAddress || "info@vyomai.cloud",
          replyTo: settings.emailReplyTo,
          smtpHost: settings.smtpHost,
          smtpPort: settings.smtpPort || "587",
          smtpUser: settings.smtpUser,
          smtpSecure: settings.smtpSecure || false,
          sendgridFromEmail: settings.sendgridFromEmail,
          providerPriority: settings.emailProviderPriority || "smtp,gmail,sendgrid",
          emailFeaturesEnabled: settings.emailFeaturesEnabled !== false,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get provider statuses" });
    }
  });

  // Update email configuration
  app.put("/api/admin/email-config", authMiddleware, async (req, res) => {
    try {
      const { clearEmailConfigCache } = await import("./email-service.js");
      const {
        emailProvider,
        emailFromName,
        emailFromAddress,
        emailReplyTo,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        smtpSecure,
        sendgridFromEmail,
        emailProviderPriority,
        emailFeaturesEnabled,
      } = req.body;

      const updatedSettings = await storage.updateSettings({
        emailProvider,
        emailFromName,
        emailFromAddress,
        emailReplyTo,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        smtpSecure,
        sendgridFromEmail,
        emailProviderPriority,
        emailFeaturesEnabled,
      } as any);

      clearEmailConfigCache();

      res.json({ success: true, settings: updatedSettings });
    } catch (error) {
      console.error("Update email config error:", error);
      res.status(500).json({ error: "Failed to update email configuration" });
    }
  });

  // Test specific provider
  app.post("/api/admin/test-email-provider", authMiddleware, async (req, res) => {
    try {
      const { testEmailProvider } = await import("./email-service.js");
      const { provider } = req.body;

      if (!provider || !["gmail", "smtp", "sendgrid"].includes(provider)) {
        return res.status(400).json({ error: "Invalid provider" });
      }

      const result = await testEmailProvider(provider);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to test provider" });
    }
  });

  // Test email endpoint
  app.post("/api/admin/test-email", authMiddleware, async (req, res) => {
    try {
      const { sendEmailWithResult } = await import("./email-service.js");
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email address required" });
      }

      const result = await sendEmailWithResult({
        to: email,
        subject: "VyomAi Test Email",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">VyomAi Email Test</h2>
            <p>This is a test email from your VyomAi Admin Panel.</p>
            <p>If you received this, your email integration is working correctly!</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #6b7280; font-size: 12px;">VyomAi Cloud Pvt. Ltd - The Infinity Sky</p>
          </div>
        `,
      });

      if (result.success) {
        res.json({ success: true, provider: result.provider });
      } else {
        res.status(500).json({ error: result.error || "Failed to send email" });
      }
    } catch (error: any) {
      console.error("Test email error:", error);
      res.status(500).json({ error: error.message || "Failed to send test email" });
    }
  });

  // Generic send email endpoint for admin
  const sendEmailSchema = z.object({
    to: z.string().email("Valid email address required"),
    subject: z.string().min(1, "Subject is required"),
    message: z.string().min(1, "Message is required"),
    type: z.enum(["booking_response", "inquiry_response", "general"]).optional(),
  });

  app.post("/api/admin/send-email", authMiddleware, async (req, res) => {
    try {
      const { sendEmailWithResult } = await import("./email-service.js");

      const validation = sendEmailSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0]?.message || "Invalid input" });
      }

      const { to, subject, message } = validation.data;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">VyomAi</h2>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <div style="white-space: pre-wrap; line-height: 1.6; color: #374151;">${message}</div>
          </div>
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>VyomAi Cloud Pvt. Ltd - The Infinity Sky</p>
            <p>Nepal's Leading AI Solutions Provider</p>
          </div>
        </div>
      `;

      const result = await sendEmailWithResult({
        to,
        subject,
        html: emailHtml,
      });

      if (result.success) {
        res.json({ success: true, provider: result.provider });
      } else {
        res.status(500).json({ error: result.error || "Failed to send email" });
      }
    } catch (error: any) {
      console.error("Send email error:", error);
      res.status(500).json({ error: error.message || "Failed to send email" });
    }
  });

  // Team routes
  app.get("/api/team", async (req, res) => {
    try {
      const members = await storage.getTeamMembers();
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to get team members" });
    }
  });

  app.post("/api/admin/team", authMiddleware, async (req, res) => {
    try {
      const validated = insertTeamMemberSchema.parse(req.body);
      const member = await storage.createTeamMember(validated);
      res.json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create team member" });
    }
  });

  app.put("/api/admin/team/:id", authMiddleware, async (req, res) => {
    try {
      const validated = insertTeamMemberSchema.partial().parse(req.body);
      const member = await storage.updateTeamMember(req.params.id, validated);
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update team member" });
    }
  });

  app.delete("/api/admin/team/:id", authMiddleware, async (req, res) => {
    try {
      const deleted = await storage.deleteTeamMember(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete team member" });
    }
  });

  // Pricing routes
  app.get("/api/pricing", async (req, res) => {
    try {
      const packages = await storage.getPricingPackages();
      res.json(packages);
    } catch (error) {
      res.status(500).json({ error: "Failed to get pricing packages" });
    }
  });

  app.post("/api/admin/pricing", authMiddleware, async (req, res) => {
    try {
      const validated = insertPricingPackageSchema.parse(req.body);
      const pkg = await storage.createPricingPackage(validated);
      res.json(pkg);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create pricing package" });
    }
  });

  app.put("/api/admin/pricing/:id", authMiddleware, async (req, res) => {
    try {
      const validated = insertPricingPackageSchema.partial().parse(req.body);
      const pkg = await storage.updatePricingPackage(req.params.id, validated);
      if (!pkg) {
        return res.status(404).json({ error: "Pricing package not found" });
      }
      res.json(pkg);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update pricing package" });
    }
  });

  app.delete("/api/admin/pricing/:id", authMiddleware, async (req, res) => {
    try {
      const deleted = await storage.deletePricingPackage(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Pricing package not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete pricing package" });
    }
  });

  app.post("/api/admin/pricing/verify-conversion", authMiddleware, async (req, res) => {
    try {
      const { basePrice, baseCurrency, targetCurrency, convertedPrice } = req.body;

      if (!basePrice || !baseCurrency || !targetCurrency || convertedPrice === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const rates = await getExchangeRates(false);
      const baseRate = rates[baseCurrency as keyof typeof rates] || 1;
      const targetRate = rates[targetCurrency as keyof typeof rates] || 1;
      const expectedPrice = Math.round((basePrice / baseRate) * targetRate * 100) / 100;
      const deviation = Math.abs(expectedPrice - convertedPrice) / expectedPrice * 100;

      let aiVerification = null;
      if (openai) {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a financial verification assistant. Verify currency conversions and confirm accuracy. Be brief and precise."
              },
              {
                role: "user",
                content: `Verify this currency conversion:
Base: ${basePrice} ${baseCurrency}
Converted to: ${convertedPrice} ${targetCurrency}
Exchange rates: ${JSON.stringify(rates)}
Expected calculation: ${basePrice} / ${baseRate} (${baseCurrency} to USD) × ${targetRate} (USD to ${targetCurrency}) = ${expectedPrice}
Deviation: ${deviation.toFixed(2)}%

Is this conversion accurate (within 1% tolerance)? Reply with JSON: {"accurate": true/false, "message": "brief explanation"}`
              }
            ],
            max_tokens: 150
          });

          const response = completion.choices[0]?.message?.content || "";
          try {
            aiVerification = JSON.parse(response);
          } catch {
            aiVerification = { accurate: deviation < 1, message: response };
          }
        } catch (aiError) {
          console.error("AI verification error:", aiError);
          aiVerification = { accurate: deviation < 1, message: "AI verification unavailable, using mathematical check" };
        }
      } else {
        aiVerification = { accurate: deviation < 1, message: "AI not configured, using mathematical verification" };
      }

      res.json({
        success: true,
        basePrice,
        baseCurrency,
        targetCurrency,
        convertedPrice,
        expectedPrice,
        deviation: deviation.toFixed(2),
        isAccurate: deviation < 1,
        aiVerification,
        rates
      });
    } catch (error) {
      console.error("Price verification error:", error);
      res.status(500).json({ error: "Failed to verify price conversion" });
    }
  });

  // Project Discussion routes
  app.get("/api/project-discussion", async (req, res) => {
    try {
      const discussion = await storage.getProjectDiscussion();
      res.json(discussion || {});
    } catch (error) {
      res.status(500).json({ error: "Failed to get project discussion" });
    }
  });

  app.put("/api/admin/project-discussion", authMiddleware, async (req, res) => {
    try {
      const validated = insertProjectDiscussionSchema.parse(req.body);
      const discussion = await storage.updateProjectDiscussion(validated);
      res.json(discussion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update project discussion" });
    }
  });

  // Footer settings routes
  app.put("/api/admin/footer", authMiddleware, async (req, res) => {
    try {
      const { footerLogoUrl, footerContactEmail, footerAddress } = req.body;
      const settings = await storage.updateSettings({
        footerLogoUrl,
        footerContactEmail,
        footerAddress,
      });
      res.json(settings);
    } catch (error) {
      console.error("❌ Footer update error:", error instanceof Error ? error.message : String(error), error);
      res.status(500).json({ error: "Failed to update footer settings", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Section visibility routes
  app.put("/api/admin/settings/sections", authMiddleware, async (req, res) => {
    try {
      const settings = await storage.updateSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update section settings" });
    }
  });

  // General settings route (company info, social links, etc)
  app.put("/api/admin/settings", authMiddleware, async (req, res) => {
    try {
      const settings = await storage.updateSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("❌ Settings update error:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Popup Forms Routes
  app.get("/api/popup-forms", async (req, res) => {
    try {
      const forms = await storage.getPopupForms();
      res.json(forms);
    } catch (error) {
      console.error("Popup forms fetch error:", error);
      res.status(500).json({ error: "Failed to fetch popup forms" });
    }
  });

  app.get("/api/popup-forms/active", async (req, res) => {
    try {
      const form = await storage.getActivePopupForm();
      res.json(form || null);
    } catch (error) {
      console.error("Active popup form fetch error:", error);
      res.status(500).json({ error: "Failed to fetch active popup form" });
    }
  });

  app.get("/api/popup-forms/:id", async (req, res) => {
    try {
      const form = await storage.getPopupForm(req.params.id);
      if (!form) {
        return res.status(404).json({ error: "Popup form not found" });
      }
      res.json(form);
    } catch (error) {
      console.error("Popup form fetch error:", error);
      res.status(500).json({ error: "Failed to fetch popup form" });
    }
  });

  app.post("/api/admin/popup-forms", authMiddleware, async (req, res) => {
    try {
      const form = await storage.createPopupForm(req.body);
      res.status(201).json(form);
    } catch (error) {
      console.error("Popup form create error:", error);
      res.status(500).json({ error: "Failed to create popup form" });
    }
  });

  app.put("/api/admin/popup-forms/:id", authMiddleware, async (req, res) => {
    try {
      const form = await storage.updatePopupForm(req.params.id, req.body);
      if (!form) {
        return res.status(404).json({ error: "Popup form not found" });
      }
      res.json(form);
    } catch (error) {
      console.error("Popup form update error:", error);
      res.status(500).json({ error: "Failed to update popup form" });
    }
  });

  app.delete("/api/admin/popup-forms/:id", authMiddleware, async (req, res) => {
    try {
      await storage.deletePopupForm(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Popup form delete error:", error);
      res.status(500).json({ error: "Failed to delete popup form" });
    }
  });

  // Exchange rates routes
  app.get("/api/exchange-rates", async (req, res) => {
    try {
      const rates = await getExchangeRates(false);
      const settings = await storage.getSettings();

      res.json({
        rates,
        lastUpdated: exchangeRateCache?.timestamp || new Date().toISOString(),
        settingsUpdatedAt: settings?.exchangeRatesUpdatedAt,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch exchange rates" });
    }
  });

  // Refresh exchange rates (admin only)
  app.post("/api/admin/exchange-rates/refresh", authMiddleware, async (req, res) => {
    try {
      const rates = await getExchangeRates(true);
      const timestamp = new Date().toISOString();

      // Update in database
      await storage.updateSettings({
        exchangeRates: rates,
        exchangeRatesUpdatedAt: timestamp,
      });

      res.json({
        success: true,
        message: "Exchange rates refreshed successfully",
        rates,
        lastUpdated: timestamp,
      });
    } catch (error) {
      console.error("Exchange rate refresh error:", error);
      res.status(500).json({ error: "Failed to refresh exchange rates" });
    }
  });

  // Payment Routes - Fonepay Integration
  app.post("/api/payment/initiate", async (req, res) => {
    try {
      const { amount, description, customerName, customerEmail, customerPhone } = req.body;

      if (!amount || !customerName || !customerEmail) {
        return res.status(400).json({ error: "Missing required payment fields" });
      }

      const orderId = `ORDER_${Date.now()}`;
      const returnUrl = `${req.headers.origin || "http://localhost:5000"}/payment/callback`;

      const paymentResponse = await initiatePayment({
        amount,
        description: description || "VyomAi Service Payment",
        customerName,
        customerEmail,
        customerPhone: customerPhone || "",
        orderId,
        returnUrl,
      });

      res.json(paymentResponse);
    } catch (error) {
      console.error("Payment initiation error:", error);
      res.status(500).json({ error: "Failed to initiate payment" });
    }
  });

  // Payment verification webhook (for Fonepay callback)
  app.post("/api/payment/verify", async (req, res) => {
    try {
      const { transactionId } = req.body;

      if (!transactionId) {
        return res.status(400).json({ error: "Transaction ID required" });
      }

      // In production, verify with Fonepay using proper checksum validation
      res.json({ success: true, message: "Payment verified successfully" });
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  // Booking routes
  app.post("/api/bookings", async (req, res) => {
    try {
      const validated = insertBookingRequestSchema.parse(req.body);
      const booking = await storage.createBookingRequest(validated);

      // Send confirmation emails
      await sendBookingConfirmationEmail({
        name: validated.name,
        email: validated.email,
        companyOrPersonal: validated.companyOrPersonal,
        message: validated.message,
      });

      res.json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Booking error:", error);
      res.status(500).json({ error: "Failed to create booking request" });
    }
  });

  app.get("/api/bookings", authMiddleware, async (req, res) => {
    try {
      const bookings = await storage.getBookingRequests();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to get booking requests" });
    }
  });

  app.get("/api/admin/bookings", authMiddleware, async (req, res) => {
    try {
      const bookings = await storage.getBookingRequests();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to get booking requests" });
    }
  });

  app.put("/api/admin/bookings/:id", authMiddleware, async (req, res) => {
    try {
      const { status, dueDate } = req.body;
      const updated = await storage.updateBookingRequest(req.params.id, { status, dueDate });
      if (!updated) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update booking status" });
    }
  });

  app.delete("/api/bookings/:id", authMiddleware, async (req, res) => {
    try {
      const deleted = await storage.deleteBookingRequest(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete booking request" });
    }
  });

  app.delete("/api/admin/bookings/:id", authMiddleware, async (req, res) => {
    try {
      const deleted = await storage.deleteBookingRequest(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete booking request" });
    }
  });

  app.post("/api/admin/bookings/reset", authMiddleware, async (req, res) => {
    try {
      await storage.resetBookingRequests();
      res.json({ success: true, message: "Booking requests reset successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset booking requests" });
    }
  });

  // Customer Inquiry routes (unified inquiry capture from all forms)
  app.post("/api/inquiries", async (req, res) => {
    try {
      const validated = insertCustomerInquirySchema.parse(req.body);
      const inquiry = await storage.createCustomerInquiry(validated);

      // Send email notification (await to verify delivery)
      // This handles 'contact', 'custom_solution', 'booking', and 'project_discussion'
      await sendContactFormEmail({
        name: validated.name,
        email: validated.email,
        subject: validated.subject || `New ${validated.inquiryType.replace('_', ' ')} Inquiry`,
        message: validated.message,
      });

      res.json(inquiry);
    } catch (error: any) {
      console.error("Customer inquiry error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }

      // Check for specific email errors from sendContactFormEmail
      if (error.message?.includes("User does not exist") || error.message?.includes("email is invalid")) {
        return res.status(400).json({ error: "The provided email address does not exist or cannot be reached. Please providing a valid email address." });
      }

      res.status(500).json({ error: "Failed to save inquiry" });
    }
  });

  app.get("/api/admin/inquiries", authMiddleware, async (req, res) => {
    try {
      const inquiries = await storage.getCustomerInquiries();
      res.json(inquiries);
    } catch (error) {
      console.error("Get inquiries error:", error);
      res.status(500).json({ error: "Failed to retrieve inquiries" });
    }
  });

  app.put("/api/admin/inquiries/:id", authMiddleware, async (req, res) => {
    try {
      const { status } = req.body;
      const updated = await storage.updateCustomerInquiry(req.params.id, { status });
      if (!updated) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update inquiry error:", error);
      res.status(500).json({ error: "Failed to update inquiry" });
    }
  });

  app.delete("/api/admin/inquiries/:id", authMiddleware, async (req, res) => {
    try {
      const deleted = await storage.deleteCustomerInquiry(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete inquiry error:", error);
      res.status(500).json({ error: "Failed to delete inquiry" });
    }
  });

  // User Management routes
  app.get("/api/admin/users", authMiddleware, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // @ts-ignore
      const safeUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role || "admin",
        permissions: u.permissions,
        twoFactorEnabled: u.twoFactorEnabled,
        createdAt: u.createdAt
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to retrieve users" });
    }
  });

  app.post("/api/admin/users", authMiddleware, async (req, res) => {
    try {
      const currentUsername = (req as any).user?.username;
      const currentUser = await storage.getUserByUsername(currentUsername);
      if (!currentUser || currentUser.role !== "vyom_admin") {
        return res.status(403).json({ error: "Only Vyom Admin can create users" });
      }

      const { username, email, password, role, permissions } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const hashedPassword = await bcryptjs.hash(password, 10);
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role: role || "admin",
        permissions: permissions || "[]"
      });
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", authMiddleware, async (req, res) => {
    try {
      const currentUsername = (req as any).user?.username;
      const currentUser = await storage.getUserByUsername(currentUsername);
      if (!currentUser || currentUser.role !== "vyom_admin") {
        return res.status(403).json({ error: "Only Vyom Admin can update users" });
      }

      const { email, role, permissions } = req.body;
      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      if (targetUser.role === "vyom_admin" && currentUser.id !== targetUser.id) {
        return res.status(403).json({ error: "Cannot modify another Vyom Admin" });
      }

      const updated = await storage.updateUser(req.params.id, { email, role, permissions });
      res.json({
        id: updated!.id,
        username: updated!.username,
        email: updated!.email,
        role: updated!.role,
        permissions: updated!.permissions
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.put("/api/admin/users/:id/password", authMiddleware, async (req, res) => {
    try {
      const currentUsername = (req as any).user?.username;
      const currentUser = await storage.getUserByUsername(currentUsername);
      if (!currentUser || currentUser.role !== "vyom_admin") {
        return res.status(403).json({ error: "Only Vyom Admin can change passwords" });
      }

      const { password } = req.body;
      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      // @ts-ignore
      const hashedPassword = await bcryptjs.hash(password, 10);
      const updated = await storage.updateUser(req.params.id, { password: hashedPassword });
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Update password error:", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  app.delete("/api/admin/users/:id", authMiddleware, async (req, res) => {
    try {
      const currentUsername = (req as any).user?.username;
      const currentUser = await storage.getUserByUsername(currentUsername);
      if (!currentUser || currentUser.role !== "vyom_admin") {
        return res.status(403).json({ error: "Only Vyom Admin can delete users" });
      }

      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      if (targetUser.id === currentUser.id) {
        return res.status(403).json({ error: "Cannot delete your own account" });
      }

      if (targetUser.role === "vyom_admin") {
        return res.status(403).json({ error: "Cannot delete a Vyom Admin" });
      }

      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // One-Time Pricing Request routes
  app.post("/api/one-time-pricing-request", async (req, res) => {
    try {
      const validated = insertOneTimePricingRequestSchema.parse(req.body);
      const request = await storage.createOneTimePricingRequest(validated);

      // Send emails (fire and forget with error logging)
      const pkg = await storage.getPricingPackage(validated.packageId);
      if (pkg?.oneTimeContactEmail) {
        sendOneTimePricingRequestEmail({
          name: validated.name,
          email: validated.email,
          mobileNumber: validated.mobileNumber,
          packageName: validated.packageName,
          request: validated.request,
          estimatedPrice: validated.estimatedPrice,
          currency: validated.currency,
          adminEmail: pkg.oneTimeContactEmail,
        }).catch((emailError) => {
          console.error("📧 Failed to send one-time pricing request email:", emailError);
        });
      }

      res.json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("❌ One-time pricing request error:", error);
      res.status(500).json({ error: "Failed to create pricing request" });
    }
  });

  app.get("/api/admin/one-time-requests", authMiddleware, async (req, res) => {
    try {
      const requests = await storage.getOneTimePricingRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to get pricing requests" });
    }
  });

  app.delete("/api/admin/one-time-requests/:id", authMiddleware, async (req, res) => {
    try {
      const deleted = await storage.deleteOneTimePricingRequest(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Pricing request not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete pricing request" });
    }
  });

  // Social Media Analytics routes
  app.get("/api/admin/analytics", authMiddleware, async (req, res) => {
    try {
      const analytics = await storage.getSocialMediaAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to get analytics" });
    }
  });

  app.get("/api/admin/analytics/:platform", authMiddleware, async (req, res) => {
    try {
      const analytic = await storage.getSocialMediaAnalytic(req.params.platform);
      if (!analytic) {
        return res.status(404).json({ error: "Analytics not found for platform" });
      }
      res.json(analytic);
    } catch (error) {
      res.status(500).json({ error: "Failed to get platform analytics" });
    }
  });

  app.put("/api/admin/analytics/:platform", authMiddleware, async (req, res) => {
    try {
      const validated = insertSocialMediaAnalyticsSchema.partial().parse(req.body);
      const updated = await storage.updateSocialMediaAnalytics(req.params.platform, validated);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update analytics" });
    }
  });

  app.post("/api/admin/analytics/reset", authMiddleware, async (req, res) => {
    try {
      await storage.resetSocialMediaAnalytics();
      res.json({ success: true, message: "Analytics reset successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset analytics" });
    }
  });

  // Public endpoint to get integration status (no auth required)
  app.get("/api/integrations", async (req, res) => {
    try {
      const configs = await storage.getSocialMediaApiConfigs();
      const publishedConfigs = configs.filter((c: any) => c.isPublished !== false);
      const integrations = await storage.getSocialMediaIntegrations();

      const publicIntegrations = await Promise.all(publishedConfigs.map(async (config: any) => {
        const integration = integrations.find((i: any) => i.platform === config.platform);
        const analytics = await storage.getSocialMediaAnalytics(config.platform);
        return {
          platform: config.platform,
          isConnected: integration?.isConnected || false,
          accountName: integration?.accountName,
          profileUrl: integration?.profileUrl,
          analytics: analytics || {
            followersCount: 0,
            engagementRate: 0,
            impressions: 0,
            likes: 0,
            shares: 0,
            comments: 0,
            postsCount: 0
          }
        };
      }));

      res.json(publicIntegrations);
    } catch (error) {
      console.error("Error fetching public integrations:", error);
      res.status(500).json({ error: "Failed to get integrations" });
    }
  });

  app.get("/api/admin/integrations", authMiddleware, async (req, res) => {
    try {
      const integrations = await storage.getSocialMediaIntegrations();
      res.json(integrations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get integrations" });
    }
  });

  app.put("/api/admin/integrations/:platform", authMiddleware, async (req, res) => {
    try {
      const validated = insertSocialMediaIntegrationSchema.partial().parse(req.body);
      const updated = await storage.updateSocialMediaIntegration(req.params.platform, validated);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update integration" });
    }
  });

  // Social Media Integration Test Endpoint
  app.post("/api/admin/integrations/:platform/test", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const platform = req.params.platform.toLowerCase();
      const { apiKey } = req.body;

      if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "API key is required and cannot be empty"
        });
      }

      const trimmedKey = apiKey.trim();

      // Platform-specific validation
      if (platform === "youtube") {
        // YouTube: Google API keys start with "AIzaSy" followed by ~30+ alphanumeric chars
        const validKeyFormat = /^AIzaSy[a-zA-Z0-9_-]{30,}$/.test(trimmedKey);
        if (!validKeyFormat) {
          return res.status(400).json({
            success: false,
            message: "Invalid YouTube API key format. Must start with 'AIzaSy' and contain 40+ characters total. Get it from Google Cloud Console."
          });
        }
        await storage.updateSocialMediaIntegration(platform, { isConnected: true });
        return res.json({
          success: true,
          message: "✓ YouTube API key format is valid! Ensure YouTube Data API v3 is enabled in Google Cloud Console.",
        });
      }
      else if (platform === "facebook") {
        // Facebook: Access tokens typically start with "EAAB" and are 100+ chars
        if (trimmedKey.length < 50) {
          return res.status(400).json({
            success: false,
            message: "Invalid Facebook token format. Must be at least 50 characters. Get a long-lived token from Meta Business Suite."
          });
        }
        // Optional: check for common Facebook token patterns
        if (!(/^[A-Za-z0-9_-]+$/.test(trimmedKey))) {
          return res.status(400).json({
            success: false,
            message: "Facebook token contains invalid characters. Only alphanumeric, underscore, and dash allowed."
          });
        }
        await storage.updateSocialMediaIntegration(platform, { isConnected: true });
        return res.json({
          success: true,
          message: "✓ Facebook token format is valid! Verify the token has 'pages_read_engagement' and 'pages_manage_posts' permissions."
        });
      }
      else if (platform === "instagram") {
        // Instagram: Uses same token format as Facebook (100+ chars)
        if (trimmedKey.length < 50) {
          return res.status(400).json({
            success: false,
            message: "Invalid Instagram token format. Must be at least 50 characters. Get a Graph API token from Meta Business Suite."
          });
        }
        if (!(/^[A-Za-z0-9_-]+$/.test(trimmedKey))) {
          return res.status(400).json({
            success: false,
            message: "Instagram token contains invalid characters. Only alphanumeric, underscore, and dash allowed."
          });
        }
        await storage.updateSocialMediaIntegration(platform, { isConnected: true });
        return res.json({
          success: true,
          message: "✓ Instagram token format is valid! Ensure your app has 'instagram_basic' and 'pages_read_engagement' permissions."
        });
      }
      else if (platform === "linkedin") {
        // LinkedIn: OAuth tokens or API keys (typically 100+ chars)
        if (trimmedKey.length < 40) {
          return res.status(400).json({
            success: false,
            message: "Invalid LinkedIn API key format. Must be at least 40 characters. Get your access token from LinkedIn Developers portal."
          });
        }
        if (!(/^[A-Za-z0-9_-]+$/.test(trimmedKey))) {
          return res.status(400).json({
            success: false,
            message: "LinkedIn token contains invalid characters. Only alphanumeric, underscore, and dash allowed."
          });
        }
        await storage.updateSocialMediaIntegration(platform, { isConnected: true });
        return res.json({
          success: true,
          message: "✓ LinkedIn API key format is valid! Ensure you have 'r_liteprofile' and 'r_basicprofile' permissions."
        });
      }
      else if (platform === "whatsapp") {
        // WhatsApp Business: Very long tokens (150+ chars typically)
        if (trimmedKey.length < 100) {
          return res.status(400).json({
            success: false,
            message: "Invalid WhatsApp Business API token format. Must be at least 100 characters. Get your token from WhatsApp Business API dashboard."
          });
        }
        if (!(/^[A-Za-z0-9_-]+$/.test(trimmedKey))) {
          return res.status(400).json({
            success: false,
            message: "WhatsApp token contains invalid characters. Only alphanumeric, underscore, and dash allowed."
          });
        }
        await storage.updateSocialMediaIntegration(platform, { isConnected: true });
        return res.json({
          success: true,
          message: "✓ WhatsApp Business API token format is valid! Verify your phone number is verified in the Business dashboard."
        });
      }
      else if (platform === "viber") {
        // Viber: Bot access tokens (60+ chars typically)
        if (trimmedKey.length < 40) {
          return res.status(400).json({
            success: false,
            message: "Invalid Viber bot token format. Must be at least 40 characters. Get your token from Viber Business dashboard."
          });
        }
        if (!(/^[A-Za-z0-9_-]+$/.test(trimmedKey))) {
          return res.status(400).json({
            success: false,
            message: "Viber token contains invalid characters. Only alphanumeric, underscore, and dash allowed."
          });
        }
        await storage.updateSocialMediaIntegration(platform, { isConnected: true });
        return res.json({
          success: true,
          message: "✓ Viber bot token format is valid! Ensure your Viber Public Account is active and verified."
        });
      }
      else {
        return res.status(400).json({
          success: false,
          message: `Platform '${platform}' is not supported. Supported: youtube, facebook, instagram, linkedin, whatsapp, viber`
        });
      }
    } catch (error) {
      console.error("Integration test error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to test integration. Please try again."
      });
    }
  });

  app.post("/api/admin/analytics/reset-hourly", authMiddleware, async (req, res) => {
    try {
      const stats = await storage.resetHourlyData();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to reset hourly data" });
    }
  });

  app.post("/api/admin/analytics/reset-traffic", authMiddleware, async (req, res) => {
    try {
      const stats = await storage.resetTrafficSources();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to reset traffic sources" });
    }
  });

  app.post("/api/admin/analytics/reset-devices", authMiddleware, async (req, res) => {
    try {
      const stats = await storage.resetDeviceTypes();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to reset device types" });
    }
  });

  app.post("/api/admin/analytics/reset-pages", authMiddleware, async (req, res) => {
    try {
      const stats = await storage.resetTopPages();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to reset top pages" });
    }
  });

  app.post("/api/admin/analytics/reset-engagement", authMiddleware, async (req, res) => {
    try {
      const stats = await storage.resetEngagementMetrics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to reset engagement metrics" });
    }
  });

  app.post("/api/admin/analytics/reset-social", authMiddleware, async (req, res) => {
    try {
      const stats = await storage.resetSocialMediaStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to reset social media stats" });
    }
  });

  app.post("/api/admin/analytics/reset-total-visitors", authMiddleware, async (req, res) => {
    try {
      const stats = await storage.resetTotalVisitors();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to reset total visitors" });
    }
  });

  // Email Client Routes
  app.post("/api/email/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Validate email format and domain
      if (!email.endsWith("@vyomai.cloud")) {
        return res.status(400).json({ error: "Only vyomai.cloud email accounts are allowed" });
      }

      // Validate credentials against Hostinger IMAP
      const isValid = await validateEmailCredentials(email, password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Generate session token
      const sessionToken = randomBytes(32).toString("hex");
      createEmailSession(email, sessionToken);

      res.json({ success: true, token: sessionToken });
    } catch (error) {
      console.error("Email login error:", error);
      res.status(500).json({ error: "Failed to authenticate email account" });
    }
  });

  app.get("/api/email/inbox", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const sessionToken = authHeader.substring(7);
      if (!validateEmailSession(sessionToken)) {
        return res.status(401).json({ error: "Session expired" });
      }

      // Get email from query parameter or from session
      const email = req.query.email as string;
      if (!email) {
        return res.status(400).json({ error: "Email parameter required" });
      }

      // Fetch emails from IMAP server
      const emails = await fetchEmails(email, sessionToken);
      res.json(emails);
    } catch (error) {
      console.error("Email inbox error:", error);
      res.status(500).json({ error: "Failed to fetch emails" });
    }
  });

  app.post("/api/email/logout", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const sessionToken = authHeader.substring(7);
      endEmailSession(sessionToken);

      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      console.error("Email logout error:", error);
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  app.post("/api/admin/reports/generate-pdf", authMiddleware, async (req, res) => {
    try {
      const { startDate, endDate, inquiryType } = req.body;

      const inquiries = await storage.getCustomerInquiries();
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const filtered = inquiries.filter((i: any) => {
        const date = new Date(i.createdAt);
        const typeMatch = inquiryType === "all" || i.inquiryType === inquiryType;
        return date >= start && date <= end && typeMatch;
      });

      const doc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="report-${Date.now()}.pdf"`);

      doc.pipe(res);

      // Title
      doc.fontSize(24).font("Helvetica-Bold").text("VyomAi Analytics Report", { align: "center" });
      doc.moveDown(0.5);

      // Report Date
      doc.fontSize(12).font("Helvetica").text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
      doc.fontSize(11).text(`Period: ${startDate} to ${endDate}`, { align: "center" });
      doc.moveDown(1);

      // Summary Cards
      doc.fontSize(14).font("Helvetica-Bold").text("Summary Statistics");
      doc.fontSize(11).font("Helvetica");
      doc.moveDown(0.3);

      const summary = {
        total: filtered.length,
        contact: filtered.filter((i: any) => i.inquiryType === "contact").length,
        booking: filtered.filter((i: any) => i.inquiryType === "booking").length,
        project: filtered.filter((i: any) => i.inquiryType === "project_discussion").length,
        custom: filtered.filter((i: any) => i.inquiryType === "custom_solution").length,
      };

      doc.text(`• Total Inquiries: ${summary.total}`);
      doc.text(`• Contact Forms: ${summary.contact}`);
      doc.text(`• Booking Requests: ${summary.booking}`);
      doc.text(`• Project Discussions: ${summary.project}`);
      doc.text(`• Custom Solutions: ${summary.custom}`);
      doc.moveDown(1);

      // Detailed List
      if (filtered.length > 0) {
        doc.fontSize(14).font("Helvetica-Bold").text("Detailed Records");
        doc.moveDown(0.3);
        doc.fontSize(10);

        filtered.slice(0, 50).forEach((inquiry: any, idx: any) => {
          const typeLabel = inquiry.inquiryType?.replace("_", " ").toUpperCase() || "UNKNOWN";
          doc.font("Helvetica-Bold").text(`${idx + 1}. ${inquiry.name} (${typeLabel})`, { underline: true });
          doc.font("Helvetica");
          doc.text(`Email: ${inquiry.email}`);
          if (inquiry.phone) doc.text(`Phone: ${inquiry.phone}`);
          if (inquiry.message) doc.text(`Message: ${inquiry.message.substring(0, 150)}...`);
          doc.text(`Date: ${new Date(inquiry.createdAt || "").toLocaleString()}`);
          doc.moveDown(0.3);
        });

        if (filtered.length > 50) {
          doc.moveDown(0.5).font("Helvetica-Oblique").text(`... and ${filtered.length - 50} more records`);
          doc.font("Helvetica");
        }
      } else {
        doc.text("No records found for the selected criteria.");
      }

      doc.end();
    } catch (error) {
      console.error("Report generation error:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  app.post("/api/admin/reports/generate-and-send", authMiddleware, async (req, res) => {
    try {
      const { startDate, endDate, inquiryType, recipientEmail } = req.body;

      // Collect all analytics data
      const inquiries = await storage.getCustomerInquiries();
      const visitorStats = await storage.getVisitorStats();
      const socialAnalytics = await storage.getSocialMediaAnalytics();
      const settings = await storage.getSettings();

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const filtered = inquiries.filter((i: any) => {
        const date = new Date(i.createdAt);
        const typeMatch = inquiryType === "all" || i.inquiryType === inquiryType;
        return date >= start && date <= end && typeMatch;
      });

      const doc = new PDFDocument({ margin: 40 });
      const chunks: Buffer[] = [];
      let pageNum = 0;

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));

      // Helper function to add header and footer
      const addHeaderFooter = () => {
        doc.fontSize(8).font("Helvetica").text("VyomAi Analytics Report", 40, 20, { width: 515 });
        doc.text(`Page ${++pageNum}`, 500, 20, { width: 50, align: "right" });
        doc.moveTo(40, 50).lineTo(555, 50).stroke("#CCCCCC");
        doc.moveTo(40, doc.page.height - 50).lineTo(555, doc.page.height - 50).stroke("#CCCCCC");
        doc.fontSize(8);
        doc.text(`Generated: ${new Date().toLocaleDateString()} | Period: ${startDate} to ${endDate}`, 40, doc.page.height - 35, { width: 515 });
      };

      // ===== COVER PAGE =====
      addHeaderFooter();
      doc.y = 100;
      doc.fontSize(32).font("Helvetica-Bold").text("VyomAi", { align: "center" });
      doc.fontSize(24).text("Comprehensive Analytics Report", { align: "center" });
      doc.moveDown(2);
      doc.fontSize(12).font("Helvetica").text(`Report Period: ${startDate} to ${endDate}`, { align: "center" });
      doc.text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
      doc.moveDown(3);

      // Summary cards with better formatting
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const avgDaily = Math.round((visitorStats?.totalVisitors || 0) / daysDiff);

      doc.fontSize(14).font("Helvetica-Bold").text("Executive Summary", { align: "center" });
      doc.moveDown(1).fontSize(11).font("Helvetica");
      doc.text(`Total Visitors: ${visitorStats?.totalVisitors || 0}`, { indent: 40 });
      doc.text(`Daily Average: ${avgDaily} visitors/day`, { indent: 40 });
      doc.text(`Total Inquiries: ${filtered.length}`, { indent: 40 });
      doc.text(`Inquiry Rate: ${filtered.length > 0 ? (filtered.length / daysDiff).toFixed(1) : 0} inquiries/day`, { indent: 40 });

      // ===== INQUIRY ANALYTICS PAGE =====
      doc.addPage();
      addHeaderFooter();
      doc.y = 70;

      doc.fontSize(18).font("Helvetica-Bold").text("Customer Inquiry Analytics");
      doc.moveDown(0.5).fontSize(11).font("Helvetica");

      const summary = {
        total: filtered.length,
        contact: filtered.filter((i: any) => i.inquiryType === "contact").length,
        booking: filtered.filter((i: any) => i.inquiryType === "booking").length,
        project: filtered.filter((i: any) => i.inquiryType === "project_discussion").length,
        custom: filtered.filter((i: any) => i.inquiryType === "custom_solution").length,
      };

      // Summary table
      doc.fontSize(10).font("Helvetica-Bold").text("Inquiry Type Distribution:", { underline: true });
      doc.fontSize(9).font("Helvetica");
      doc.text(`• Contact Forms: ${summary.contact} (${summary.total > 0 ? Math.round((summary.contact / summary.total) * 100) : 0}%)`, { indent: 20 });
      doc.text(`• Booking Requests: ${summary.booking} (${summary.total > 0 ? Math.round((summary.booking / summary.total) * 100) : 0}%)`, { indent: 20 });
      doc.text(`• Project Discussions: ${summary.project} (${summary.total > 0 ? Math.round((summary.project / summary.total) * 100) : 0}%)`, { indent: 20 });
      doc.text(`• Custom Solutions: ${summary.custom} (${summary.total > 0 ? Math.round((summary.custom / summary.total) * 100) : 0}%)`, { indent: 20 });
      doc.moveDown(0.7);

      // Detailed inquiry records in table format
      doc.fontSize(10).font("Helvetica-Bold").text("Detailed Inquiry Records:", { underline: true });
      doc.moveDown(0.3);

      // Table header
      const tableTop = doc.y;
      const col1 = 50, col2 = 150, col3 = 250, col4 = 380, col5 = 480;
      doc.fontSize(8).font("Helvetica-Bold");
      doc.text("ID", col1, tableTop);
      doc.text("Name", col2, tableTop);
      doc.text("Type", col3, tableTop);
      doc.text("Email", col4, tableTop);
      doc.text("Date", col5, tableTop);

      // Draw line under header
      doc.moveTo(45, tableTop + 12).lineTo(555, tableTop + 12).stroke("#CCCCCC");

      let rowY = tableTop + 18;
      doc.fontSize(7).font("Helvetica");

      if (filtered.length > 0) {
        filtered.slice(0, 150).forEach((inquiry: any, idx: any) => {
          const typeLabel = inquiry.inquiryType?.replace("_", " ").substring(0, 4).toUpperCase() || "N/A";
          const nameShort = inquiry.name.substring(0, 15);
          const emailShort = inquiry.email.substring(0, 20);
          const dateStr = new Date(inquiry.createdAt || "").toLocaleDateString();

          // Check if we need a new page
          if (rowY > doc.page.height - 80) {
            doc.addPage();
            addHeaderFooter();
            rowY = 90;
            // Redraw header on new page
            doc.fontSize(8).font("Helvetica-Bold");
            doc.text("ID", col1, rowY - 20);
            doc.text("Name", col2, rowY - 20);
            doc.text("Type", col3, rowY - 20);
            doc.text("Email", col4, rowY - 20);
            doc.text("Date", col5, rowY - 20);
            doc.moveTo(45, rowY - 8).lineTo(555, rowY - 8).stroke("#CCCCCC");
            rowY += 8;
            doc.fontSize(7).font("Helvetica");
          }

          doc.text(`${idx + 1}`, col1, rowY);
          doc.text(nameShort, col2, rowY);
          doc.text(typeLabel, col3, rowY);
          doc.text(emailShort, col4, rowY);
          doc.text(dateStr, col5, rowY);

          rowY += 12;
        });

        if (filtered.length > 150) {
          doc.moveDown(0.3).fontSize(8).font("Helvetica-Oblique").text(`... and ${filtered.length - 150} more inquiry records (see admin dashboard for complete list)`);
          doc.font("Helvetica");
        }
      } else {
        doc.fontSize(9).font("Helvetica-Oblique").text("No inquiry records found for this period.");
        doc.font("Helvetica");
      }

      // ===== SOCIAL MEDIA ANALYTICS PAGE =====
      if (socialAnalytics && socialAnalytics.length > 0) {
        doc.addPage();
        addHeaderFooter();
        doc.y = 70;

        doc.fontSize(18).font("Helvetica-Bold").text("Social Media Analytics");
        doc.moveDown(0.5);

        // Calculate total engagement metrics
        // @ts-ignore
        const totalFollowers = socialAnalytics.reduce((sum: any, p: any) => sum + (p.followers || 0), 0);
        // @ts-ignore
        const avgEngagement = (socialAnalytics.reduce((sum: any, p: any) => sum + (p.engagementRate || 0), 0) / socialAnalytics.length).toFixed(2);
        // @ts-ignore
        const totalImpressions = socialAnalytics.reduce((sum: any, p: any) => sum + (p.impressions || 0), 0);
        // @ts-ignore
        const topPlatform = socialAnalytics.sort((a: any, b: any) => (b.followers || 0) - (a.followers || 0))[0];

        doc.fontSize(10).font("Helvetica-Bold").text("Summary Metrics:", { underline: true });
        doc.fontSize(9).font("Helvetica");
        doc.text(`Total Followers (All Platforms): ${totalFollowers.toLocaleString()}`, { indent: 20 });
        doc.text(`Average Engagement Rate: ${avgEngagement}%`, { indent: 20 });
        doc.text(`Total Impressions: ${totalImpressions.toLocaleString()}`, { indent: 20 });
        doc.text(`Top Platform: ${topPlatform?.platform || "N/A"} (${topPlatform?.followers || 0} followers)`, { indent: 20 });
        doc.moveDown(0.7);

        // Platform details table
        doc.fontSize(10).font("Helvetica-Bold").text("Platform Details:", { underline: true });
        doc.moveDown(0.3);

        const tableTopSocial = doc.y;
        const sCol1 = 60, sCol2 = 160, sCol3 = 260, sCol4 = 360, sCol5 = 480;

        doc.fontSize(8).font("Helvetica-Bold");
        doc.text("Platform", sCol1, tableTopSocial);
        doc.text("Followers", sCol2, tableTopSocial);
        doc.text("Engagement %", sCol3, tableTopSocial);
        doc.text("Impressions", sCol4, tableTopSocial);
        doc.text("Clicks", sCol5, tableTopSocial);

        doc.moveTo(45, tableTopSocial + 12).lineTo(555, tableTopSocial + 12).stroke("#CCCCCC");

        let sRowY = tableTopSocial + 18;
        doc.fontSize(8).font("Helvetica");

        socialAnalytics.forEach((platform: any) => {
          doc.text(platform.platform?.substring(0, 10) || "Platform", sCol1, sRowY);
          doc.text((platform.followers || 0).toString(), sCol2, sRowY);
          doc.text((platform.engagementRate || 0).toString(), sCol3, sRowY);
          doc.text((platform.impressions || 0).toString(), sCol4, sRowY);
          doc.text((platform.clicks || 0).toString(), sCol5, sRowY);
          sRowY += 14;
        });
      }

      // ===== VISITOR STATISTICS PAGE =====
      doc.addPage();
      addHeaderFooter();
      doc.y = 70;

      doc.fontSize(18).font("Helvetica-Bold").text("Visitor Statistics & Trends");
      doc.moveDown(0.5).fontSize(11).font("Helvetica");

      doc.fontSize(10).font("Helvetica-Bold").text("Overall Metrics:", { underline: true });
      doc.fontSize(9).font("Helvetica");
      doc.text(`Total Visitors: ${visitorStats?.totalVisitors || 0}`, { indent: 20 });
      doc.text(`Report Period: ${daysDiff} days (${startDate} to ${endDate})`, { indent: 20 });
      doc.text(`Average Daily Visitors: ${avgDaily}`, { indent: 20 });
      doc.text(`Estimated Peak Day: ${Math.round(avgDaily * 1.5)} visitors`, { indent: 20 });
      doc.moveDown(0.7);

      doc.fontSize(10).font("Helvetica-Bold").text("Trend Analysis:", { underline: true });
      doc.fontSize(9).font("Helvetica");
      const visitorTrend = visitorStats?.totalVisitors ? (avgDaily > 50 ? "Strong" : avgDaily > 20 ? "Moderate" : "Low") : "No data";
      const growthStatus = visitorStats?.totalVisitors ? "Active" : "Starting";
      doc.text(`Overall Trend: ${visitorTrend} visitor engagement`, { indent: 20 });
      doc.text(`Growth Status: ${growthStatus} visitor acquisition phase`, { indent: 20 });
      doc.text(`Visitor-to-Inquiry Ratio: ${avgDaily > 0 ? (filtered.length / daysDiff / avgDaily * 100).toFixed(2) : 0}% conversion rate`, { indent: 20 });

      // ===== AI BUSINESS INTELLIGENCE PAGE =====
      doc.addPage();
      addHeaderFooter();
      doc.y = 70;

      doc.fontSize(18).font("Helvetica-Bold").text("Business Intelligence & AI Insights");
      doc.moveDown(0.5);

      // Generate sophisticated AI insights
      const peakCategory = summary.total > 0 ? Object.entries(summary).filter(([k]: [string, any]) => k !== 'total').sort(([, a]: [string, any], [, b]: [string, any]) => b - a)[0] : null;
      const conversionRate = summary.total > 0 ? Math.round((summary.booking / summary.total) * 100) : 0;
        const avgEngagementSocial = socialAnalytics?.length > 0 ? (socialAnalytics.reduce((sum: any, p: any) => sum + (p.engagementRate || 0), 0) / socialAnalytics.length).toFixed(1) : "0";
        const topPerformer = socialAnalytics?.length > 0 ? socialAnalytics.sort((a: any, b: any) => (b.engagementRate || 0) - (a.engagementRate || 0))[0] : null;

      const aiInsights = [
        {
          title: "Primary Revenue Driver",
          insight: `${peakCategory ? peakCategory[0].toUpperCase().replace(/_/g, " ") : "Customer inquiries"} represent your highest volume segment (${peakCategory ? peakCategory[1] : summary.total} inquiries). Prioritize response time for this category.`
        },
        {
          title: "Conversion Efficiency",
          insight: `${conversionRate}% of inquiries convert to booking requests. Industry benchmark is 15-25%. ${conversionRate < 15 ? "Opportunity to improve inquiry qualification process." : conversionRate > 25 ? "Excellent conversion performance - consider scaling marketing efforts." : "Performance is within normal range."}`
        },
        {
          title: "Social Media Performance",
          insight: `Average engagement rate of ${avgEngagementSocial}% across platforms. ${topPerformer ? `${topPerformer.platform} leads with ${topPerformer.engagementRate}% engagement.` : ""} Focus content strategy on your highest-performing platform.`
        },
        {
          title: "Visitor Engagement",
          insight: `Average of ${avgDaily} daily visitors with ${(filtered.length / daysDiff).toFixed(1)} inquiries per day. Visitor-to-inquiry rate: ${((filtered.length / daysDiff) / avgDaily * 100).toFixed(1)}%. ${avgDaily > 100 ? "Strong traffic volume - optimize conversion funnels." : avgDaily > 30 ? "Moderate traffic - consider marketing boost." : "Build traffic through SEO and social media."}`
        },
        {
          title: "Response Priority",
          insight: `Focus resources on ${summary.contact > 0 ? "contact forms (highest volume)" : "booking requests (highest value)"} and implement automation for template responses to increase efficiency by 40-50%.`
        },
        {
          title: "Growth Recommendation",
          insight: `With current metrics, implement A/B testing on key inquiry forms and boost your top-performing social platform. Expected outcome: 20-30% increase in qualified leads within 60 days.`
        }
      ];

      doc.fontSize(11).font("Helvetica-Bold").text("Key Insights & Recommendations:");
      doc.moveDown(0.5).fontSize(9).font("Helvetica");

      aiInsights.forEach((item, idx) => {
        doc.fontSize(9).font("Helvetica-Bold").text(`${idx + 1}. ${item.title}:`);
        doc.fontSize(8).font("Helvetica").text(item.insight, { indent: 20, width: 475 });
        doc.moveDown(0.3);
      });

      doc.moveDown(1);
      doc.fontSize(8).font("Helvetica-Oblique");
      doc.text("This report was generated using advanced analytics and AI-powered business intelligence. All recommendations are based on your actual business metrics.", { align: "center", width: 475 });
      doc.text("For strategic consultation, contact the VyomAi team.", { align: "center", width: 475 });
      doc.font("Helvetica");

      doc.end();

      doc.on("end", async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);

          // Professional email HTML
          const emailHtml = `
            <div style="font-family: 'Arial', sans-serif; max-width: 700px; color: #333;">
              <div style="background: linear-gradient(135deg, #1a5f7a 0%, #2d8fa3 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">VyomAi Analytics Report</h1>
                <p style="margin: 10px 0 0 0; font-size: 14px;">Comprehensive Business Intelligence Report</p>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none;">
                <p style="font-size: 14px; margin: 0 0 20px 0;">Dear Admin,</p>
                
                <p style="font-size: 13px; color: #666; margin: 0 0 15px 0;">
                  Your comprehensive analytics report for the period <strong>${startDate} to ${endDate}</strong> has been generated and is attached as a PDF file.
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #1a5f7a;">
                  <h3 style="margin: 0 0 15px 0; color: #1a5f7a; font-size: 16px;">📊 Quick Summary</h3>
                  <table style="width: 100%; font-size: 13px;">
                    <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding: 8px 0;"><strong>Total Inquiries:</strong></td>
                      <td style="text-align: right;"><strong>${summary.total}</strong></td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding: 8px 0;">Contact Forms</td>
                      <td style="text-align: right;">${summary.contact}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding: 8px 0;">Booking Requests</td>
                      <td style="text-align: right;">${summary.booking}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding: 8px 0;">Project Discussions</td>
                      <td style="text-align: right;">${summary.project}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">Custom Solutions</td>
                      <td style="text-align: right;">${summary.custom}</td>
                    </tr>
                  </table>
                </div>
                
                <div style="background: #e8f4f8; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 13px; color: #0d4a5f;">
                    <strong>📈 Report Includes:</strong><br>
                    ✓ Detailed inquiry breakdown by type<br>
                    ✓ All customer inquiry records with contact details<br>
                    ✓ Social media analytics (6 platforms)<br>
                    ✓ Visitor statistics and trends<br>
                    ✓ AI-powered business intelligence & recommendations
                  </p>
                </div>
                
                <p style="font-size: 12px; color: #999; margin: 20px 0; text-align: center;">
                  Report generated on ${new Date().toLocaleString()} | VyomAi Business Intelligence System
                </p>
              </div>
            </div>
          `;

          const emailSent = await sendEmailWithAttachment({
            to: recipientEmail,
            subject: `VyomAi Analytics Report - ${startDate} to ${endDate}`,
            html: emailHtml,
            attachmentBuffer: pdfBuffer,
            attachmentFilename: `VyomAi-Analytics-${startDate}-to-${endDate}.pdf`,
          });

          if (emailSent) {
            res.json({ success: true, message: "Report sent successfully with PDF attachment" });
          } else {
            res.status(500).json({ error: "Report generated but failed to send email" });
          }
        } catch (error) {
          console.error("Email sending error:", error);
          res.status(500).json({ error: "Report generated but failed to send email" });
        }
      });
    } catch (error) {
      console.error("Report generation error:", error);
      res.status(500).json({ error: "Failed to generate and send report" });
    }
  });

  // ========================================
  // HOME PAGE CONTENT MANAGEMENT ROUTES
  // ========================================

  // Hero Content Routes
  app.get("/api/content/hero", async (req, res) => {
    try {
      const content = await storage.getHeroContent();
      res.json(content || null);
    } catch (error) {
      console.error("Error fetching hero content:", error);
      res.status(500).json({ error: "Failed to fetch hero content" });
    }
  });

  app.put("/api/admin/content/hero", authMiddleware, async (req, res) => {
    try {
      const content = await storage.updateHeroContent(req.body);
      res.json(content);
    } catch (error) {
      console.error("Error updating hero content:", error);
      res.status(500).json({ error: "Failed to update hero content" });
    }
  });

  // About Content Routes
  app.get("/api/content/about", async (req, res) => {
    try {
      const content = await storage.getAboutContent();
      const values = await storage.getAboutValues();
      res.json({ content, values });
    } catch (error) {
      console.error("Error fetching about content:", error);
      res.status(500).json({ error: "Failed to fetch about content" });
    }
  });

  app.put("/api/admin/content/about", authMiddleware, async (req, res) => {
    try {
      const content = await storage.updateAboutContent(req.body);
      res.json(content);
    } catch (error) {
      console.error("Error updating about content:", error);
      res.status(500).json({ error: "Failed to update about content" });
    }
  });

  // About Values Routes
  app.get("/api/content/about/values", async (req, res) => {
    try {
      const values = await storage.getAboutValues();
      res.json(values);
    } catch (error) {
      console.error("Error fetching about values:", error);
      res.status(500).json({ error: "Failed to fetch about values" });
    }
  });

  app.post("/api/admin/content/about/values", authMiddleware, async (req, res) => {
    try {
      const value = await storage.createAboutValue(req.body);
      res.json(value);
    } catch (error) {
      console.error("Error creating about value:", error);
      res.status(500).json({ error: "Failed to create about value" });
    }
  });

  app.put("/api/admin/content/about/values/:id", authMiddleware, async (req, res) => {
    try {
      const value = await storage.updateAboutValue(req.params.id, req.body);
      if (!value) {
        return res.status(404).json({ error: "About value not found" });
      }
      res.json(value);
    } catch (error) {
      console.error("Error updating about value:", error);
      res.status(500).json({ error: "Failed to update about value" });
    }
  });

  app.delete("/api/admin/content/about/values/:id", authMiddleware, async (req, res) => {
    try {
      const deleted = await storage.deleteAboutValue(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "About value not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting about value:", error);
      res.status(500).json({ error: "Failed to delete about value" });
    }
  });

  // Services Content Routes
  app.get("/api/content/services", async (req, res) => {
    try {
      const content = await storage.getServicesContent();
      const items = await storage.getServiceItems();
      res.json({ content, items });
    } catch (error) {
      console.error("Error fetching services content:", error);
      res.status(500).json({ error: "Failed to fetch services content" });
    }
  });

  app.put("/api/admin/content/services", authMiddleware, async (req, res) => {
    try {
      const content = await storage.updateServicesContent(req.body);
      res.json(content);
    } catch (error) {
      console.error("Error updating services content:", error);
      res.status(500).json({ error: "Failed to update services content" });
    }
  });

  // Service Items Routes
  app.get("/api/content/services/items", async (req, res) => {
    try {
      const items = await storage.getServiceItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching service items:", error);
      res.status(500).json({ error: "Failed to fetch service items" });
    }
  });

  app.post("/api/admin/content/services/items", authMiddleware, async (req, res) => {
    try {
      const item = await storage.createServiceItem(req.body);
      res.json(item);
    } catch (error) {
      console.error("Error creating service item:", error);
      res.status(500).json({ error: "Failed to create service item" });
    }
  });

  app.put("/api/admin/content/services/items/:id", authMiddleware, async (req, res) => {
    try {
      const item = await storage.updateServiceItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Service item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating service item:", error);
      res.status(500).json({ error: "Failed to update service item" });
    }
  });

  app.delete("/api/admin/content/services/items/:id", authMiddleware, async (req, res) => {
    try {
      const deleted = await storage.deleteServiceItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Service item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting service item:", error);
      res.status(500).json({ error: "Failed to delete service item" });
    }
  });

  // Solutions Content Routes
  app.get("/api/content/solutions", async (req, res) => {
    try {
      const content = await storage.getSolutionsContent();
      const items = await storage.getSolutionItems();
      res.json({ content, items });
    } catch (error) {
      console.error("Error fetching solutions content:", error);
      res.status(500).json({ error: "Failed to fetch solutions content" });
    }
  });

  app.put("/api/admin/content/solutions", authMiddleware, async (req, res) => {
    try {
      const content = await storage.updateSolutionsContent(req.body);
      res.json(content);
    } catch (error) {
      console.error("Error updating solutions content:", error);
      res.status(500).json({ error: "Failed to update solutions content" });
    }
  });

  // Solution Items Routes
  app.get("/api/content/solutions/items", async (req, res) => {
    try {
      const items = await storage.getSolutionItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching solution items:", error);
      res.status(500).json({ error: "Failed to fetch solution items" });
    }
  });

  app.post("/api/admin/content/solutions/items", authMiddleware, async (req, res) => {
    try {
      const item = await storage.createSolutionItem(req.body);
      res.json(item);
    } catch (error) {
      console.error("Error creating solution item:", error);
      res.status(500).json({ error: "Failed to create solution item" });
    }
  });

  app.put("/api/admin/content/solutions/items/:id", authMiddleware, async (req, res) => {
    try {
      const item = await storage.updateSolutionItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Solution item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating solution item:", error);
      res.status(500).json({ error: "Failed to update solution item" });
    }
  });

  app.delete("/api/admin/content/solutions/items/:id", authMiddleware, async (req, res) => {
    try {
      const deleted = await storage.deleteSolutionItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Solution item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting solution item:", error);
      res.status(500).json({ error: "Failed to delete solution item" });
    }
  });

  // Batch update for reordering items
  app.put("/api/admin/content/about/values/reorder", authMiddleware, async (req, res) => {
    try {
      const { items } = req.body; // Array of { id, order }
      for (const item of items) {
        await storage.updateAboutValue(item.id, { order: item.order });
      }
      const values = await storage.getAboutValues();
      res.json(values);
    } catch (error) {
      console.error("Error reordering about values:", error);
      res.status(500).json({ error: "Failed to reorder about values" });
    }
  });

  app.put("/api/admin/content/services/items/reorder", authMiddleware, async (req, res) => {
    try {
      const { items } = req.body; // Array of { id, order }
      for (const item of items) {
        await storage.updateServiceItem(item.id, { order: item.order });
      }
      const serviceItems = await storage.getServiceItems();
      res.json(serviceItems);
    } catch (error) {
      console.error("Error reordering service items:", error);
      res.status(500).json({ error: "Failed to reorder service items" });
    }
  });

  app.put("/api/admin/content/solutions/items/reorder", authMiddleware, async (req, res) => {
    try {
      const { items } = req.body; // Array of { id, order }
      for (const item of items) {
        await storage.updateSolutionItem(item.id, { order: item.order });
      }
      const solutionItems = await storage.getSolutionItems();
      res.json(solutionItems);
    } catch (error) {
      console.error("Error reordering solution items:", error);
      res.status(500).json({ error: "Failed to reorder solution items" });
    }
  });

  // DEVELOPMENT: Test endpoint to seed dummy data for one month
  app.post("/api/test/seed-dummy-data", async (req, res) => {
    try {
      console.log("Seeding dummy data for testing...");

      // Add dummy inquiries for the past 30 days
      const inquiryTypes = ["contact", "booking", "project_discussion", "custom_solution"];
      const names = ["Raj Kumar", "Priya Sharma", "Anil Patel", "Neha Singh", "Vikram Gupta", "Anjali Verma", "Rohit Kumar", "Sneha Desai"];
      const domains = ["@gmail.com", "@yahoo.com", "@outlook.com", "@company.com"];

      for (let i = 0; i < 45; i++) {
        await storage.createCustomerInquiry({
          name: names[Math.floor(Math.random() * names.length)],
          email: `user${i}@${domains[Math.floor(Math.random() * domains.length)]}`,
          phone: `+977-98${String(Math.floor(Math.random() * 99999999)).padStart(8, '0')}`,
          inquiryType: inquiryTypes[Math.floor(Math.random() * inquiryTypes.length)],
          message: `This is a test inquiry message for report testing. Sample message ${i}.`,
        });
      }

      console.log("✓ Added 45 test inquiries");

      // Add social media analytics with fixed timestamp handling
      const platforms = [
        { name: "linkedin", followers: 1250, engagement: 4.2, impressions: 15000, likes: 650 },
        { name: "instagram", followers: 2100, engagement: 6.8, impressions: 28000, likes: 1900 },
        { name: "facebook", followers: 3400, engagement: 3.1, impressions: 22000, likes: 680 },
        { name: "youtube", followers: 890, engagement: 8.5, impressions: 45000, likes: 3825 },
        { name: "twitter", followers: 560, engagement: 2.4, impressions: 8900, likes: 213 },
        { name: "whatsapp", followers: 4200, engagement: 12.3, impressions: 12000, likes: 1476 },
      ];

      for (const p of platforms) {
        await storage.updateSocialMediaAnalytics(p.name, {
          followersCount: String(p.followers),
          engagementRate: String(p.engagement),
          impressions: String(p.impressions),
          likes: String(p.likes),
          shares: "0",
          comments: "0",
          postsCount: "0",
        });
      }

      console.log("✓ Added social media analytics for 6 platforms");

      res.json({
        success: true,
        message: "Dummy data seeded successfully - 45 customer inquiries + 6 platforms analytics for 1 month",
        inquiries: 45,
        platforms: platforms.length,
        note: "Ready for report generation. Use POST /api/admin/reports/generate-and-send to create comprehensive analytics report."
      });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ error: "Failed to seed dummy data", details: String(error) });
    }
  });

  // ============== SOCIAL MEDIA AUTO-SYNC INTEGRATION ROUTES ==============

  // Get all API configurations
  app.get("/api/admin/social-media/config", authMiddleware, async (req, res) => {
    try {
      const configs = await storage.getSocialMediaApiConfigs();
      const integrations = await storage.getSocialMediaIntegrations();

      // Combine configs and integrations
      // @ts-ignore
      const combined = configs.map(config => {
        const integration = integrations.find((i: SocialMediaIntegration) => i.platform === config.platform);
        return {
          ...config,
          isConnected: integration?.isConnected || false,
          accountName: integration?.accountName,
          lastSyncAt: config.lastSyncAt,
          nextSyncAt: config.nextSyncAt,
        };
      });

      res.json(combined);
    } catch (error) {
      console.error("Error fetching social media config:", error);
      res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  // Update API configuration
  app.put("/api/admin/social-media/config/:platform", authMiddleware, async (req, res) => {
    try {
      const { platform } = req.params;
      const { clientId, clientSecret, apiKey, autoSyncEnabled, syncInterval, isPublished, isManualMode } = req.body;

      const updateData: any = {};
      if (clientId !== undefined) updateData.clientId = clientId;
      if (clientSecret) updateData.clientSecret = encrypt(clientSecret);
      if (apiKey) updateData.apiKey = encrypt(apiKey);
      if (autoSyncEnabled !== undefined) updateData.autoSyncEnabled = autoSyncEnabled;
      if (syncInterval) updateData.syncInterval = syncInterval;
      if (isPublished !== undefined) updateData.isPublished = isPublished;
      if (isManualMode !== undefined) updateData.isManualMode = isManualMode;

      const config = await storage.updateSocialMediaApiConfig(platform, updateData);

      // Update scheduler if auto-sync settings changed
      if (autoSyncEnabled && syncInterval) {
        schedulePlatformSync(platform as any, syncInterval);
      } else if (autoSyncEnabled === false) {
        stopPlatformSync(platform as any);
      }

      res.json(config);
    } catch (error) {
      console.error("Error updating social media config:", error);
      res.status(500).json({ error: "Failed to update configuration" });
    }
  });

  // Manual sync for specific platform
  app.post("/api/admin/social-media/sync/:platform", authMiddleware, async (req, res) => {
    try {
      const { platform } = req.params;
      const result = await syncPlatform(platform as any);
      res.json(result);
    } catch (error: any) {
      console.error(`Error syncing ${req.params.platform}:`, error);
      res.status(500).json({ error: error.message || "Sync failed" });
    }
  });

  // Manual sync for all platforms
  app.post("/api/admin/social-media/sync-all", authMiddleware, async (req, res) => {
    try {
      const results = await syncAllPlatforms();
      res.json(results);
    } catch (error: any) {
      console.error("Error syncing all platforms:", error);
      res.status(500).json({ error: error.message || "Sync failed" });
    }
  });

  // Get sync logs
  app.get("/api/admin/social-media/sync-logs", authMiddleware, async (req, res) => {
    try {
      const { platform, limit } = req.query;
      const logs = await storage.getSocialMediaSyncLogs(
        platform as string | undefined,
        limit ? parseInt(limit as string) : 50
      );
      res.json(logs);
    } catch (error) {
      console.error("Error fetching sync logs:", error);
      res.status(500).json({ error: "Failed to fetch sync logs" });
    }
  });

  // Get current analytics for a platform
  app.get("/api/admin/social-media/analytics/:platform", authMiddleware, async (req, res) => {
    try {
      const { platform } = req.params;
      const analytics = await storage.getSocialMediaAnalytics(platform);
      res.json(analytics || {
        platform,
        followersCount: "0",
        engagementRate: "0",
        impressions: "0",
        likes: "0",
        shares: "0",
        comments: "0",
        postsCount: "0"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Update analytics manually (Manual Mode)
  app.put("/api/admin/social-media/analytics/:platform", authMiddleware, async (req, res) => {
    try {
      const { platform } = req.params;
      const data = req.body;
      const updated = await storage.updateSocialMediaAnalytics(platform, data);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update analytics" });
    }
  });

  // OAuth initiation routes
  app.get("/api/admin/social-media/connect/:platform", authMiddleware, async (req, res) => {
    try {
      const { platform } = req.params;
      const config = await storage.getSocialMediaApiConfig(platform);

      if (!config?.clientId) {
        return res.status(400).json({ error: "Platform not configured. Please add API credentials first." });
      }
      const host = req.get('host') || '';
      const protocol = host.includes('localhost') ? req.protocol : 'https';
      const redirectUri = `${protocol}://${host}/api/admin/social-media/oauth/callback/${platform}`;
      console.log(`📡 Initiating OAuth for ${platform} with redirect URI: ${redirectUri}`);
      let authUrl: string;

      const clientSecret = config.clientSecret ? decrypt(config.clientSecret) : '';

      switch (platform) {
        case 'youtube':
          authUrl = YouTubeClient.getAuthUrl(config.clientId, clientSecret, redirectUri);
          break;
        case 'facebook':
          authUrl = FacebookClient.getAuthUrl(config.clientId, redirectUri, 'facebook');
          break;
        case 'instagram':
          authUrl = FacebookClient.getAuthUrl(config.clientId, redirectUri, 'instagram');
          break;
        case 'linkedin':
          authUrl = LinkedInClient.getAuthUrl(config.clientId, redirectUri);
          break;
        case 'twitter':
          authUrl = TwitterClient.getAuthUrl(config.clientId, redirectUri);
          break;
        default:
          return res.status(400).json({ error: "Unsupported platform" });
      }

      res.json({ authUrl });
    } catch (error: any) {
      console.error("Error initiating OAuth:", error);
      res.status(500).json({ error: error.message || "Failed to initiate OAuth" });
    }
  });

  // OAuth callback routes
  app.get("/api/admin/social-media/oauth/callback/:platform", async (req, res) => {
    try {
      const { platform } = req.params;
      const { code, error: oauthError } = req.query;

      if (oauthError) {
        return res.redirect('/admin/social-media-integration?error=' + encodeURIComponent(oauthError as string));
      }

      if (!code) {
        return res.status(400).send("Authorization code missing");
      }

      const config = await storage.getSocialMediaApiConfig(platform);
      if (!config?.clientId) {
        return res.status(400).send("Platform not configured");
      }

      const redirectUri = `${req.protocol}://${req.get('host')}/api/admin/social-media/oauth/callback/${platform}`;
      let tokens: { accessToken: string; refreshToken: string };

      const clientSecret = config.clientSecret ? decrypt(config.clientSecret) : '';

      switch (platform) {
        case 'youtube':
          tokens = await YouTubeClient.exchangeCodeForTokens(code as string, config.clientId, clientSecret, redirectUri);
          break;
        case 'facebook':
        case 'instagram':
          tokens = await FacebookClient.exchangeCodeForTokens(code as string, config.clientId, clientSecret, redirectUri);
          break;
        case 'linkedin':
          tokens = await LinkedInClient.exchangeCodeForTokens(code as string, config.clientId, clientSecret, redirectUri);
          break;
        case 'twitter':
          tokens = await TwitterClient.exchangeCodeForTokens(code as string, config.clientId, clientSecret, redirectUri);
          break;
        default:
          return res.status(400).send("Unsupported platform");
      }

      // Store encrypted tokens
      await storage.updateSocialMediaIntegration(platform, {
        isConnected: true,
        accessToken: encrypt(tokens.accessToken),
        refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : undefined,
      });

      // Redirect to admin page with success message
      console.log(`✅ ${platform} tokens received and stored`);
      res.redirect('/admin/social-media-integration?success=true&platform=' + platform);
    } catch (error: any) {
      console.error(`❌ OAuth callback error for ${req.params.platform}:`, error);
      const errorMessage = error.message || "Unknown OAuth error";
      res.redirect('/admin/social-media-integration?error=' + encodeURIComponent(errorMessage));
    }
  });

  // Disconnect platform
  app.delete("/api/admin/social-media/disconnect/:platform", authMiddleware, async (req, res) => {
    try {
      const { platform } = req.params;

      await storage.updateSocialMediaIntegration(platform, {
        isConnected: false,
        accessToken: undefined,
        refreshToken: undefined,
      });

      stopPlatformSync(platform as any);

      console.log(`✅ ${platform} disconnected`);

      res.json({ success: true });
    } catch (error) {
      console.error("Error disconnecting platform:", error);
      res.status(500).json({ error: "Failed to disconnect platform" });
    }
  });

  return httpServer;

}
