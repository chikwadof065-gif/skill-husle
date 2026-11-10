import "server-only";
import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { auth } from "@/auth";
import { getAdminFirestore } from "@/lib/firebase-admin";
import {
  ensureFirebaseIdentity,
  FirebaseIdentityConfigurationError,
  FirebaseIdentityIntegrityError,
} from "@/lib/firebase-identity";
import { isSupportedOAuthProvider } from "@/lib/firebase-identity-id";

export class MessagingAuthenticationError extends Error {
  constructor() {
    super("A current OAuth session is required.");
    this.name = "MessagingAuthenticationError";
  }
}

export class MessagingAuthorizationError extends Error {
  constructor(message = "You are not a participant in this conversation.") {
    super(message);
    this.name = "MessagingAuthorizationError";
  }
}

export class MessagingInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MessagingInputError";
  }
}

export { FirebaseIdentityConfigurationError, FirebaseIdentityIntegrityError };

const recipientSchema = z.object({
  recipientUid: z.string().regex(/^sh_[a-f0-9]{64}$/),
});

const messageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export async function getCurrentMessagingUser() {
  const session = await auth();
  const identityId = session?.user?.firebaseIdentityId;
  const provider = session?.user?.firebaseIdentityProvider;

  if (
    !identityId ||
    !provider ||
    !isSupportedOAuthProvider(provider)
  ) {
    throw new MessagingAuthenticationError();
  }

  const user = await ensureFirebaseIdentity(identityId, provider, {
    email: session.user?.email ?? null,
    displayName: session.user?.name ?? null,
  });
  if (user.status !== "active") {
    throw new MessagingAuthorizationError("This account is disabled.");
  }

  return user;
}

export function parseRecipient(value: unknown) {
  const parsed = recipientSchema.safeParse(value);
  if (!parsed.success) {
    throw new MessagingInputError("Choose a valid recipient.");
  }
  return parsed.data;
}

export function parseMessage(value: unknown) {
  const parsed = messageSchema.safeParse(value);
  if (!parsed.success) {
    throw new MessagingInputError(
      parsed.error.issues[0]?.message ?? "Enter a valid message."
    );
  }
  return parsed.data;
}

export function parseRequestBody(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new MessagingInputError("Request body must be a JSON object.");
  }
  return value;
}

export async function readRequestBody(request: Request) {
  try {
    return parseRequestBody(await request.json());
  } catch (error) {
    if (error instanceof MessagingInputError) {
      throw error;
    }
    throw new MessagingInputError("Request body must be valid JSON.");
  }
}

export function isSameOriginAppRequest(request: Request) {
  return request.headers.get("x-skill-hustle-request") === "1";
}

function conversationIdFor(uidA: string, uidB: string) {
  return createHash("sha256")
    .update([uidA, uidB].sort().join("\0"))
    .digest("hex");
}

function getPublicName(name: string | null, email: string | null, uid: string) {
  const sanitizedName = name?.trim().slice(0, 100);
  if (sanitizedName) {
    return sanitizedName;
  }
  return email?.trim().slice(0, 100) || `Member ${uid.slice(-6)}`;
}

function readUserSummary(value: unknown, expectedUid: string) {
  if (typeof value !== "object" || value === null) {
    throw new MessagingAuthorizationError("The recipient account is unavailable.");
  }
  const record = value as Record<string, unknown>;
  if (
    record.uid !== expectedUid ||
    record.status !== "active" ||
    !Array.isArray(record.roles)
  ) {
    throw new MessagingAuthorizationError("The recipient account is unavailable.");
  }
  return {
    uid: expectedUid,
    name: getPublicName(
      typeof record.displayName === "string" ? record.displayName : null,
      typeof record.email === "string" ? record.email : null,
      expectedUid
    ),
    photoURL: null as string | null,
  };
}

export async function createOrGetConversation(
  currentUid: string,
  recipientUid: string
) {
  if (currentUid === recipientUid) {
    throw new MessagingInputError("You cannot start a conversation with yourself.");
  }

  const db = getAdminFirestore();
  const recipientSnapshot = await db.collection("users").doc(recipientUid).get();
  if (!recipientSnapshot.exists) {
    throw new MessagingAuthorizationError("The recipient account is unavailable.");
  }
  const recipient = readUserSummary(recipientSnapshot.data(), recipientUid);

  const currentSnapshot = await db.collection("users").doc(currentUid).get();
  if (!currentSnapshot.exists) {
    throw new MessagingAuthorizationError("The account is unavailable.");
  }
  const current = readUserSummary(currentSnapshot.data(), currentUid);

  const participants = [current, recipient].sort((a, b) =>
    a.uid.localeCompare(b.uid)
  );
  const conversationRef = db
    .collection("conversations")
    .doc(conversationIdFor(currentUid, recipientUid));

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(conversationRef);
    if (snapshot.exists) {
      const data = snapshot.data();
      if (
        !Array.isArray(data?.participantUids) ||
        !data.participantUids.includes(currentUid) ||
        !data.participantUids.includes(recipientUid)
      ) {
        throw new MessagingAuthorizationError(
          "The conversation membership could not be verified."
        );
      }
      return conversationRef.id;
    }

    transaction.create(conversationRef, {
      participantUids: participants.map((participant) => participant.uid),
      participantProfiles: participants.map(({ uid, name, photoURL }) => ({
        uid,
        name,
        photoURL,
      })),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastMessageText: "",
      lastMessageAt: null,
      lastMessageSenderUid: null,
      readAtByUid: {},
    });

    return conversationRef.id;
  });
}

export async function sendConversationMessage(
  uid: string,
  conversationId: string,
  body: string
) {
  if (!/^[a-f0-9]{64}$/.test(conversationId)) {
    throw new MessagingInputError("Choose a valid conversation.");
  }

  const db = getAdminFirestore();
  const conversationRef = db.collection("conversations").doc(conversationId);
  const messageRef = conversationRef.collection("messages").doc();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(conversationRef);
    const data = snapshot.data();
    if (
      !snapshot.exists ||
      !Array.isArray(data?.participantUids) ||
      !data.participantUids.includes(uid)
    ) {
      throw new MessagingAuthorizationError();
    }

    transaction.create(messageRef, {
      senderUid: uid,
      body,
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.update(conversationRef, {
      lastMessageText: body.slice(0, 180),
      lastMessageAt: FieldValue.serverTimestamp(),
      lastMessageSenderUid: uid,
      updatedAt: FieldValue.serverTimestamp(),
      [`readAtByUid.${uid}`]: FieldValue.serverTimestamp(),
    });
  });
}

export async function markConversationRead(uid: string, conversationId: string) {
  if (!/^[a-f0-9]{64}$/.test(conversationId)) {
    throw new MessagingInputError("Choose a valid conversation.");
  }

  const db = getAdminFirestore();
  const conversationRef = db.collection("conversations").doc(conversationId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(conversationRef);
    const data = snapshot.data();
    if (
      !snapshot.exists ||
      !Array.isArray(data?.participantUids) ||
      !data.participantUids.includes(uid)
    ) {
      throw new MessagingAuthorizationError();
    }
    transaction.update(conversationRef, {
      [`readAtByUid.${uid}`]: FieldValue.serverTimestamp(),
    });
  });
}

export async function updateAccountRoles(
  uid: string,
  requestedRoles: Array<"client" | "freelancer">
) {
  const db = getAdminFirestore();
  const userRef = db.collection("users").doc(uid);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    if (!snapshot.exists || snapshot.data()?.status !== "active") {
      throw new MessagingAuthorizationError("The account could not be verified.");
    }

    const existingRoles: unknown = snapshot.data()?.roles;
    if (
      !Array.isArray(existingRoles) ||
      !existingRoles.every(
        (role) => role === "client" || role === "freelancer" || role === "admin"
      )
    ) {
      throw new FirebaseIdentityIntegrityError(
        "Stored account roles are invalid."
      );
    }

    const roles = [
      ...(existingRoles.includes("admin") ? ["admin" as const] : []),
      ...new Set(requestedRoles),
    ];
    transaction.update(userRef, { roles });
    return requestedRoles;
  });
}
