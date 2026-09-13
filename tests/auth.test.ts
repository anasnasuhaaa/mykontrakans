import assert from "node:assert/strict";
import test from "node:test";
import { createToken, hashToken } from "../lib/auth/tokens";
import { emailSchema, passwordSchema } from "../lib/validators/auth";

test("tokens have 256 bits of randomness and are stored as hashes", () => {
  const token = createToken();
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.notEqual(token, createToken());
  assert.notEqual(hashToken(token), token);
  assert.equal(hashToken(token), hashToken(token));
});

test("email normalization and password byte limits", () => {
  assert.equal(emailSchema.parse(" Person@Example.com "), "person@example.com");
  assert.equal(passwordSchema.safeParse("short").success, false);
  assert.equal(passwordSchema.safeParse("🔑".repeat(20)).success, false);
  assert.equal(passwordSchema.safeParse("long-password-123").success, true);
});
