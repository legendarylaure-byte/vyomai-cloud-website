import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import crypto from "crypto";
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import { createServer } from "http";
import session from "express-session";
import createMemoryStore from "memorystore";

const app = express();

// ============== TRUST PROXY (required behind nginx/Vercel/CDN) ==============
app.set('trust proxy', 1);

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

// Apply global rate limiter (skip Vite dev asset paths in dev mode)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "development" && (req.path.startsWith("/@fs/") || req.path.startsWith("/src/") || req.path.startsWith("/node_modules/") || req.path.startsWith("/@react-refresh") || req.path.startsWith("/@vite/"))) {
    return next();
  }
  return globalLimiter(req, res, next);
});

// Apply auth rate limiting to sensitive endpoints
app.use("/api/admin/login", authLimiter);
app.use("/api/admin/request-password-reset", authLimiter);
app.use("/api/admin/verify-reset-code", authLimiter);
app.use("/api/admin/reset-password", authLimiter);
app.use("/api/admin/resend-otp", authLimiter);
app.use("/api/admin/verify-2fa", authLimiter);
app.use("/api/admin/disable-2fa", authLimiter);
app.use("/api/email/login", authLimiter);

// Apply write rate limiting to high-traffic public endpoints
app.use("/api/chat", writeLimiter);
app.use("/api/chat-stream", writeLimiter);
app.use("/api/contact", writeLimiter);
app.use("/api/bookings", writeLimiter);
app.use("/api/inquiries", writeLimiter);
app.use("/api/one-time-pricing-request", writeLimiter);
app.use("/api/visitors/increment", writeLimiter);
app.use("/api/ai/consult", writeLimiter);
app.use("/api/ai/playground", writeLimiter);
app.use("/api/ai/automation", writeLimiter);
app.use("/api/payment/initiate", writeLimiter);

// Apply admin write rate limiting
app.use("/api/admin", adminWriteLimiter);

// ============== SECURITY HEADERS (CSP) ==============

app.use(
  (helmet as any)({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://fonts.googleapis.com",
          "https://accounts.google.com",
          "'sha256-Z2/iFzh9VMlVkEOar1f/oSHWwQk3ve1qk/C2WdsC4Xk='",
          "'sha256-6aQGB29S/863IPFiFYo57IzRf38nM5MkgEaImlrD/fU='",
        ],
        scriptSrcElem: [
          "'self'",
          "https://fonts.googleapis.com",
          "https://accounts.google.com",
          "'sha256-Z2/iFzh9VMlVkEOar1f/oSHWwQk3ve1qk/C2WdsC4Xk='",
          "'sha256-6aQGB29S/863IPFiFYo57IzRf38nM5MkgEaImlrD/fU='",
          "'unsafe-inline'",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://fonepay.com", "https://*.googleapis.com", "https://generativelanguage.googleapis.com", "https://accounts.google.com"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://fonts.gstatic.com", "https://lh3.googleusercontent.com", "https://ui-avatars.com", "blob:"],
        mediaSrc: ["'self'", "https:", "data:"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com", "https://player.vimeo.com", "https://vimeo.com", "https://accounts.google.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginResourcePolicy: { policy: "same-origin" },
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: ["self"],
      usb: [],
      magnetometer: [],
      gyroscope: [],
      accelerometer: [],
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
    name: "vyomai.sid",
    cookie: {
      secure: process.env.NODE_ENV?.toLowerCase() === "production",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }) as any
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

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

// ============== CORS ==============

const allowedOrigins = (process.env.CORS_ORIGINS || "https://vyomai.cloud,https://www.vyomai.cloud,https://website-vyomai.cloud,http://localhost:5000,http://localhost:5174,http://localhost:3000,http://localhost:5173").split(",");

app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  })
);

// ============== REQUEST ID ==============

app.use((req, _res, next) => {
  const requestId = req.headers["x-request-id"] as string || crypto.randomUUID();
  req.headers["x-request-id"] = requestId;
  next();
});

// ============== HEALTH CHECK ==============

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
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

  // ============== GRACEFUL SHUTDOWN ==============

  const shutdown = (signal: string) => {
    log(`${signal} received — shutting down gracefully`);
    httpServer.close(() => {
      log("HTTP server closed");
      process.exit(0);
    });
    setTimeout(() => {
      log("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

// ============== GLOBAL ERROR HANDLERS ==============

process.on("uncaughtException", (err) => {
  console.error("[FATAL] Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[FATAL] Unhandled Rejection:", reason);
});

export { app };
