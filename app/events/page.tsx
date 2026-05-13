"use client"

import { useState, useMemo } from "react"
import { PuaNavbar } from "@/components/pua-navbar"
import { Marquee } from "@/components/pua-marquee"

type EventType = "Bootcamp" | "Contest" | "Meetup"

interface CalendarEvent {
  day: number
  title: string
  type: EventType
  date: string
  time?: string
  location?: string
  description: string
  registration?: boolean
}

const EVENTS: CalendarEvent[] = [
  { day: 4, title: "Codeforces Round #888 (Div. 2)", type: "Contest", date: "OCT 04", time: "17:35 UTC+3", description: "Rated Codeforces round for all Div. 2 participants. Form a team or go solo.", registration: false },
  { day: 5, title: "Graph Theory Bootcamp - Day 1", type: "Bootcamp", date: "OCT 05", location: "Lab 402, Building C", description: "BFS, DFS, and shortest path foundations. Bring your laptop.", registration: true },
  { day: 6, title: "Graph Theory Bootcamp - Day 2", type: "Bootcamp", date: "OCT 06", location: "Lab 402, Building C", description: "Dijkstra, MST, and DSU heavy practice.", registration: true },
  { day: 13, title: "ECPC Qualifications", type: "Contest", date: "OCT 13", description: "Egyptian Collegiate Programming Contest qualifications. Registration required.", registration: true },
  { day: 18, title: "Team Meetup", type: "Meetup", date: "OCT 18", location: "Building C - Room 204", description: "Weekly team sync. Discuss contest strategies and problem sets.", registration: false },
]

const TYPE_COLORS: Record<EventType, string> = {
  Bootcamp: "bg-[#FF0055] text-white",
  Contest: "bg-[#FFD500] text-[#0F0F0F]",
  Meetup: "bg-[#7B2CBF] text-white",
}

const DAYS_OF_WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

// October 2023 starts on Sunday
const OCTOBER_OFFSET = 0
const OCTOBER_DAYS = 31

function EventDetailModal({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F0F0F]/70 p-4">
      <div className="relative bg-[#FFD500] border-[3px] border-[#0F0F0F] shadow-solid max-w-md w-full p-8 animate-slide-in">
        <span className="vector-node vector-node-tl" />
        <span className="vector-node vector-node-tr" />
        <span className="vector-node vector-node-bl" />
        <span className="vector-node vector-node-br" />
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className={`font-body text-xs font-bold uppercase px-3 py-1 border-[2px] border-[#0F0F0F] ${TYPE_COLORS[event.type]}`}>{event.type}</span>
            <h3 className="font-display text-2xl uppercase mt-3 text-[#0F0F0F]">{event.title}</h3>
          </div>
          <button onClick={onClose} className="border-[3px] border-[#0F0F0F] p-1 bg-white hover:bg-[#FF0055] hover:text-white transition-colors ml-4 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="bg-white border-[3px] border-[#0F0F0F] p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 font-body text-sm">
            <span className="font-bold uppercase">Date:</span>
            <span>{event.date}</span>
          </div>
          {event.time && (
            <div className="flex items-center gap-2 font-body text-sm">
              <span className="font-bold uppercase">Time:</span>
              <span>{event.time}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2 font-body text-sm">
              <span className="font-bold uppercase">Location:</span>
              <span>{event.location}</span>
            </div>
          )}
          <p className="font-body text-sm mt-2 pt-2 border-t-[2px] border-[#0F0F0F]">{event.description}</p>
        </div>
        {event.registration && (
          <button className="btn-solid mt-4 w-full bg-[#7B2CBF] text-white font-display text-lg uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-solid py-3">
            REGISTER NOW
          </button>
        )}
      </div>
    </div>
  )
}

export default function EventsPage() {
  const [activeFilter, setActiveFilter] = useState<EventType | "All">("All")
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [currentMonth] = useState({ month: "OCTOBER", year: "2023" })

  const filteredEvents = useMemo(() => {
    return activeFilter === "All"
      ? EVENTS
      : EVENTS.filter((e) => e.type === activeFilter)
  }, [activeFilter])

  const getDayEvents = (day: number) =>
    filteredEvents.filter((e) => e.day === day)

  const filters: Array<EventType | "All"> = ["All", "Bootcamp", "Contest", "Meetup"]
  const filterColors: Record<string, string> = {
    All: "bg-[#7B2CBF] text-white border-[#7B2CBF]",
    Bootcamp: "bg-[#FF0055] text-white border-[#FF0055]",
    Contest: "bg-[#FFD500] text-[#0F0F0F] border-[#FFD500]",
    Meetup: "bg-[#7B2CBF] text-white border-[#7B2CBF]",
  }

  // Build calendar grid cells (Oct 2023 starts Sunday = day 0)
  const totalCells = 42
  const cells: Array<number | null> = []
  for (let i = 0; i < OCTOBER_OFFSET; i++) cells.push(null)
  for (let d = 1; d <= OCTOBER_DAYS; d++) cells.push(d)
  while (cells.length < totalCells) cells.push(null)

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <PuaNavbar />

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
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`filter-pill shadow-solid-sm ${activeFilter === f ? filterColors[f] + " shadow-none translate-x-[4px] translate-y-[4px]" : "bg-[#FFF4E0] text-[#0F0F0F] border-[#0F0F0F] hover:bg-[#0F0F0F] hover:text-white"}`}
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
              <span className="vector-node vector-node-tl" />
              <span className="vector-node vector-node-tr" />
              <span className="vector-node vector-node-bl" />
              <span className="vector-node vector-node-br" />

              {/* Calendar header */}
              <div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-[#0F0F0F] bg-[#FFF4E0]">
                <button className="w-10 h-10 border-[3px] border-[#0F0F0F] bg-[#7B2CBF] text-white font-display text-lg shadow-solid-sm btn-solid flex items-center justify-center">
                  &#8249;
                </button>
                <h2 className="font-display text-2xl uppercase tracking-wider">
                  {currentMonth.month}{" "}
                  <span className="text-[#7B2CBF]">{currentMonth.year}</span>
                </h2>
                <button className="w-10 h-10 border-[3px] border-[#0F0F0F] bg-[#7B2CBF] text-white font-display text-lg shadow-solid-sm btn-solid flex items-center justify-center">
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
                  const isLastRow = i >= totalCells - 7
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
                    <span className="font-body text-[10px] font-bold uppercase bg-[#FFF4E0] border-[2px] border-[#0F0F0F] px-2 py-0.5">{ev.date}</span>
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

      <Marquee />
    </div>
  )
}
