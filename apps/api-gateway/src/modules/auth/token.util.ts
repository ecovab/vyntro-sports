import { randomBytes, createHash } from "crypto";

/** Random opaque tokens (refresh, email-verification, password-reset) are
 * high entropy already, so a fast SHA-256 hash (not bcrypt) is sufficient
 * and avoids needlessly slow lookups. */
export function generateOpaqueToken(): string {
  return randomBytes(48).toString("hex");
}

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
