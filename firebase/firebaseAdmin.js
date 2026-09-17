import { initializeApp, cert, getApps } from "firebase-admin/app";

import { getMessaging } from "firebase-admin/messaging";
import { getAuth } from "firebase-admin/auth";

// =====================================================
// FIREBASE ENV
// =====================================================

const projectId = process.env.FIREBASE_PROJECT_ID?.trim();

const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();

const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64?.trim();

// =====================================================
// VALIDATION
// =====================================================

if (!projectId) {
  throw new Error("❌ FIREBASE_PROJECT_ID is missing.");
}

if (!clientEmail) {
  throw new Error("❌ FIREBASE_CLIENT_EMAIL is missing.");
}

if (!privateKeyBase64) {
  throw new Error("❌ FIREBASE_PRIVATE_KEY_BASE64 is missing.");
}

// =====================================================
// DECODE PRIVATE KEY
// =====================================================

let privateKey;

try {
  privateKey = Buffer.from(privateKeyBase64, "base64").toString("utf8");

  privateKey = privateKey.trim();

  // Convert escaped newlines
  privateKey = privateKey.replace(/\\n/g, "\n");

  // Windows line endings
  privateKey = privateKey.replace(/\r\n/g, "\n");
} catch (error) {
  console.error("❌ Failed to decode Firebase private key.");

  throw new Error("Invalid FIREBASE_PRIVATE_KEY_BASE64.");
}

// =====================================================
// PRIVATE KEY VALIDATION
// =====================================================

if (
  !privateKey.includes("-----BEGIN PRIVATE KEY-----") ||
  !privateKey.includes("-----END PRIVATE KEY-----")
) {
  throw new Error("❌ Decoded Firebase private key is invalid.");
}

// =====================================================
// SAFE DEBUG
// =====================================================

console.log("==========================================");

console.log("🔥 Firebase Admin Configuration");

console.log("==========================================");

console.log("Project ID:", projectId);

console.log("Client Email:", clientEmail);

console.log("Private Key Loaded:", true);

console.log("Private Key Format:", true);

console.log("Private Key Length:", privateKey.length);

console.log("==========================================");

// =====================================================
// INITIALIZE FIREBASE ADMIN
// =====================================================

let app;

if (getApps().length === 0) {
  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  console.log("✅ Firebase Admin initialized successfully");
} else {
  app = getApps()[0];

  console.log("✅ Existing Firebase Admin app reused");
}

// =====================================================
// FIREBASE SERVICES
// =====================================================

export const messaging = getMessaging(app);

export const adminAuth = getAuth(app);

export default app;
