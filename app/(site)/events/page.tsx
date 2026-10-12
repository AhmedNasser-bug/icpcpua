"use client"

import { useState, useMemo } from "react"
import { VectorNodes } from "@/components/vector-nodes"
import {
  EventType,
  CalendarEvent,
  TYPE_COLORS,
  MONTH_NAMES,
  formatEventDate,
  getEventDateParts,
} from "@/components/events/event-meta"
import { EventDetailModal } from "@/components/events/event-detail-modal"

const EVENTS: CalendarEvent[] = [
  { date: "2023-10-04", title: "Codeforces Round #888 (Div. 2)", type: "Contest", time: "17:35 UTC+3", description: "Rated Codeforces round for all Div. 2 participants. Form a team or go solo.", registration: false },
  { date: "2023-10-05", title: "Graph Theory Bootcamp - Day 1", type: "Bootcamp", location: "Lab 402, Building C", description: "BFS, DFS, and shortest path foundations. Bring your laptop.", registration: true },
  { date: "2023-10-06", title: "Graph Theory Bootcamp - Day 2", type: "Bootcamp", location: "Lab 402, Building C", description: "Dijkstra, MST, and DSU heavy practice.", registration: true },
  { date: "2023-10-13", title: "ECPC Qualifications", type: "Contest", description: "Egyptian Collegiate Programming Contest qualifications. Registration required.", registration: true },
  { date: "2023-10-18", title: "Team Meetup", type: "Meetup", location: "Building C - Room 204", description: "Weekly team sync. Discuss contest strategies and problem sets.", registration: false },
]

const DAYS_OF_WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

const FILTERS: Array<EventType | "All"> = ["All", "Bootcamp", "Contest", "Meetup"]
const FILTER_COLORS: Record<EventType | "All", string> = {
  All: "bg-[#7B2CBF] text-white border-[#7B2CBF]",
  Bootcamp: "bg-[#FF0055] text-white border-[#FF0055]",
  Contest: "bg-[#FFD500] text-[#0F0F0F] border-[#FFD500]",
  Meetup: "bg-[#7B2CBF] text-white border-[#7B2CBF]",
}

// The Events & Training calendar opens on the season kickoff month.
const INITIAL_MONTH = { year: 2023, month: 9 } // October 2023 (0-indexed month)
const TOTAL_CELLS = 42

export default function EventsPage() {
  const [activeFilter, setActiveFilter] = useState<EventType | "All">("All")
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [currentMonth, setCurrentMonth] = useState(INITIAL_MONTH)

  const filteredEvents = useMemo(() => {
    return activeFilter === "All"
      ? EVENTS
      : EVENTS.filter((e) => e.type === activeFilter)
  }, [activeFilter])

  const { year, month } = currentMonth
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

  const getDayEvents = (day: number) =>
    filteredEvents.filter((e) => {
      const parts = getEventDateParts(e.date)
      return parts.year === year && parts.month === month && parts.day === day
    })

  const goToMonth = (offset: number) => {
    setCurrentMonth((prev) => {
      const next = new Date(Date.UTC(prev.year, prev.month + offset, 1))
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() }
    })
  }

  // Build the displayed month grid from its leading weekday offset and length.
  const cells: Array<number | null> = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length < TOTAL_CELLS) cells.push(null)

  return (
    <>
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-10 py-12">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="font-display text-[56px] leading-[0.9] text-[#0F0F0F] text-shadow-cyan uppercase">
              EVENTS &amp;<br />TRAINING
            </h1>
            <p className="font-body text-sm font-bold uppercase mt-3 text-[#0F0F0F]">
              BOOTCAMPS, CONTESTS, AND SUFFERING.
            </p>
          </div>
          {/* Filter pills */}
          <div className="flex flex-wrap gap-3">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`filter-pill shadow-solid-sm ${activeFilter === f ? FILTER_COLORS[f] + " shadow-none translate-x-[4px] translate-y-[4px]" : "bg-[#FFF4E0] text-[#0F0F0F] border-[#0F0F0F] hover:bg-[#0F0F0F] hover:text-white"}`}
              >
                {f === "All" ? "ALL SHEETS" : f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Main Layout: calendar left, sidebar right */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Calendar */}
          <div className="lg:w-[68%]">
            <div className="border-[3px] border-[#0F0F0F] shadow-solid relative">
              <VectorNodes />

              {/* Calendar header */}
              <div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-[#0F0F0F] bg-[#FFF4E0]">
                <button
                  type="button"
                  onClick={() => goToMonth(-1)}
                  aria-label="Previous month"
                  className="w-10 h-10 border-[3px] border-[#0F0F0F] bg-[#7B2CBF] text-white font-display text-lg shadow-solid-sm btn-solid flex items-center justify-center"
                >
                  &#8249;
                </button>
                <h2 className="font-display text-2xl uppercase tracking-wider">
                  {MONTH_NAMES[month]}{" "}
                  <span className="text-[#7B2CBF]">{year}</span>
                </h2>
                <button
                  type="button"
                  onClick={() => goToMonth(1)}
                  aria-label="Next month"
                  className="w-10 h-10 border-[3px] border-[#0F0F0F] bg-[#7B2CBF] text-white font-display text-lg shadow-solid-sm btn-solid flex items-center justify-center"
                >
                  &#8250;
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7">
                {DAYS_OF_WEEK.map((d) => (
                  <div
                    key={d}
                    className={`border-b-[3px] border-r-[3px] border-[#0F0F0F] last:border-r-0 py-2 text-center font-body text-xs font-bold uppercase ${d === "SUN" || d === "SAT" ? "bg-[#FFD500]" : "bg-[#FFF4E0]"}`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                  const dayEvents = day ? getDayEvents(day) : []
                  const isLastRow = i >= TOTAL_CELLS - 7
                  const isLastCol = (i + 1) % 7 === 0
                  return (
                    <div
                      key={i}
                      className={`calendar-cell relative min-h-[90px] border-b-[3px] border-r-[3px] border-[#0F0F0F] p-1 transition-colors cursor-default
                        ${!day ? "bg-[#E0E0E0]/40" : "bg-[#FFF4E0]"}
                        ${isLastRow ? "border-b-0" : ""}
                        ${isLastCol ? "border-r-0" : ""}
                      `}
                    >
                      {day && (
                        <>
                          <span className="vector-node vector-node-tl" style={{ width: 8, height: 8, top: -4, left: -4 }} />
                          <span className="font-body text-xs font-bold text-[#0F0F0F] block mb-1 pl-1">{day}</span>
                          <div className="flex flex-col gap-1">
                            {dayEvents.map((ev, ei) => (
                              <button
                                key={ei}
                                onClick={() => setSelectedEvent(ev)}
                                className={`text-left font-body text-[9px] font-bold uppercase px-1 py-0.5 border-[1.5px] border-[#0F0F0F] truncate w-full ${TYPE_COLORS[ev.type]} hover:scale-105 transition-transform`}
                              >
                                {ev.title.length > 12 ? ev.title.slice(0, 12) + "…" : ev.title}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sidebar: Upcoming events */}
          <div className="lg:w-[32%] flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-[#FFD500] border-[3px] border-[#0F0F0F] flex items-center justify-center font-display text-lg">
                &#9889;
              </div>
              <h3 className="font-display text-2xl uppercase text-[#0F0F0F] border-b-[3px] border-[#0F0F0F] pb-1">UPCOMING</h3>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="border-[3px] border-[#0F0F0F] bg-[#FFD500] shadow-solid p-6 text-center relative">
                <span className="vector-node vector-node-tl" />
                <span className="vector-node vector-node-br" />
                <p className="font-display text-xl uppercase">NO EVENTS.<br />GO SOLVE LEETCODE.</p>
              </div>
            ) : (
              filteredEvents.map((ev, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedEvent(ev)}
                  className="text-left border-[3px] border-[#0F0F0F] shadow-solid-sm relative p-4 hover:-translate-y-1 transition-transform duration-150 bg-[#00E5FF]"
                >
                  <span className="vector-node vector-node-tl" />
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-body text-[10px] font-bold uppercase bg-[#FFF4E0] border-[2px] border-[#0F0F0F] px-2 py-0.5">{formatEventDate(ev.date)}</span>
                    <span className={`font-body text-[10px] font-bold uppercase px-2 py-0.5 border-[2px] border-[#0F0F0F] ${TYPE_COLORS[ev.type]}`}>{ev.type}</span>
                  </div>
                  <h4 className="font-display text-lg uppercase text-[#0F0F0F] leading-tight">{ev.title}</h4>
                  {ev.time && (
                    <p className="font-body text-xs text-[#0F0F0F] mt-1">&#9679; {ev.time}</p>
                  )}
                  {ev.location && (
                    <p className="font-body text-xs text-[#0F0F0F] mt-0.5">&#128204; {ev.location}</p>
                  )}
                  {ev.registration && (
                    <span className="inline-block mt-2 font-body text-[10px] font-bold uppercase bg-white border-[2px] border-[#0F0F0F] px-2 py-0.5">
                      Registration Required
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  )
}
