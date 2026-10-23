import type { TraineeDocument } from "@/lib/firebase-schema"
import { toCodeforcesAccountView, type CodeforcesAccountView } from "@/lib/codeforces/status"

export interface TraineeSummary {
  universityId: string
  fullName: string
  track: string
  academicYear: string
  status: string
  pointsTotal: number
}

export interface TraineeDashboard {
  trainee: TraineeSummary
  codeforces: CodeforcesAccountView
}

export function toTraineeSummary(data: Partial<TraineeDocument>): TraineeSummary {
  return {
    universityId: typeof data.universityId === "string" ? data.universityId : "",
    fullName: typeof data.fullName === "string" ? data.fullName : "Trainee",
    track: typeof data.track === "string" ? data.track : "level_1",
    academicYear: typeof data.academicYear === "string" ? data.academicYear : "",
    status: typeof data.status === "string" ? data.status : "inactive",
    pointsTotal:
      typeof data.pointsTotal === "number" && Number.isFinite(data.pointsTotal)
        ? data.pointsTotal
        : 0,
  }
}

export function toTraineeDashboard(data: Partial<TraineeDocument>): TraineeDashboard {
  return {
    trainee: toTraineeSummary(data),
    codeforces: toCodeforcesAccountView(data),
  }
}
