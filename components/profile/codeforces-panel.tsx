"use client"

import { useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Link2,
  Loader2,
  RefreshCw,
  TriangleAlert,
  Unlink,
} from "lucide-react"
import type { CodeforcesAccountView } from "@/lib/codeforces/status"
import type { SyncResponse } from "./types"

function statValue(value: number | string | null, verified: boolean): string {
  if (value === null) return verified ? "Unrated" : "—"
  return String(value)
}

function dateLabel(value: string | null): string {
  if (!value) return "Never"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "Unknown" : parsed.toLocaleString()
}

export function CodeforcesAccountPanel({
  account,
  onChanged,
}: {
  account: CodeforcesAccountView
  onChanged: () => Promise<void> | void
}) {
  const [mode, setMode] = useState<"idle" | "link" | "change" | "disconnect">("idle")
  const [handle, setHandle] = useState("")
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null)

  const currentHandle = account.handle ?? account.pendingHandle

  const linkHandle = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setFeedback(null)
    try {
      const response = await fetch("/api/trainees/codeforces", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ handle: handle.trim() }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not link the Codeforces account.")
      }

      setHandle("")
      setMode("idle")
      if (data.sync && data.sync.ok === false) {
        setFeedback({
          tone: "error",
          text: `Handle linked, but synchronization failed: ${data.sync.error || "unknown error"}`,
        })
      } else {
        setFeedback({ tone: "ok", text: "Codeforces account linked and synchronized." })
      }
      await onChanged()
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not link the Codeforces account.",
      })
    } finally {
      setBusy(false)
    }
  }

  const refresh = async () => {
    setBusy(true)
    setFeedback(null)
    try {
      const response = await fetch("/api/trainees/codeforces/sync", {
        method: "POST",
        credentials: "same-origin",
      })
      const data = (await response.json()) as SyncResponse
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not refresh Codeforces data.")
      }
      if (data.sync && data.sync.ok === false) {
        setFeedback({
          tone: "error",
          text: data.sync.error || "Synchronization failed. Last valid data was kept.",
        })
      } else {
        setFeedback({
          tone: "ok",
          text: `Synchronized successfully at ${dateLabel(data.sync?.syncedAt ?? null)}.`,
        })
      }
      await onChanged()
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not refresh Codeforces data.",
      })
    } finally {
      setBusy(false)
    }
  }

  const disconnect = async () => {
    setBusy(true)
    setFeedback(null)
    try {
      const response = await fetch("/api/trainees/codeforces", {
        method: "DELETE",
        credentials: "same-origin",
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not disconnect the Codeforces account.")
      }
      setMode("idle")
      setFeedback({ tone: "ok", text: "Codeforces account disconnected." })
      await onChanged()
    } catch (error) {
      setFeedback({
        tone: "error",
        text:
          error instanceof Error ? error.message : "Could not disconnect the Codeforces account.",
      })
    } finally {
      setBusy(false)
    }
  }

  const showLinkForm = !account.linked || mode === "link" || mode === "change"

  return (
    <section
      aria-labelledby="codeforces-heading"
      className="relative border-[3px] border-[#0F0F0F] bg-white p-5 shadow-solid sm:p-6"
    >
      <span className="vector-node vector-node-tl" />
      <span className="vector-node vector-node-br" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-[#7B2CBF]" />
          <h2 id="codeforces-heading" className="font-display text-xl uppercase text-[#0F0F0F]">
            Codeforces uplink
          </h2>
        </div>
        {account.linked && (
          <span
            className={`border-[2px] border-[#0F0F0F] px-2 py-1 font-mono text-[10px] font-bold uppercase ${
              account.verified ? "bg-[#00E5FF]" : "bg-[#FFD500]"
            }`}
          >
            {account.verified ? "Handle verified" : "Pending verification"}
          </span>
        )}
      </div>

      {feedback && (
        <div
          role={feedback.tone === "error" ? "alert" : "status"}
          className={`mb-4 flex items-start gap-2 border-[2px] p-3 font-mono text-xs ${
            feedback.tone === "error"
              ? "border-[#FF0055] bg-red-100 text-[#FF0055]"
              : "border-[#0F0F0F] bg-[#00E5FF] text-[#0F0F0F]"
          }`}
        >
          {feedback.tone === "error" ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {account.linked && (
        <div className="mb-4 border-[2px] border-[#0F0F0F] bg-[#FFF4E0] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-lg uppercase text-[#0F0F0F]">
              @{currentHandle}
            </span>
            {account.profileUrl && (
              <a
                href={account.profileUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase underline text-[#7B2CBF] hover:text-[#FF0055]"
              >
                Public profile
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          {!account.verified && (
            <p className="mt-1 font-mono text-[11px] text-neutral-700">
              This handle is stored but has not been confirmed by Codeforces yet. Run a refresh to
              validate it.
            </p>
          )}
          {account.verified && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="border-[2px] border-[#0F0F0F] bg-white p-2">
                <p className="font-mono text-[9px] uppercase text-neutral-600">Rating</p>
                <p className="font-display text-lg text-[#0F0F0F]">
                  {statValue(account.rating, true)}
                </p>
              </div>
              <div className="border-[2px] border-[#0F0F0F] bg-white p-2">
                <p className="font-mono text-[9px] uppercase text-neutral-600">Max rating</p>
                <p className="font-display text-lg text-[#0F0F0F]">
                  {statValue(account.maxRating, true)}
                </p>
              </div>
              <div className="border-[2px] border-[#0F0F0F] bg-white p-2">
                <p className="font-mono text-[9px] uppercase text-neutral-600">Distinct solved</p>
                <p className="font-display text-lg text-[#0F0F0F]">
                  {statValue(account.solvedCount, account.lastSyncedAt !== null)}
                </p>
              </div>
              <div className="border-[2px] border-[#0F0F0F] bg-white p-2">
                <p className="font-mono text-[9px] uppercase text-neutral-600">Last synced</p>
                <p className="font-mono text-[11px] font-bold text-[#0F0F0F]">
                  {dateLabel(account.lastSyncedAt)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {account.syncError && (
        <div className="mb-4 flex items-start gap-2 border-[2px] border-[#FF0055] bg-red-100 p-3 font-mono text-xs text-[#FF0055]">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {account.syncError}
            {account.lastSyncedAt ? " The last valid data is still displayed." : ""}
          </span>
        </div>
      )}

      {account.stale && account.verified && (
        <div className="mb-4 border-[2px] border-[#0F0F0F] bg-[#FFD500] p-3 font-mono text-xs font-bold uppercase">
          This data is stale. Refresh to synchronize the latest Codeforces record.
        </div>
      )}

      {showLinkForm ? (
        <form onSubmit={linkHandle} className="mt-2">
          <label className="block">
            <span className="mb-1.5 block font-body text-xs font-bold uppercase tracking-widest">
              {account.linked ? "New Codeforces handle" : "Codeforces handle"}
            </span>
            <input
              required
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              placeholder="e.g. tourist"
              className="w-full border-[3px] border-[#0F0F0F] bg-white px-4 py-3 font-body text-sm font-bold focus:outline-none focus:border-[#7B2CBF]"
              autoComplete="off"
            />
          </label>
          <p className="mt-1 font-mono text-[10px] text-neutral-600">
            The handle is validated with the official Codeforces user.info API before it is
            linked.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy}
              className="btn-solid inline-flex items-center gap-2 border-[3px] border-[#0F0F0F] bg-[#7B2CBF] px-4 py-2 font-display text-sm uppercase tracking-wider text-white shadow-[3px_3px_0px_#0F0F0F] hover:bg-[#FF0055] disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              {busy ? "Validating..." : account.linked ? "Update handle" : "Connect account"}
            </button>
            {account.linked && (
              <button
                type="button"
                onClick={() => {
                  setMode("idle")
                  setHandle("")
                  setFeedback(null)
                }}
                className="border-[2px] border-[#0F0F0F] bg-white px-4 py-2 font-mono text-xs font-bold uppercase hover:bg-[#FFF4E0]"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={busy}
            className="inline-flex items-center gap-2 border-[2px] border-[#0F0F0F] bg-[#FFD500] px-3 py-2 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#0F0F0F] hover:bg-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
            {account.verified ? "Refresh data" : "Verify now"}
          </button>
          <button
            type="button"
            onClick={() => {
              setHandle(currentHandle ?? "")
              setMode("change")
              setFeedback(null)
            }}
            disabled={busy}
            className="inline-flex items-center gap-2 border-[2px] border-[#0F0F0F] bg-white px-3 py-2 font-mono text-xs font-bold uppercase hover:bg-[#FFF4E0] disabled:opacity-50"
          >
            <Link2 className="h-3.5 w-3.5" />
            Change handle
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("disconnect")
              setFeedback(null)
            }}
            disabled={busy}
            className="inline-flex items-center gap-2 border-[2px] border-[#0F0F0F] bg-white px-3 py-2 font-mono text-xs font-bold uppercase text-[#FF0055] hover:bg-red-50 disabled:opacity-50"
          >
            <Unlink className="h-3.5 w-3.5" />
            Disconnect
          </button>
        </div>
      )}

      {mode === "disconnect" && (
        <div className="mt-4 border-[2px] border-[#FF0055] bg-red-50 p-3">
          <p className="font-mono text-xs font-bold uppercase text-[#FF0055]">
            Disconnect @{currentHandle}? Ratings and solved counts will be cleared. Your internal
            points are not affected.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={disconnect}
              disabled={busy}
              className="inline-flex items-center gap-1 border-[2px] border-[#0F0F0F] bg-[#FF0055] px-3 py-1.5 font-mono text-xs font-bold uppercase text-white disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Confirm disconnect
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="border-[2px] border-[#0F0F0F] bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase"
            >
              Keep account
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
