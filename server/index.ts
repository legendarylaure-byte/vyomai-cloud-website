import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import { createServer } from "http";
import "dotenv/config";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://api.openai.com", "https://fonepay.com", "https://sendgrid.com", "https://*.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        mediaSrc: ["'self'", "https:", "data:"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com", "https://player.vimeo.com", "https://vimeo.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV?.toLowerCase() === "production" ? [] : [],
      },
    },
  }),
);

// Rate limiting for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: "Too many login attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// Apply rate limiting to login endpoint
app.post("/api/admin/login", loginLimiter, (req, res, next) => {
  next();
});

// Session configuration for persistent auth across serverless invocations
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db.js";

const PgSession = connectPgSimple(session);

app.use(
  session({
    store: pool ? new PgSession({
      pool: pool,
      tableName: "session",
      createTableIfMissing: true,
    }) : undefined,
    secret: process.env.SESSION_SECRET || (() => { throw new Error("SESSION_SECRET environment variable is required"); })(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV?.toLowerCase() === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);


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

await registerRoutes(httpServer, app);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`Root Error Handler: ${message}`, err);
  res.status(status).json({ message });
});

// importantly only setup vite in development and after
// setting up all the other routes so the catch-all route
// doesn't interfere with the other routes
if (process.env.NODE_ENV === "production") {
  serveStatic(app);
} else {
  const { setupVite } = await import("./vite.js");
  await setupVite(httpServer, app);
}

// ALWAYS serve the app on the port specified in the environment variable PORT
// Other ports are firewalled. Default to 5000 if not specified.
// this serves both the API and the client.
// It is the only port that is not firewalled.

// Only start the server if not in Vercel (Vercel handles this)
if (process.env.VERCEL !== "1") {
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);

      // Initialize social media auto-sync scheduler
      import('./social-media-sync-scheduler.js').then(({ initializeAutoSync }) => {
        initializeAutoSync().catch(err => console.error('Failed to initialize auto-sync:', err));
      }).catch(err => console.error('Failed to load auto-sync scheduler:', err));
    },
  );
}

// Export for Vercel serverless
export { app };

