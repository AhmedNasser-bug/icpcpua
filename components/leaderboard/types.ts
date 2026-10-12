export interface LeaderboardUser {
  rank: number
  handle: string
  fullName?: string
  rating: number
  solved: number
  pointsTotal: number
  track?: string
  initials: string
  color: string
  attendedSessionsCount?: number
  qrScansCount?: number
}
