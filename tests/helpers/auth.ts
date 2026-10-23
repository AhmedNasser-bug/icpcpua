import { vi } from "vitest"

type Claims = Record<string, unknown>

/**
 * Shared Admin Auth mock. Test files expose it through their local
 * `vi.mock("@/lib/firebase-admin")` factory.
 */
export const adminAuthMock = {
  verifySessionCookie: vi.fn(),
  verifyIdToken: vi.fn(),
  createSessionCookie: vi.fn(),
  getUser: vi.fn(),
  revokeRefreshTokens: vi.fn(),
  setCustomUserClaims: vi.fn(),
  getUserByEmail: vi.fn(),
}

export function authUidFor(universityId: string): string {
  return `firebase-${universityId}`
}

export function sessionCookieFor(
  universityId: string,
  options: { uid?: string; admin?: boolean } = {}
): string {
  const uid = options.uid ?? authUidFor(universityId)
  return `pua_trainee_session=${options.admin ? `admin-${uid}` : uid}`
}

export function resetAdminAuthMock(): void {
  for (const value of Object.values(adminAuthMock)) value.mockReset()

  adminAuthMock.verifySessionCookie.mockImplementation(async (cookie: string) => {
    const uid = cookie.startsWith("admin-") ? cookie.slice("admin-".length) : cookie
    return { uid, admin: cookie.startsWith("admin-") }
  })
  adminAuthMock.verifyIdToken.mockImplementation(async (token: string) => ({
    uid: token,
    email: `${token}@example.com`,
    email_verified: true,
    admin: token.startsWith("admin-"),
  }))
  adminAuthMock.createSessionCookie.mockImplementation(
    async (idToken: string) => `session:${idToken}`
  )
  adminAuthMock.getUser.mockImplementation(async (uid: string) => ({
    uid,
    disabled: false,
    email: `${uid}@example.com`,
    customClaims: { admin: uid.startsWith("admin-") },
  }))
  adminAuthMock.revokeRefreshTokens.mockResolvedValue(undefined)
  adminAuthMock.setCustomUserClaims.mockResolvedValue(undefined)
}

resetAdminAuthMock()

export function useSessionClaims(claims: Claims): void {
  adminAuthMock.verifySessionCookie.mockResolvedValue(claims)
}

