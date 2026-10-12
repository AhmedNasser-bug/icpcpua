import Link from "next/link"
import { VectorNodes } from "@/components/vector-nodes"
import { CalendarEvent, TYPE_COLORS, formatEventDate } from "./event-meta"

export function EventDetailModal({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F0F0F]/70 p-4">
      <div className="relative bg-[#FFD500] border-[3px] border-[#0F0F0F] shadow-solid max-w-md w-full p-8 animate-slide-in">
        <VectorNodes />
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
            <span>{formatEventDate(event.date)}</span>
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
          <Link
            href="/join"
            className="btn-solid mt-4 w-full bg-[#7B2CBF] text-white font-display text-lg uppercase tracking-wider border-[3px] border-[#0F0F0F] shadow-solid py-3 text-center block"
          >
            REGISTER NOW
          </Link>
        )}
      </div>
    </div>
  )
}
