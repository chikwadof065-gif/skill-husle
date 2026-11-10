import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import {
  createFirebaseIdentityId,
  isSupportedOAuthProvider,
} from "@/lib/firebase-identity-id";

const providers = [
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
      ]
    : []),
  ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
    ? [
        GitHub({
          clientId: process.env.AUTH_GITHUB_ID,
          clientSecret: process.env.AUTH_GITHUB_SECRET,
        }),
      ]
    : []),
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  trustHost: true,
  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, account }) {
      if (account && isSupportedOAuthProvider(account.provider)) {
        token.firebaseIdentityId = createFirebaseIdentityId(
          account.provider,
          account.providerAccountId
        );
        token.firebaseIdentityProvider = account.provider;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.firebaseIdentityId && token.firebaseIdentityProvider) {
        session.user.firebaseIdentityId = token.firebaseIdentityId;
        session.user.firebaseIdentityProvider = token.firebaseIdentityProvider;
      }

      return session;
    },
  },
});
