import { createHash, randomBytes } from "node:crypto";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createToken() {
  return randomBytes(32).toString("hex");
}

export const SESSION_COOKIE = "mykontrakans_session";
