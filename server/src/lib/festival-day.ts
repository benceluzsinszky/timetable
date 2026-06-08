export const FESTIVAL_DAYS = [
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
  'Monday',
] as const

export type FestivalDay = (typeof FESTIVAL_DAYS)[number]

const DAY_START_DATES: Record<FestivalDay, string> = {
  Wednesday: '2026-06-17',
  Thursday: '2026-06-18',
  Friday: '2026-06-19',
  Saturday: '2026-06-20',
  Sunday: '2026-06-21',
  Monday: '2026-06-22',
}

export const FESTIVAL_DAY_START_HOUR = 9
export const FESTIVAL_TIMEZONE = 'Europe/Budapest'

// DAAD runs in June — Hungary is on CEST (UTC+2) for the whole festival.
const FESTIVAL_UTC_OFFSET = '+02:00'

export function parseFestivalDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${FESTIVAL_UTC_OFFSET}`)
}

export function getFestivalDayWindow(day: string): { start: Date; end: Date } {
  const date = DAY_START_DATES[day as FestivalDay]
  if (!date) {
    throw new Error(`Unknown festival day: ${day}`)
  }

  const start = parseFestivalDateTime(
    date,
    String(FESTIVAL_DAY_START_HOUR).padStart(2, '0') + ':00',
  )
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)

  return { start, end }
}

export function getFestivalDayForTime(time: Date): FestivalDay | null {
  for (const day of FESTIVAL_DAYS) {
    const { start, end } = getFestivalDayWindow(day)
    if (time >= start && time < end) {
      return day
    }
  }

  return null
}

export function isWithinFestivalDay(time: Date, day: string): boolean {
  const { start, end } = getFestivalDayWindow(day)
  return time >= start && time < end
}
