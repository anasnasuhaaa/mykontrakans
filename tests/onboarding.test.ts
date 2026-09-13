import assert from "node:assert/strict";
import test from "node:test";
import { memberSchema, onboardingSchema } from "../lib/validators/members";

test("member roles and normalized emails are validated", () => {
  assert.equal(memberSchema.safeParse({ name: "Member", email: "invalid", role: "ADMIN" }).success, false);
  assert.equal(memberSchema.safeParse({ name: "Member", email: "a@b.com", role: "OWNER" }).success, false);
});
test("onboarding requires valid token and matching passwords", () => {
  const input = { token: "a".repeat(64), password: "safe-password-123", confirmPassword: "safe-password-123" };
  assert.equal(onboardingSchema.safeParse(input).success, true);
  assert.equal(onboardingSchema.safeParse({ ...input, token: "bad" }).success, false);
  assert.equal(onboardingSchema.safeParse({ ...input, confirmPassword: "different" }).success, false);
});
