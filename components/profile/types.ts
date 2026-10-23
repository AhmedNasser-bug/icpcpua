import type { CodeforcesAccountView } from "@/lib/codeforces/status"
import type { ViewerStanding } from "@/lib/leaderboard-types"

interface TraineeSummary {
  universityId: string
  fullName: string
  track: string
  academicYear: string
  status: string
  pointsTotal: number
}

interface DashboardStandings {
  global: ViewerStanding | null
  track: ViewerStanding | null
}

export interface TraineeDashboard {
  success: true
  trainee: TraineeSummary
  codeforces: CodeforcesAccountView
  standings: DashboardStandings
}

export interface SyncResponse {
  success: boolean
  error?: string
  retryAfterSeconds?: number
  sync?: {
    ok: boolean
    syncedAt?: string
    error?: string
    skipped?: string
    code?: string
  }
  codeforces?: CodeforcesAccountView
  standings?: DashboardStandings
}
