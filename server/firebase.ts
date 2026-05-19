import admin from "firebase-admin";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

// Fallback: read from keys/ folder for local dev
if (!serviceAccountJson) {
  const keysDir = join(__dirname, "..", "keys");
  if (existsSync(keysDir)) {
    const files = readdirSync(keysDir).filter(f => f.endsWith(".json"));
    if (files.length > 0) {
      try {
        const keyPath = join(keysDir, files[0]);
        const keyContent = readFileSync(keyPath, "utf-8");
        serviceAccountJson = Buffer.from(keyContent).toString("base64");
      } catch (err) {
        console.error("Failed to read Firebase key from keys/ folder:", err);
      }
    }
  }
}

let firestore: FirebaseFirestore.Firestore | null = null;
let firebaseInitialized = false;

if (serviceAccountJson) {
  try {
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountJson, "base64").toString("utf-8")
    );

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    }

    firestore = admin.firestore();
    firebaseInitialized = true;
    console.log("Firebase Admin SDK initialized successfully");
  } catch (err) {
    console.error("Failed to initialize Firebase Admin SDK:", err);
  }
} else {
  console.log("FIREBASE_SERVICE_ACCOUNT not set — Firebase storage disabled");
}

export { admin, firestore, firebaseInitialized };
