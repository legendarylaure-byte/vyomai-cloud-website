import admin from "firebase-admin";

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
let firestore: FirebaseFirestore.Firestore | null = null;
let firebaseInitialized = false;

if (serviceAccountJson) {
  try {
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountJson, "base64").toString("utf-8")
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });

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
