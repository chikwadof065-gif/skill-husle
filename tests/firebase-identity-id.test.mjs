import assert from "node:assert/strict";
import test from "node:test";
import {
  createFirebaseIdentityId,
  isSupportedOAuthProvider,
} from "../lib/firebase-identity-id.ts";

test("OAuth identity IDs are stable and scoped to their provider", () => {
  const first = createFirebaseIdentityId("google", "provider-account-42");
  const repeated = createFirebaseIdentityId("google", "provider-account-42");
  const otherProvider = createFirebaseIdentityId(
    "github",
    "provider-account-42"
  );

  assert.equal(first, repeated);
  assert.notEqual(first, otherProvider);
  assert.match(first, /^[a-f0-9]{64}$/);
});

test("only configured OAuth providers can establish Firebase identities", () => {
  assert.equal(isSupportedOAuthProvider("google"), true);
  assert.equal(isSupportedOAuthProvider("github"), true);
  assert.equal(isSupportedOAuthProvider("credentials"), false);
});
