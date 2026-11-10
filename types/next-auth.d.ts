import type { DefaultSession } from "next-auth";
import type { SupportedOAuthProvider } from "@/lib/firebase-identity-id";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      firebaseIdentityId?: string;
      firebaseIdentityProvider?: SupportedOAuthProvider;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    firebaseIdentityId?: string;
    firebaseIdentityProvider?: SupportedOAuthProvider;
  }
}
