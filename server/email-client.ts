import { simpleParser } from "mailparser";

// IMAP connection interface
interface IMAPConnection {
  email: string;
  password: string;
}

interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
}

// Cache for email sessions (in production, use Redis)
const emailSessions = new Map<
  string,
  { email: string; lastAccess: number }
>();

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export async function validateEmailCredentials(
  email: string,
  password: string
): Promise<boolean> {
  try {
    if (!email.endsWith("@vyomai.cloud")) {
      return false;
    }

    if (process.env.NODE_ENV === "production") {
      console.error("❌ Email credential validation: IMAP module not installed. Install 'imap' package to enable.");
      return false;
    }

    console.warn("⚠️ Email credential validation is a stub in development mode");
    return true;
  } catch (error) {
    console.error("Email validation failed:", error);
    return false;
  }
}

export async function fetchEmails(
  email: string,
  sessionToken: string
): Promise<EmailMessage[]> {
  try {
    // Verify session is still valid
    const session = emailSessions.get(sessionToken);
    if (!session || Date.now() - session.lastAccess > SESSION_TIMEOUT) {
      throw new Error("Session expired");
    }

    // Update last access time
    emailSessions.set(sessionToken, {
      ...session,
      lastAccess: Date.now(),
    });

    // In production with imap package:
    // Connect to IMAP, fetch emails, parse them
    // For now, return mock data

    const mockEmails: EmailMessage[] = [
      {
        id: "1",
        from: "support@vyomai.cloud",
        to: email,
        subject: "Welcome to VyomAi",
        body: "Welcome to your VyomAi email account. You can now manage your business communications.",
        date: new Date().toISOString(),
        read: false,
      },
      {
        id: "2",
        from: "team@vyomai.cloud",
        to: email,
        subject: "Team Update",
        body: "Here is the latest update from the VyomAi team about our ongoing projects.",
        date: new Date(Date.now() - 3600000).toISOString(),
        read: true,
      },
    ];

    return mockEmails;
  } catch (error) {
    console.error("Failed to fetch emails:", error);
    return [];
  }
}

export function createEmailSession(
  email: string,
  sessionToken: string
): void {
  emailSessions.set(sessionToken, {
    email,
    lastAccess: Date.now(),
  });
}

export function validateEmailSession(sessionToken: string): boolean {
  const session = emailSessions.get(sessionToken);
  if (!session) return false;

  // Check if session has expired
  if (Date.now() - session.lastAccess > SESSION_TIMEOUT) {
    emailSessions.delete(sessionToken);
    return false;
  }

  // Update last access time
  emailSessions.set(sessionToken, {
    ...session,
    lastAccess: Date.now(),
  });

  return true;
}

export function endEmailSession(sessionToken: string): void {
  emailSessions.delete(sessionToken);
}
