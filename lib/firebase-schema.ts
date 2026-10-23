export const ACADEMIC_YEARS = ["Year 1", "Year 2", "Year 3", "Year 4"] as const
type AcademicYear = (typeof ACADEMIC_YEARS)[number]

export const TRAINEE_TRACKS = ["level_1", "level_2"] as const
type TraineeTrack = (typeof TRAINEE_TRACKS)[number]

type TraineeStatus = "active" | "probation" | "graduated" | "inactive"

type AuthMigrationState = "pending" | "linked" | "failed" | "skipped"

export type CodeforcesSyncStatus = "never" | "success" | "failed"

export interface TraineeDocument {
  id: string
  fullName: string
  universityId: string
  email: string
  phone: string
  academicYear: AcademicYear
  track: TraineeTrack
  authUid?: string
  authEmail?: string | null
  authLinkedAt?: string | null
  authMigrationState?: AuthMigrationState
  authMigrationUpdatedAt?: string | null
  authClaimCodeHash?: string | null
  authClaimExpiresAt?: string | null
  codeforcesHandle: string
  codeforcesHandleLower?: string
  cfHandleVerified?: boolean
  status: TraineeStatus
  pointsTotal: number
  cfRating: number | null
  cfMaxRating?: number | null
  cfSolvedCount: number | null
  cfSolvedProblemKeys?: string[]
  cfLastSubmissionId?: number | null
  cfLastSyncedAt?: string | null
  cfSyncAttemptedAt?: string | null
  cfSyncStatus?: CodeforcesSyncStatus
  cfSyncError?: string | null
  cfNextSyncAt?: string | null
  attendedSessionsCount: number
  qrScansCount: number
  registeredAt: string
  updatedAt: string
}

export const POINT_EVENT_TYPES = [
  "registration_welcome",
  "qr_scan",
  "session_attendance",
  "cf_sync",
  "coach_bonus",
  "upsolve",
  "penalty",
] as const

export type PointEventType = (typeof POINT_EVENT_TYPES)[number]

export interface PointEventDocument {
  id: string
  traineeId: string
  universityId: string
  type: PointEventType
  points: number
  reason: string
  metadata?: {
    qrCodeId?: string
    sessionId?: string
    coachId?: string
    cfContestId?: number
    [key: string]: unknown
  }
  createdAt: string
}
