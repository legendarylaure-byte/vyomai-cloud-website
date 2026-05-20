import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import { createServer } from "http";
import session from "express-session";
import createMemoryStore from "memorystore";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// ============== TIERED RATE LIMITING ==============

// Global: 100 req/min per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth routes: 5 req per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Chat / Contact / Bookings: 10 req/min
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin write operations: 30 req/min
const adminWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many admin requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply global rate limiter
app.use(globalLimiter);

// Apply auth rate limiting to sensitive endpoints
app.use("/api/admin/login", authLimiter);
app.use("/api/admin/request-password-reset", authLimiter);
app.use("/api/admin/verify-reset-code", authLimiter);
app.use("/api/admin/reset-password", authLimiter);
app.use("/api/email/login", authLimiter);

// Apply write rate limiting to high-traffic public endpoints
app.use("/api/chat", writeLimiter);
app.use("/api/contact", writeLimiter);
app.use("/api/bookings", writeLimiter);
app.use("/api/inquiries", writeLimiter);
app.use("/api/one-time-pricing-request", writeLimiter);

// Apply admin write rate limiting
app.use("/api/admin", adminWriteLimiter);

// ============== SECURITY HEADERS (CSP) ==============

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://fonepay.com", "https://sendgrid.com", "https://*.googleapis.com", "https://generativelanguage.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        mediaSrc: ["'self'", "https:", "data:"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com", "https://player.vimeo.com", "https://vimeo.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
  }),
);

// ============== BODY PARSER (reduced from 50MB to 1MB) ==============

app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// ============== SESSION CONFIG ==============

const MemoryStore = createMemoryStore(session);

app.use(
  session({
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
    secret: process.env.SESSION_SECRET || (() => { throw new Error("SESSION_SECRET environment variable is required"); })(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV?.toLowerCase() === "production",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// ============== LOGGING ==============

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

// ============== ROUTES ==============

await registerRoutes(httpServer, app);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message || "Internal Server Error";
  console.error(`Root Error Handler:`, err);
  res.status(status).json({ message });
});

if (process.env.NODE_ENV === "production") {
  serveStatic(app);
} else {
  const { setupVite } = await import("./vite.js");
  await setupVite(httpServer, app);
}

if (process.env.VERCEL !== "1") {
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
      import('./social-media-sync-scheduler.js').then(({ initializeAutoSync }) => {
        initializeAutoSync().catch(err => console.error('Failed to initialize auto-sync:', err));
      }).catch(err => console.error('Failed to load auto-sync scheduler:', err));
    },
  );
}

export { app };
