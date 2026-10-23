import type { CodeforcesSyncStatus } from "@/lib/firebase-schema"

export type LeaderboardTrack = "all" | "level_1" | "level_2"
export type LeaderboardSource = "firestore" | "seed_defaults" | "local_cache"

export interface LeaderboardUser {
  rank: number
  handle: string
  codeforcesHandle: string | null
  codeforcesUrl: string | null
  fullName?: string
  rating: number | null
  maxRating: number | null
  solved: number | null
  pointsTotal: number
  track?: string
  initials: string
  color: string
  universityId?: string
  attendedSessionsCount?: number
  qrScansCount?: number
  lastSyncedAt: string | null
  syncStatus: CodeforcesSyncStatus
  stale: boolean
  isViewer?: boolean
}

export interface ViewerStanding {
  eligible: boolean
  reason: "inactive" | "track" | null
  rank: number | null
  total: number | null
  universityId: string
  fullName: string
  track: string
  pointsTotal: number
  handle: string
  codeforcesHandle: string | null
  codeforcesUrl: string | null
  codeforcesLinked: boolean
  rating: number | null
  maxRating: number | null
  solved: number | null
  lastSyncedAt: string | null
  syncStatus: CodeforcesSyncStatus
  stale: boolean
  color: string
  initials: string
}

export interface LeaderboardMeta {
  generatedAt: string
  scoreRule: "pointsTotal"
  ranking: "competition"
  tieBreaker: "universityId"
}

export interface LeaderboardResponse {
  success: true
  source: LeaderboardSource
  count: number
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasMore: boolean
  leaderboard: LeaderboardUser[]
  viewer: ViewerStanding | null
  meta: LeaderboardMeta
}
