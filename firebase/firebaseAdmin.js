import {
  initializeApp,
  cert,
  getApps,
} from "firebase-admin/app";

import { getMessaging } from "firebase-admin/messaging";
import { getAuth } from "firebase-admin/auth";

// ==========================================
// Firebase Admin credentials from ENV
// ==========================================

const projectId = process.env.FIREBASE_PROJECT_ID;

const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
  /\\n/g,
  "\n"
);

// ==========================================
// Validate Firebase credentials
// ==========================================

if (!projectId || !clientEmail || !privateKey) {
  console.error("❌ Firebase Admin credentials are missing.");

  console.error({
    FIREBASE_PROJECT_ID: !!projectId,
    FIREBASE_CLIENT_EMAIL: !!clientEmail,
    FIREBASE_PRIVATE_KEY: !!privateKey,
  });

  throw new Error(
    "Firebase Admin credentials are missing in environment variables."
  );
}

// ==========================================
// Initialize Firebase Admin
// ==========================================

const app =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      })
    : getApps()[0];

// ==========================================
// Firebase services
// ==========================================

export const messaging = getMessaging(app);

export const adminAuth = getAuth(app);

export default app;