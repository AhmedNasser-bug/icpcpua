import { ChevronLeft, ChevronRight } from "lucide-react"

export function LeaderboardPagination({
  page,
  totalPages,
  total,
  onPageChange,
  disabled,
}: {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  disabled?: boolean
}) {
  if (totalPages <= 1) return null

  const previousDisabled = disabled || page <= 1
  const nextDisabled = disabled || page >= totalPages

  return (
    <nav
      aria-label="Leaderboard pages"
      className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-[3px] border-[#0F0F0F] bg-[#FFF4E0] px-4 py-3 shadow-solid-sm"
    >
      <span className="font-mono text-[11px] font-bold uppercase text-[#0F0F0F]">
        Page {page} of {totalPages} • {total} ranked cadets
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={previousDisabled}
          className="inline-flex items-center gap-1 bg-white border-[2px] border-[#0F0F0F] px-3 py-1.5 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#0F0F0F] disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous leaderboard page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Prev
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={nextDisabled}
          className="inline-flex items-center gap-1 bg-[#FFD500] border-[2px] border-[#0F0F0F] px-3 py-1.5 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#0F0F0F] disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next leaderboard page"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </nav>
  )
}
