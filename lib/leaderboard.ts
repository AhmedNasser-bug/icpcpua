import { FieldPath, type Query } from "firebase-admin/firestore"
import { adminDb } from "@/lib/firebase-admin"
import type { TraineeDocument } from "@/lib/firebase-schema"
import { toCodeforcesAccountView } from "@/lib/codeforces/status"
import type {
  LeaderboardMeta,
  LeaderboardResponse,
  LeaderboardSource,
  LeaderboardUser,
  ViewerStanding,
} from "@/lib/leaderboard-types"

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100
const MAX_PAGE = 10_000
const RANK_COLORS = ["#FFD500", "#E0E0E0", "#FF0055", "#00E5FF", "#7B2CBF"]

interface FallbackEntry {
  handle: string
  fullName: string
  rating: number
  maxRating: number
  solved: number
  pointsTotal: number
  track: string
  attendedSessionsCount?: number
  qrScansCount?: number
}

const FALLBACK_LEADERBOARD: FallbackEntry[] = [
  {
    handle: "algo_queen",
    fullName: "Nourhan Ezzat",
    rating: 2100,
    maxRating: 2180,
    solved: 540,
    pointsTotal: 1240,
    track: "level_2",
  },
  {
    handle: "byte_me",
    fullName: "Karim Mostafa",
    rating: 1850,
    maxRating: 1910,
    solved: 487,
    pointsTotal: 1050,
    track: "level_2",
  },
  {
    handle: "dp_master",
    fullName: "Youssef Tarek",
    rating: 1795,
    maxRating: 1830,
    solved: 412,
    pointsTotal: 960,
    track: "level_1",
  },
  {
    handle: "graph_wiz",
    fullName: "Salma Hany",
    rating: 1650,
    maxRating: 1700,
    solved: 389,
    pointsTotal: 840,
    track: "level_1",
  },
  {
    handle: "greedy_guy",
    fullName: "Omar Sherif",
    rating: 1540,
    maxRating: 1580,
    solved: 345,
    pointsTotal: 720,
    track: "level_1",
  },
]

function parsePositiveInt(
  raw: string | null,
  fallback: number,
  maximum: number
): number {
  const parsed = Number.parseInt(raw ?? "", 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(parsed, maximum)
}

export function parseLeaderboardPage(raw: string | null): number {
  return parsePositiveInt(raw, 1, MAX_PAGE)
}

export function parseLeaderboardPageSize(raw: string | null): number {
  return parsePositiveInt(raw, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
}

export function normalizeLeaderboardTrack(raw: string | null): string {
  const trimmed = raw?.trim()
  if (!trimmed || trimmed === "all") return "all"
  return trimmed
}

/** Competition ranking: equal scores share the best rank, then skip. */
export function assignCompetitionRanks(scores: number[], firstRank: number): number[] {
  const ranks: number[] = []
  let currentRank = firstRank

  scores.forEach((score, index) => {
    if (index > 0 && score !== scores[index - 1]) {
      currentRank = firstRank + index
    }
    ranks.push(currentRank)
  })

  return ranks
}

/**
 * Rank a page without loading every trainee. `firstGroupSize` is the global
 * size of the first score group, which keeps ranks stable when a page starts
 * in the middle of a tie. Later groups that start inside the page are fully
 * contained by it, so their in-page size is their global size.
 */
export function assignPageRanks(
  scores: number[],
  firstRank: number,
  firstGroupSize: number
): number[] {
  const ranks: number[] = []
  let currentRank = firstRank
  let firstGroup = true
  let groupEntriesInPage = 1

  scores.forEach((score, index) => {
    if (index === 0) {
      ranks.push(currentRank)
      return
    }

    if (score === scores[index - 1]) {
      groupEntriesInPage += 1
      ranks.push(currentRank)
      return
    }

    currentRank += firstGroup ? firstGroupSize : groupEntriesInPage
    firstGroup = false
    groupEntriesInPage = 1
    ranks.push(currentRank)
  })

  return ranks
}

function pointsOf(data: Partial<TraineeDocument>): number {
  return typeof data.pointsTotal === "number" && Number.isFinite(data.pointsTotal)
    ? data.pointsTotal
    : 0
}

function initialsOf(fullName: string | undefined): string {
  const initials = (fullName || "T")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
  return initials || "TR"
}

function displayHandle(data: Partial<TraineeDocument>, verifiedHandle: string | null): string {
  if (verifiedHandle) return `@${verifiedHandle}`
  const universityId = typeof data.universityId === "string" ? data.universityId : ""
  return `@user_${universityId.slice(-4) || "0000"}`
}

export function buildLeaderboardUser(
  data: Partial<TraineeDocument>,
  rank: number,
  globalIndex: number,
  viewerId?: string | null
): LeaderboardUser {
  const codeforces = toCodeforcesAccountView(data)
  const universityId = typeof data.universityId === "string" ? data.universityId : undefined

  return {
    rank,
    handle: displayHandle(data, codeforces.handle),
    codeforcesHandle: codeforces.handle,
    codeforcesUrl: codeforces.profileUrl,
    fullName: data.fullName,
    rating: codeforces.rating,
    maxRating: codeforces.maxRating,
    solved: codeforces.solvedCount,
    pointsTotal: pointsOf(data),
    track: data.track,
    initials: initialsOf(data.fullName),
    color: RANK_COLORS[globalIndex % RANK_COLORS.length],
    universityId,
    attendedSessionsCount:
      typeof data.attendedSessionsCount === "number" ? data.attendedSessionsCount : 0,
    qrScansCount: typeof data.qrScansCount === "number" ? data.qrScansCount : 0,
    lastSyncedAt: codeforces.lastSyncedAt,
    syncStatus: codeforces.syncStatus,
    stale: codeforces.stale,
    ...(viewerId && universityId === viewerId ? { isViewer: true } : {}),
  }
}

function fallbackEntries(
  track: string,
  page: number,
  pageSize: number,
  source: LeaderboardSource
): LeaderboardResponse {
  const filtered =
    track !== "all" ? FALLBACK_LEADERBOARD.filter((entry) => entry.track === track) : FALLBACK_LEADERBOARD

  const ranks = assignCompetitionRanks(
    filtered.map((entry) => entry.pointsTotal),
    1
  )
  const allEntries = filtered.map((entry, index) => {
    const codeforcesHandle = entry.handle
    return {
      rank: ranks[index]!,
      handle: entry.handle,
      codeforcesHandle,
      codeforcesUrl: `https://codeforces.com/profile/${encodeURIComponent(codeforcesHandle)}`,
      fullName: entry.fullName,
      rating: entry.rating,
      maxRating: entry.maxRating,
      solved: entry.solved,
      pointsTotal: entry.pointsTotal,
      track: entry.track,
      initials: initialsOf(entry.fullName),
      color: RANK_COLORS[index % RANK_COLORS.length],
      universityId: undefined,
      attendedSessionsCount: entry.attendedSessionsCount ?? 0,
      qrScansCount: entry.qrScansCount ?? 0,
      lastSyncedAt: null,
      syncStatus: "never" as const,
      stale: false,
    }
  })

  const offset = (page - 1) * pageSize
  const leaderboard = allEntries.slice(offset, offset + pageSize)
  const total = allEntries.length

  return {
    success: true,
    source,
    count: leaderboard.length,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    hasMore: offset + leaderboard.length < total,
    leaderboard,
    viewer: null,
    meta: meta(),
  }
}

function meta(): LeaderboardMeta {
  return {
    generatedAt: new Date().toISOString(),
    scoreRule: "pointsTotal",
    ranking: "competition",
    tieBreaker: "universityId",
  }
}

async function countQuery(query: Query): Promise<number> {
  const snapshot = await query.count().get()
  return snapshot.data().count
}

async function getTraineeStanding(
  universityId: string,
  track: string
): Promise<ViewerStanding | null> {
  if (!adminDb) return null

  const snapshot = await adminDb.collection("trainees").doc(universityId).get()
  if (!snapshot.exists) return null

  const data = snapshot.data() as TraineeDocument
  const codeforces = toCodeforcesAccountView(data)
  const pointsTotal = pointsOf(data)
  const activeQuery = adminDb.collection("trainees").where("status", "==", "active")
  const scopedQuery =
    track === "all" ? activeQuery : activeQuery.where("track", "==", track)
  const total = await countQuery(scopedQuery)

  const base = {
    universityId,
    fullName: data.fullName || "Trainee",
    track: data.track,
    pointsTotal,
    handle: displayHandle(data, codeforces.handle),
    codeforcesHandle: codeforces.handle,
    codeforcesUrl: codeforces.profileUrl,
    codeforcesLinked: codeforces.linked,
    rating: codeforces.rating,
    maxRating: codeforces.maxRating,
    solved: codeforces.solvedCount,
    lastSyncedAt: codeforces.lastSyncedAt,
    syncStatus: codeforces.syncStatus,
    stale: codeforces.stale,
    initials: initialsOf(data.fullName),
  }

  if (data.status !== "active") {
    return {
      ...base,
      eligible: false,
      reason: "inactive",
      rank: null,
      total,
      color: RANK_COLORS[0],
    }
  }

  if (track !== "all" && data.track !== track) {
    return {
      ...base,
      eligible: false,
      reason: "track",
      rank: null,
      total,
      color: RANK_COLORS[0],
    }
  }

  const higherCount = await countQuery(scopedQuery.where("pointsTotal", ">", pointsTotal))
  const rank = higherCount + 1

  return {
    ...base,
    eligible: true,
    reason: null,
    rank,
    total,
    color: RANK_COLORS[(rank - 1) % RANK_COLORS.length],
  }
}

export async function getTraineeStandings(
  universityId: string
): Promise<{ global: ViewerStanding | null; track: ViewerStanding | null }> {
  if (!adminDb) return { global: null, track: null }

  const snapshot = await adminDb.collection("trainees").doc(universityId).get()
  if (!snapshot.exists) return { global: null, track: null }

  const data = snapshot.data() as TraineeDocument
  const [global, track] = await Promise.all([
    getTraineeStanding(universityId, "all"),
    getTraineeStanding(universityId, data.track),
  ])

  return { global, track }
}

export async function getLeaderboard(options: {
  track: string
  page: number
  pageSize: number
  viewerId?: string | null
}): Promise<LeaderboardResponse> {
  const { track, page, pageSize, viewerId } = options

  if (!adminDb) {
    return fallbackEntries(track, page, pageSize, "local_cache")
  }

  const activeQuery = adminDb.collection("trainees").where("status", "==", "active")
  const activeCount = await countQuery(activeQuery)
  if (activeCount === 0) {
    const anyTrainee = await adminDb.collection("trainees").limit(1).get()
    if (anyTrainee.empty) {
      return fallbackEntries(track, page, pageSize, "seed_defaults")
    }

    const emptyViewer = viewerId ? await getTraineeStanding(viewerId, track) : null
    return {
      success: true,
      source: "firestore",
      count: 0,
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      hasMore: false,
      leaderboard: [],
      viewer: emptyViewer,
      meta: meta(),
    }
  }

  const scopedQuery = track === "all" ? activeQuery : activeQuery.where("track", "==", track)
  const total = track === "all" ? activeCount : await countQuery(scopedQuery)
  const offset = (page - 1) * pageSize
  const viewer = viewerId ? await getTraineeStanding(viewerId, track) : null

  if (total === 0 || offset >= total) {
    return {
      success: true,
      source: "firestore",
      count: 0,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasMore: false,
      leaderboard: [],
      viewer,
      meta: meta(),
    }
  }

  // Ranking uses the existing internal pointsTotal. Codeforces fields are
  // synchronized enrichment, never a replacement for the platform score.
  const snapshot = await scopedQuery
    .orderBy("pointsTotal", "desc")
    .orderBy(FieldPath.documentId(), "asc")
    .offset(offset)
    .limit(pageSize)
    .get()

  if (snapshot.empty) {
    return {
      success: true,
      source: "firestore",
      count: 0,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasMore: false,
      leaderboard: [],
      viewer,
      meta: meta(),
    }
  }

  const documents = snapshot.docs.map((doc) => doc.data() as TraineeDocument)
  const scores = documents.map(pointsOf)
  const firstScore = scores[0]!
  const [higherCount, atOrAboveCount] = await Promise.all([
    countQuery(scopedQuery.where("pointsTotal", ">", firstScore)),
    countQuery(scopedQuery.where("pointsTotal", ">=", firstScore)),
  ])
  const firstRank = higherCount + 1
  const firstGroupSize = atOrAboveCount - higherCount
  const ranks = assignPageRanks(scores, firstRank, firstGroupSize)

  const leaderboard = documents.map((data, index) =>
    buildLeaderboardUser(data, ranks[index]!, offset + index, viewerId)
  )

  return {
    success: true,
    source: "firestore",
    count: leaderboard.length,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    hasMore: offset + leaderboard.length < total,
    leaderboard,
    viewer,
    meta: meta(),
  }
}
