import { initializeApp, cert, getApps } from "firebase-admin/app";

/*
  Requires env vars (add to your .env):
    FIREBASE_PROJECT_ID
    FIREBASE_CLIENT_EMAIL
    FIREBASE_PRIVATE_KEY   (keep the \n escapes, they get replaced below)

  Get these from: Firebase Console -> Project Settings -> Service Accounts
  -> Generate New Private Key (downloads a JSON file with these 3 values).
*/

const existingApps = getApps();

const firebaseApp = existingApps.length
  ? existingApps[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });

export default firebaseApp;