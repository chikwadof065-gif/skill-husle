import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const [uid, confirmation] = process.argv.slice(2);
if (!uid || confirmation !== "--confirm-admin") {
  console.error(
    "Usage: node --env-file=.env.local scripts/grant-admin.mjs <firebase-uid> --confirm-admin"
  );
  process.exitCode = 2;
} else if (!/^sh_[a-f0-9]{64}$/.test(uid)) {
  console.error("The target Firebase UID is invalid.");
  process.exitCode = 2;
} else {
  const projectId = process.env.AUTH_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.AUTH_FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.AUTH_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      "Firebase Admin credentials are missing. Configure the existing AUTH_FIREBASE_* server settings."
    );
    process.exitCode = 2;
  } else {
    const app =
      getApps()[0] ??
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      });
    const firestore = getFirestore(app);
    const userRef = firestore.collection("users").doc(uid);

    try {
      await firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(userRef);
        const data = snapshot.data();
        if (!snapshot.exists || data?.status !== "active") {
          throw new Error("The target user does not exist or is inactive.");
        }
        if (
          !Array.isArray(data.roles) ||
          !data.roles.every(
            (role) =>
              role === "client" ||
              role === "freelancer" ||
              role === "admin"
          )
        ) {
          throw new Error("The target user's role record is invalid.");
        }
        transaction.update(userRef, {
          roles: [...new Set([...data.roles, "admin"])],
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
      console.log("Administrator role assigned.");
    } catch (error) {
      console.error(
        error instanceof Error
          ? error.message
          : "Administrator role could not be assigned."
      );
      process.exitCode = 1;
    } finally {
      await app.delete();
    }
  }
}
