import "server-only";
import { createHmac } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import {
  getAdminFirestore,
  getAdminAuth,
} from "@/lib/firebase-admin";
import type { SupportedOAuthProvider } from "@/lib/firebase-identity-id";

export const accountRoles = ["client", "freelancer", "admin"] as const;
export type AccountRole = (typeof accountRoles)[number];
export type AccountStatus = "active" | "disabled";

type FirebaseUserDocument = {
  uid: string;
  roles: AccountRole[];
  status: AccountStatus;
  email: string | null;
  displayName: string | null;
};

export class FirebaseIdentityConfigurationError extends Error {
  constructor() {
    super(
      "Firebase identity mapping is not configured. Set AUTH_FIREBASE_IDENTITY_SECRET to a persistent random value of at least 32 bytes."
    );
    this.name = "FirebaseIdentityConfigurationError";
  }
}

export class FirebaseIdentityIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FirebaseIdentityIntegrityError";
  }
}

function getIdentitySecret() {
  const secret = process.env.AUTH_FIREBASE_IDENTITY_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new FirebaseIdentityConfigurationError();
  }

  return secret;
}

function createFirebaseUid(identityId: string) {
  return `sh_${createHmac("sha256", getIdentitySecret())
    .update(identityId)
    .digest("hex")}`;
}

function isAccountRole(value: unknown): value is AccountRole {
  return accountRoles.some((role) => role === value);
}

function parseUserDocument(value: unknown): FirebaseUserDocument {
  if (typeof value !== "object" || value === null) {
    throw new FirebaseIdentityIntegrityError(
      "Firebase user record is invalid."
    );
  }

  const record = value as Record<string, unknown>;
  if (
    typeof record.uid !== "string" ||
    !Array.isArray(record.roles) ||
    !record.roles.every(isAccountRole) ||
    (record.status !== "active" && record.status !== "disabled") ||
    (record.email !== null && typeof record.email !== "string") ||
    (record.displayName !== null && typeof record.displayName !== "string")
  ) {
    throw new FirebaseIdentityIntegrityError(
      "Firebase user record is invalid."
    );
  }

  return {
    uid: record.uid,
    roles: record.roles,
    status: record.status,
    email: record.email,
    displayName: record.displayName,
  };
}

export async function ensureFirebaseIdentity(
  identityId: string,
  provider: SupportedOAuthProvider,
  profile: { email: string | null; displayName: string | null }
) {
  if (!/^[a-f0-9]{64}$/.test(identityId)) {
    throw new FirebaseIdentityIntegrityError(
      "Firebase identity ID is invalid."
    );
  }

  const db = getAdminFirestore();
  return db.runTransaction(async (transaction) => {
    const identityRef = db.collection("authIdentities").doc(identityId);
    const identitySnapshot = await transaction.get(identityRef);

    if (identitySnapshot.exists) {
      const identity = identitySnapshot.data();
      if (
        identity?.provider !== provider ||
        typeof identity.uid !== "string" ||
        !/^sh_[a-f0-9]{64}$/.test(identity.uid)
      ) {
        throw new FirebaseIdentityIntegrityError(
          "Firebase identity mapping is invalid."
        );
      }

      const userRef = db.collection("users").doc(identity.uid);
      const userSnapshot = await transaction.get(userRef);
      if (!userSnapshot.exists) {
        throw new FirebaseIdentityIntegrityError(
          "Firebase identity exists without its user record."
        );
      }

      const user = parseUserDocument(userSnapshot.data());
      if (user.uid !== identity.uid) {
        throw new FirebaseIdentityIntegrityError(
          "Firebase identity and user records do not match."
        );
      }

      transaction.update(userRef, {
        email: profile.email,
        displayName: profile.displayName,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return user;
    }

    const uid = createFirebaseUid(identityId);
    const userRef = db.collection("users").doc(uid);
    const userSnapshot = await transaction.get(userRef);
    if (userSnapshot.exists) {
      throw new FirebaseIdentityIntegrityError(
        "Generated Firebase UID is already assigned."
      );
    }

    transaction.create(identityRef, {
      uid,
      provider,
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.create(userRef, {
      uid,
      roles: [],
      status: "active",
      email: profile.email,
      displayName: profile.displayName,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      uid,
      roles: [],
      status: "active" as const,
      email: profile.email,
      displayName: profile.displayName,
    };
  });
}

export async function createFirebaseIdentityToken(
  identityId: string,
  provider: SupportedOAuthProvider,
  profile: { email: string | null; displayName: string | null }
) {
  const user = await ensureFirebaseIdentity(identityId, provider, profile);
  if (user.status !== "active") {
    return { status: "disabled" as const };
  }

  const token = await getAdminAuth().createCustomToken(user.uid);
  return { status: "active" as const, uid: user.uid, token };
}
