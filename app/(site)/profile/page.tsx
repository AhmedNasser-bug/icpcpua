"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AlertCircle, Loader2, LogOut, RefreshCw, ShieldCheck, Trophy } from "lucide-react"
import { CodeforcesAccountPanel } from "@/components/profile/codeforces-panel"
import { PersonalStandingsPanel } from "@/components/profile/standings-panel"
import { TraineeSignInForm } from "@/components/profile/sign-in-form"
import type { TraineeDashboard } from "@/components/profile/types"
import { signOutFirebase } from "@/lib/firebase/client"

type PageState =
  | { status: "loading" }
  | { status: "signed_out"; message?: string }
  | { status: "error"; message: string }
  | { status: "ready"; dashboard: TraineeDashboard }

const TRACK_NAMES: Record<string, string> = {
  level_1: "Level 1",
  level_2: "Level 2",
}

export default function ProfilePage() {
  const [state, setState] = useState<PageState>({ status: "loading" })
  const [signingOut, setSigningOut] = useState(false)
  const autoSyncStarted = useRef(false)

  const loadDashboard = useCallback(async () => {
    try {
      const response = await fetch("/api/trainees/codeforces", {
        credentials: "same-origin",
        cache: "no-store",
      })
      const data = await response.json()

      if (response.status === 401) {
        setState({ status: "signed_out" })
        return
      }

      if (response.status === 503 && data.simulated) {
        setState({ status: "signed_out", message: data.error })
        return
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not load your cadet profile.")
      }

      setState({ status: "ready", dashboard: data as TraineeDashboard })
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Could not load your cadet profile.",
      })
    }
  }, [])

  // The dashboard is loaded from the API after hydration and the automatic
  // sync runs once the persisted freshness metadata is available.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    if (state.status !== "ready" || autoSyncStarted.current) return

    const account = state.dashboard.codeforces
    const dueAt = account.nextSyncAt ? Date.parse(account.nextSyncAt) : Number.NaN
    const isDue = !Number.isFinite(dueAt) || dueAt <= Date.now()
    const needsSync =
      account.linked && isDue && (account.syncStatus !== "success" || account.stale)

    if (!needsSync) return

    autoSyncStarted.current = true
    const run = async () => {
      try {
        await fetch("/api/trainees/codeforces/sync", {
          method: "POST",
          credentials: "same-origin",
        })
      } catch {
        // The account panel shows the persisted, user-safe failure state.
      } finally {
        await loadDashboard()
      }
    }
    void run()
  }, [state, loadDashboard])
  /* eslint-enable react-hooks/set-state-in-effect */

  const signOut = async () => {
    setSigningOut(true)
    try {
      await fetch("/api/trainees/session", {
        method: "DELETE",
        credentials: "same-origin",
      })
      await signOutFirebase()
    } catch {
      // The server cookie is cleared even if Firebase client sign-out fails.
    } finally {
      setState({ status: "signed_out" })
      setSigningOut(false)
    }
  }

  const trackName =
    state.status === "ready" ? TRACK_NAMES[state.dashboard.trainee.track] ?? "Track" : "Track"

  return (
    <div className="flex-grow bg-[#FFFDF9]">
      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-2 inline-flex items-center gap-2 border-[2px] border-[#0F0F0F] bg-[#7B2CBF] px-3 py-1 font-mono text-xs font-bold uppercase text-white shadow-[3px_3px_0px_#0F0F0F]">
              <ShieldCheck className="h-4 w-4 text-[#FFD500]" />
              CADET CONTROL PANEL
            </span>
            <h1 className="font-display text-4xl uppercase leading-none text-[#0F0F0F] sm:text-5xl">
              MY PROFILE
            </h1>
            <p className="mt-2 font-mono text-xs text-neutral-700">
              Link a Codeforces account, control synchronization and see your live leaderboard
              position.
            </p>
          </div>
          <Link
            href="/leaderboard"
            className="inline-flex shrink-0 items-center gap-2 border-[2px] border-[#0F0F0F] bg-[#FFD500] px-4 py-2 font-display text-xs uppercase tracking-wider shadow-[3px_3px_0px_#0F0F0F] hover:bg-white"
          >
            <Trophy className="h-4 w-4" />
            Open leaderboard
          </Link>
        </div>

        {state.status === "loading" && (
          <div
            role="status"
            className="flex items-center gap-3 border-[3px] border-[#0F0F0F] bg-white p-6 font-mono text-sm uppercase shadow-solid-sm"
          >
            <Loader2 className="h-5 w-5 animate-spin text-[#7B2CBF]" />
            Loading cadet record...
          </div>
        )}

        {state.status === "signed_out" && (
          <div className="space-y-4">
            {state.message && (
              <div className="flex items-start gap-2 border-[2px] border-[#0F0F0F] bg-[#FFD500] p-3 font-mono text-xs">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{state.message}</span>
              </div>
            )}
            <TraineeSignInForm onSignedIn={loadDashboard} />
          </div>
        )}

        {state.status === "error" && (
          <div className="border-[3px] border-[#FF0055] bg-red-100 p-5 shadow-solid-sm">
            <div className="flex items-start gap-2 font-mono text-sm text-[#FF0055]">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{state.message}</span>
            </div>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="mt-3 inline-flex items-center gap-2 border-[2px] border-[#0F0F0F] bg-white px-3 py-2 font-mono text-xs font-bold uppercase"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}

        {state.status === "ready" && (
          <div className="space-y-6">
            <section className="relative border-[3px] border-[#0F0F0F] bg-[#FFF4E0] p-5 shadow-solid sm:p-6">
              <span className="vector-node vector-node-tl" />
              <span className="vector-node vector-node-br" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-[11px] font-bold uppercase text-[#7B2CBF]">
                    {state.dashboard.trainee.status === "active"
                      ? "ACTIVE CADET"
                      : state.dashboard.trainee.status.toUpperCase()}
                  </p>
                  <h2 className="font-display text-2xl uppercase text-[#0F0F0F]">
                    {state.dashboard.trainee.fullName}
                  </h2>
                  <p className="font-mono text-xs text-neutral-700">
                    Uni ID: {state.dashboard.trainee.universityId} • {trackName} •{" "}
                    {state.dashboard.trainee.pointsTotal} PTS
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  disabled={signingOut}
                  className="inline-flex items-center gap-2 self-start border-[2px] border-[#0F0F0F] bg-white px-3 py-2 font-mono text-xs font-bold uppercase hover:bg-[#E0E0E0] disabled:opacity-50"
                >
                  {signingOut ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5" />
                  )}
                  Sign out
                </button>
              </div>
            </section>

            <PersonalStandingsPanel
              global={state.dashboard.standings.global}
              track={state.dashboard.standings.track}
              trackName={trackName}
            />

            <CodeforcesAccountPanel
              account={state.dashboard.codeforces}
              onChanged={loadDashboard}
            />

            <p className="font-mono text-[10px] text-neutral-600">
              Leaderboard score and rank use the existing internal points ledger. Codeforces
              rating, maximum rating and distinct solved counts are synchronized from the official
              Codeforces API and shown for information only.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
