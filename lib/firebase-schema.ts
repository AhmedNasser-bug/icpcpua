type AcademicYear = "Year 1" | "Year 2" | "Year 3" | "Year 4"
type TraineeTrack = "level_1" | "level_2"
type TraineeStatus = "active" | "probation" | "graduated" | "inactive"

export interface TraineeDocument {
  id: string
  fullName: string
  universityId: string
  email: string
  phone: string
  academicYear: AcademicYear
  track: TraineeTrack
  codeforcesHandle: string
  status: TraineeStatus
  pointsTotal: number
  cfRating: number
  cfSolvedCount: number
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
