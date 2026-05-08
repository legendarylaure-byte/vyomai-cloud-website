import "dotenv/config";
import { app } from "../server/index.js";

console.log("Vercel Serverless Function initialized");

// Export the Express app as a Vercel serverless function
export default app;
