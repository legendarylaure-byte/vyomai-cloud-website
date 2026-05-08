import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const rootDir = process.cwd();
  // On Vercel, the dist folder is included in the function bundle
  const distPath = path.resolve(rootDir, "dist", "public");
  
  console.log(`Checking for static files at: ${distPath}`);

  if (!fs.existsSync(distPath)) {
    console.error(`Status: dist/public NOT FOUND at ${distPath}`);
    // Check if we are in the wrong directory or if build didn't include it
    const altPath = path.resolve(rootDir, "public");
    if (fs.existsSync(path.resolve(altPath, "index.html"))) {
      console.log(`Found index.html in fallback path: ${altPath}`);
      app.use(express.static(altPath));
      app.use("*", (_req, res) => {
        res.sendFile(path.resolve(altPath, "index.html"));
      });
      return;
    }

    // If we're on Vercel and can't find it, we might be in trouble
    console.warn("Static files not found, falling back to minimal response");
    app.get("*", (_req, res) => {
      res.status(404).send("Application static files not found. Please check deployment configuration.");
    });
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
