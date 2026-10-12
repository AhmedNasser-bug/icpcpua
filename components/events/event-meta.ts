export type EventType = "Bootcamp" | "Contest" | "Meetup"

export interface CalendarEvent {
  date: string
  title: string
  type: EventType
  time?: string
  location?: string
  description: string
  registration?: boolean
}

export const TYPE_COLORS: Record<EventType, string> = {
  Bootcamp: "bg-[#FF0055] text-white",
  Contest: "bg-[#FFD500] text-[#0F0F0F]",
  Meetup: "bg-[#7B2CBF] text-white",
}

export const MONTH_NAMES = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
] as const

/**
 * Splits an ISO calendar date (`YYYY-MM-DD`) into numeric parts without going
 * through `Date`, so no timezone can shift the calendar day.
 */
export function getEventDateParts(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number)
  return { year, month: month - 1, day }
}

export function formatEventDate(isoDate: string) {
  const { month, day } = getEventDateParts(isoDate)
  return `${MONTH_NAMES[month].slice(0, 3)} ${String(day).padStart(2, "0")}`
}
