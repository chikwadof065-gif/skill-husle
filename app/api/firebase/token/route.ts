import { auth } from "@/auth";
import {
  createFirebaseIdentityToken,
  FirebaseIdentityConfigurationError,
  FirebaseIdentityIntegrityError,
} from "@/lib/firebase-identity";
import { isSupportedOAuthProvider } from "@/lib/firebase-identity-id";

export const runtime = "nodejs";

function jsonResponse(
  body: Record<string, string>,
  status: number,
  noStore = false
) {
  return Response.json(body, {
    status,
    headers: noStore ? { "Cache-Control": "no-store" } : undefined,
  });
}

export async function POST() {
  const session = await auth();
  const identityId = session?.user?.firebaseIdentityId;
  const provider = session?.user?.firebaseIdentityProvider;

  if (
    !identityId ||
    !provider ||
    !isSupportedOAuthProvider(provider)
  ) {
    return jsonResponse(
      {
        error: "REAUTHENTICATION_REQUIRED",
        message: "Sign out and sign in again to activate messaging.",
      },
      401,
      true
    );
  }

  try {
    const result = await createFirebaseIdentityToken(identityId, provider, {
      email: session.user?.email ?? null,
      displayName: session.user?.name ?? null,
    });

    if (result.status === "disabled") {
      return jsonResponse(
        {
          error: "ACCOUNT_DISABLED",
          message: "This account cannot access messaging.",
        },
        403,
        true
      );
    }

    return Response.json(
      { firebaseToken: result.token, uid: result.uid },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof FirebaseIdentityConfigurationError) {
      return jsonResponse(
        {
          error: "FIREBASE_IDENTITY_NOT_CONFIGURED",
          message:
            "Firebase identity mapping is not configured. Add the required server-only setting.",
        },
        503,
        true
      );
    }

    if (error instanceof FirebaseIdentityIntegrityError) {
      console.error("Firebase identity verification failed.", error.message);
      return jsonResponse(
        {
          error: "FIREBASE_IDENTITY_INVALID",
          message: "The account identity could not be verified.",
        },
        500,
        true
      );
    }

    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : "unknown";
    console.error("Firebase custom token creation failed.", { code });
    return jsonResponse(
      {
        error: "FIREBASE_IDENTITY_UNAVAILABLE",
        message: "Messaging authentication is temporarily unavailable.",
      },
      503,
      true
    );
  }
}
