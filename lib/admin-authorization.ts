import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";
import {
  getCurrentMessagingUser,
  MessagingAuthorizationError,
} from "@/lib/messaging";
import type { AccountRole } from "@/lib/firebase-identity";

export async function requireAdminUser() {
  const user = await getCurrentMessagingUser();
  if (!user.roles.includes("admin")) {
    throw new MessagingAuthorizationError(
      "Administrator access is required."
    );
  }
  return user;
}

export async function assignAdminRole(
  targetUid: string,
  enabled: boolean
) {
  await requireAdminUser();
  if (!/^sh_[a-f0-9]{64}$/.test(targetUid)) {
    throw new Error("Target user ID is invalid.");
  }

  const db = getAdminFirestore();
  const userRef = db.collection("users").doc(targetUid);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    if (!snapshot.exists || snapshot.data()?.status !== "active") {
      throw new MessagingAuthorizationError("The target account is unavailable.");
    }

    const roles: unknown = snapshot.data()?.roles;
    const validRoles = Array.isArray(roles) &&
      roles.every((role): role is AccountRole =>
        role === "client" || role === "freelancer" || role === "admin"
      );
    if (!validRoles) {
      throw new Error("Stored target account roles are invalid.");
    }

    const nextRoles = new Set<AccountRole>(roles);
    if (enabled) {
      nextRoles.add("admin");
    } else {
      nextRoles.delete("admin");
    }
    transaction.update(userRef, {
      roles: [...nextRoles],
      updatedAt: FieldValue.serverTimestamp(),
    });
    return [...nextRoles];
  });
}
