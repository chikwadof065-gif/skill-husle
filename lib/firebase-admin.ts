import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export const FIRESTORE_DATABASE_MISSING_MESSAGE =
  "The default Cloud Firestore database does not exist in this Firebase project. Create the (default) database in Firebase Console, then refresh.";

export function isFirestoreDatabaseMissingError(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  const code = error.code;
  return code === 5 || code === "5" || code === "NOT_FOUND";
}

function getAdminApp() {
  const existingApp = getApps().find((app) => app.name === "[DEFAULT]");

  if (existingApp) {
    return existingApp;
  }

  const projectId = process.env.AUTH_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.AUTH_FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.AUTH_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin is not configured. Set AUTH_FIREBASE_PROJECT_ID, AUTH_FIREBASE_CLIENT_EMAIL, and AUTH_FIREBASE_PRIVATE_KEY."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}
