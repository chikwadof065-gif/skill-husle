"use server";

import { auth } from "@/auth";
import {
  ensureFirebaseIdentity,
  FirebaseIdentityConfigurationError,
  FirebaseIdentityIntegrityError,
} from "@/lib/firebase-identity";
import { isSupportedOAuthProvider } from "@/lib/firebase-identity-id";
import { revalidatePath } from "next/cache";
import {
  FIRESTORE_DATABASE_MISSING_MESSAGE,
  isFirestoreDatabaseMissingError,
} from "@/lib/firebase-admin";
import { freelancerListingFormSchema } from "@/lib/freelancer-schema";
import { saveFreelancerListing } from "@/lib/freelancer-listings";

export type FreelancerListingActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function saveFreelancerListingAction(
  _previousState: FreelancerListingActionState,
  formData: FormData
): Promise<FreelancerListingActionState> {
  const session = await auth();
  const email = session?.user?.email;
  const identityId = session?.user?.firebaseIdentityId;
  const provider = session?.user?.firebaseIdentityProvider;

  if (!email) {
    return {
      status: "error",
      message: "Sign in with an account that has an email address before posting.",
    };
  }

  const parsed = freelancerListingFormSchema.safeParse({
    name: formData.get("name"),
    title: formData.get("title"),
    description: formData.get("description"),
    skills: formData.get("skills"),
    category: formData.get("category"),
    startingPrice: formData.get("startingPrice"),
    dashboardColor: formData.get("dashboardColor") ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check your listing details.",
    };
  }

  try {
    let ownerUid: string | undefined;
    if (
      identityId &&
      provider &&
      isSupportedOAuthProvider(provider)
    ) {
      const user = await ensureFirebaseIdentity(identityId, provider, {
        email,
        displayName: session.user?.name ?? null,
      });
      if (user.status !== "active") {
        return {
          status: "error",
          message: "This account cannot publish a freelancer listing.",
        };
      }
      ownerUid = user.uid;
    }

    await saveFreelancerListing(email, parsed.data, ownerUid);
  } catch (error) {
    console.error("Failed to save freelancer listing to Firestore.", error);
    return {
      status: "error",
      message: error instanceof FirebaseIdentityConfigurationError
        ? "Firebase identity mapping is not configured. Add AUTH_FIREBASE_IDENTITY_SECRET."
        : error instanceof FirebaseIdentityIntegrityError
          ? "Your account identity could not be verified."
        : isFirestoreDatabaseMissingError(error)
        ? FIRESTORE_DATABASE_MISSING_MESSAGE
        : "Your listing could not be saved. Check Firebase configuration and try again.",
    };
  }

  revalidatePath("/find-freelancers");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Your freelancer listing is saved and now appears in Find Freelancers.",
  };
}
