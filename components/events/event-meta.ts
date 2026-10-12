export type EventType = "Bootcamp" | "Contest" | "Meetup"

export interface CalendarEvent {
  day: number
  title: string
  type: EventType
  date: string
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
