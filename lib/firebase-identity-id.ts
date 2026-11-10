import { createHash } from "node:crypto";

export const supportedOAuthProviders = ["google", "github"] as const;

export type SupportedOAuthProvider = (typeof supportedOAuthProviders)[number];

export function isSupportedOAuthProvider(
  provider: string
): provider is SupportedOAuthProvider {
  return supportedOAuthProviders.some((supportedProvider) => {
    return supportedProvider === provider;
  });
}

export function createFirebaseIdentityId(
  provider: SupportedOAuthProvider,
  providerAccountId: string
) {
  const accountId = providerAccountId.trim();
  if (!accountId) {
    throw new Error("OAuth provider account ID is required.");
  }

  return createHash("sha256")
    .update(provider)
    .update("\0")
    .update(accountId)
    .digest("hex");
}
