import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

export function generateClaimCode(): string {
  return randomBytes(24).toString("base64url")
}

export function hashClaimCode(secret: string, traineeId: string, code: string): string {
  return createHmac("sha256", secret)
    .update(`${traineeId}:${code}`)
    .digest("hex")
}

export function claimCodeMatches(
  secret: string,
  traineeId: string,
  code: string,
  expectedHash: string
): boolean {
  if (!expectedHash) return false
  const actual = Buffer.from(hashClaimCode(secret, traineeId, code))
  const expected = Buffer.from(expectedHash)
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}
