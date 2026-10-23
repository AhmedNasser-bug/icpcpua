#!/usr/bin/env node

/**
 * Firestore-to-Firebase-Authentication migration helper.
 *
 * Creates Firebase Authentication users for existing trainee documents that do
 * not yet have an `authUid`. It never links a UID to a trainee document: the
 * trainee must prove email ownership by signing in and completing the verified
 * email claim (or the bounded legacy claim-code flow).
 *
 * Usage:
 *   node scripts/migrate-trainee-auth.mjs --dry-run
 *   node scripts/migrate-trainee-auth.mjs
 *   node scripts/migrate-trainee-auth.mjs --send-reset
 *
 * Optional:
 *   --limit=250          maximum trainee documents scanned in this run
 *   --cursor=DOC_ID      resume after this document id (for large datasets)
 *   --send-reset         send Firebase password-reset emails (requires
 *                        FIREBASE_WEB_API_KEY and configured email templates)
 *
 * Required server-side env:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *
 * The script prints counts only; it never prints ID tokens, session cookies,
 * reset links or private keys.
 */

import { cert, getApps, initializeApp } from "firebase-admin/app"
import { FieldPath, getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function argValue(name) {
  const prefix = `--${name}=`
  const match = process.argv.find((value) => value.startsWith(prefix))
  return match ? match.slice(prefix.length) : null
}

function initializeAdmin() {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be set."
    )
  }

  if (getApps().length === 0) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
  }

  return { auth: getAuth(), db: getFirestore() }
}

async function sendResetEmail(email, apiKey) {
  if (!apiKey) return "skipped_no_api_key"

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
      }
    )
    return response.ok ? "sent" : "send_failed"
  } catch {
    return "send_failed"
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const sendReset = process.argv.includes("--send-reset")
  const limit = Math.min(Math.max(Number.parseInt(argValue("limit") ?? "250", 10) || 250, 1), 1000)
  const cursor = argValue("cursor")
  const apiKey = process.env.FIREBASE_WEB_API_KEY ?? null

  const { auth, db } = initializeAdmin()
  const counts = {
    scanned: 0,
    alreadyLinked: 0,
    eligible: 0,
    createdUsers: 0,
    existingUsers: 0,
    unverifiedExistingUsers: 0,
    invalidEmails: 0,
    duplicateEmails: 0,
    disabledExistingUsers: 0,
    failed: 0,
    resetEmailsSent: 0,
  }
  const seenEmails = new Set()
  const failures = []

  let query = db
    .collection("trainees")
    .orderBy(FieldPath.documentId())
    .limit(limit)
  if (cursor) query = query.startAfter(cursor)

  const snapshot = await query.get()
  let lastId = cursor

  for (const doc of snapshot.docs) {
    counts.scanned += 1
    lastId = doc.id
    const trainee = doc.data()

    if (typeof trainee.authUid === "string" && trainee.authUid) {
      counts.alreadyLinked += 1
      continue
    }

    const email =
      typeof trainee.email === "string" ? trainee.email.trim().toLowerCase() : ""

    if (!EMAIL_PATTERN.test(email)) {
      counts.invalidEmails += 1
      failures.push({ traineeId: doc.id, reason: "invalid_email" })
      if (!dryRun) {
        await doc.ref.set(
          {
            authMigrationState: "failed",
            authMigrationUpdatedAt: new Date().toISOString(),
            authMigrationError: "invalid_email",
          },
          { merge: true }
        )
      }
      continue
    }

    if (seenEmails.has(email)) {
      counts.duplicateEmails += 1
      failures.push({ traineeId: doc.id, reason: "duplicate_email_in_batch" })
      continue
    }
    seenEmails.add(email)

    if (!dryRun) {
      const duplicates = await db
        .collection("trainees")
        .where("email", "==", email)
        .limit(2)
        .get()
      if (duplicates.size > 1) {
        counts.duplicateEmails += 1
        failures.push({ traineeId: doc.id, reason: "duplicate_email_in_database" })
        await doc.ref.set(
          {
            authMigrationState: "failed",
            authMigrationUpdatedAt: new Date().toISOString(),
            authMigrationError: "duplicate_email",
          },
          { merge: true }
        )
        continue
      }
    }

    counts.eligible += 1

    if (dryRun) continue

    try {
      let user = null
      try {
        user = await auth.getUserByEmail(email)
        counts.existingUsers += 1
        if (!user.emailVerified) counts.unverifiedExistingUsers += 1
        if (user.disabled) {
          counts.disabledExistingUsers += 1
          failures.push({ traineeId: doc.id, reason: "existing_user_disabled" })
          await doc.ref.set(
            {
              authMigrationState: "skipped",
              authMigrationUpdatedAt: new Date().toISOString(),
              authMigrationError: "existing_firebase_user_disabled",
            },
            { merge: true }
          )
          continue
        }
      } catch (error) {
        if (error?.code !== "auth/user-not-found") throw error
      }

      if (!user) {
        user = await auth.createUser({
          email,
          emailVerified: true,
          disabled: false,
        })
        counts.createdUsers += 1
      }

      const resetState = sendReset ? await sendResetEmail(email, apiKey) : "not_requested"
      if (resetState === "sent") counts.resetEmailsSent += 1

      await doc.ref.set(
        {
          authMigrationState: "pending",
          authMigrationUpdatedAt: new Date().toISOString(),
          authMigrationError: resetState === "send_failed" ? "reset_email_failed" : null,
          authMigrationResetEmail: resetState,
        },
        { merge: true }
      )
    } catch (error) {
      counts.failed += 1
      failures.push({
        traineeId: doc.id,
        reason: typeof error?.code === "string" ? error.code : "unknown_error",
      })
      await doc.ref.set(
        {
          authMigrationState: "failed",
          authMigrationUpdatedAt: new Date().toISOString(),
          authMigrationError:
            typeof error?.code === "string" ? error.code : "unknown_error",
        },
        { merge: true }
      )
    }
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        scanned: counts.scanned,
        alreadyLinked: counts.alreadyLinked,
        eligible: counts.eligible,
        createdUsers: counts.createdUsers,
        existingUsers: counts.existingUsers,
        unverifiedExistingUsers: counts.unverifiedExistingUsers,
        disabledExistingUsers: counts.disabledExistingUsers,
        invalidEmails: counts.invalidEmails,
        duplicateEmails: counts.duplicateEmails,
        failed: counts.failed,
        resetEmailsSent: counts.resetEmailsSent,
        nextCursor: snapshot.docs.length === limit ? lastId : null,
        failures: failures.slice(0, 50),
      },
      null,
      2
    )
  )

  console.log(
    [
      "",
      "Next steps:",
      "1. Send password-reset/sign-in instructions through a trusted channel.",
      "2. The trainee signs in with email + password at /profile.",
      "3. On first verified sign-in they confirm their university ID once.",
      "4. Verify the trainee doc now has authUid and the trainee_auth_links entry.",
      "5. Re-run this script with --cursor to continue a large migration.",
    ].join("\n")
  )
}

main().catch((error) => {
  console.error("Trainee auth migration failed:", error?.message ?? "unknown error")
  process.exitCode = 1
})
