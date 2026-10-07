export type AcademicYear = "Year 1" | "Year 2" | "Year 3" | "Year 4"
export type TraineeTrack = "level_1" | "level_2"
export type TraineeStatus = "active" | "probation" | "graduated" | "inactive"

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

export type PointEventType =
  | "registration_welcome"
  | "qr_scan"
  | "session_attendance"
  | "cf_sync"
  | "coach_bonus"
  | "upsolve"
  | "penalty"

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
    [key: string]: any
  }
  createdAt: string
}

export type CommitteeType =
  | "executive"
  | "instructing"
  | "hr_monitoring"
  | "ops_pr"
  | "marketing"
  | "design_dev"

export interface CommitteeApplicationDocument {
  id: string
  traineeId?: string
  fullName: string
  universityId: string
  email: string
  phone: string
  committee: CommitteeType
  roleApplied: string
  cvOrPortfolioUrl?: string
  answers: Record<string, string>
  status: "applied" | "screening" | "interviewed" | "accepted" | "rejected" | "pool"
  createdAt: string
  updatedAt: string
}

export interface HRRecordDocument {
  id: string
  targetMemberId: string
  committee: string
  recordType: "strike" | "delay_notice" | "cooldown_24h" | "burnout_check" | "commendation"
  details: string
  issuedByHrId: string
  status: "active" | "resolved" | "appealed"
  validUntil?: string
  createdAt: string
}
