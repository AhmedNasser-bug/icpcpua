#!/usr/bin/env node

/**
 * Trusted administrative provisioning.
 *
 * Usage:
 *   node scripts/grant-admin.mjs --email admin@pua.edu.eg
 *   node scripts/grant-admin.mjs --uid FIREBASE_UID
 *   node scripts/grant-admin.mjs --email admin@pua.edu.eg --revoke
 *
 * Requires the server-side FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and
 * FIREBASE_PRIVATE_KEY environment variables. Never run this from a browser
 * or expose these credentials to a client bundle.
 */

import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"

function arg(name) {
  const index = process.argv.indexOf(name)
  if (index === -1) return null
  return process.argv[index + 1] ?? null
}

function fail(message) {
  console.error(`error: ${message}`)
  process.exitCode = 1
}

function initializeAdmin() {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!projectId || !clientEmail || !privateKey) {
    fail(
      "FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be set."
    )
    return null
  }

  if (getApps().length === 0) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
  }
  return getAuth()
}

async function main() {
  const email = arg("--email")
  const uid = arg("--uid")
  const revoke = process.argv.includes("--revoke")

  if ((!email && !uid) || (email && uid)) {
    fail("pass exactly one of --email or --uid.")
    return
  }

  const auth = initializeAdmin()
  if (!auth) return

  let user
  try {
    user = email ? await auth.getUserByEmail(email) : await auth.getUser(uid)
  } catch {
    fail("The Firebase user was not found.")
    return
  }

  const existingClaims =
    user.customClaims && typeof user.customClaims === "object"
      ? { ...user.customClaims }
      : {}

  const nextClaims = { ...existingClaims }
  if (revoke) {
    delete nextClaims.admin
  } else {
    nextClaims.admin = true
  }

  await auth.setCustomUserClaims(user.uid, nextClaims)
  await auth.revokeRefreshTokens(user.uid)

  console.log(
    JSON.stringify(
      {
        uid: user.uid,
        action: revoke ? "admin_revoked" : "admin_granted",
        unrelatedClaimsPreserved: Object.keys(existingClaims).filter(
          (key) => key !== "admin"
        ),
        refreshTokensRevoked: true,
      },
      null,
      2
    )
  )
  console.log(
    "The user must sign in again for the updated claim to appear in a new ID token."
  )
}

main().catch((error) => {
  console.error("Administrative provisioning failed:", error?.message ?? "unknown error")
  process.exitCode = 1
})
