import {
  FESTIVAL_DAYS,
  getFestivalDayForTime,
  getFestivalDayWindow,
} from '@timetable/server/festival-day'

export type TimetableEvent = {
  id: string
  artist: string
  stage: string
  festivalDay: string
  startTime: string | Date
  endTime: string | Date
  notes: string | null
  favourites?: { id: string }[] | false
}

export type TimeMarker = {
  time: number
  topPx: number
}

export type EventPlacement = {
  topPx: number
  heightPx: number
}

const STAGE_ORDER = [
  'DAAD Stage',
  'The Dome',
  'Dragon Nest',
  'Cooking Groove',
  'AM/Beach',
]

export const PX_PER_MINUTE = 0.85
const MIN_TIMELINE_HEIGHT_PX = 180
const MIN_EVENT_HEIGHT_PX = 32
export const MIN_TWO_LINE_EVENT_HEIGHT_PX = 50
const HOUR_MS = 60 * 60 * 1000

export function sortStages(stages: string[]): string[] {
  return [...stages].sort((a, b) => {
    const aIndex = STAGE_ORDER.indexOf(a)
    const bIndex = STAGE_ORDER.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })
}

type TimelineRangeOptions = {
  trimStart?: boolean
  trimEnd?: boolean
}

export function getFestivalDayTimelineRange(
  day: string,
  events: TimetableEvent[] = [],
  options: TimelineRangeOptions = {},
) {
  const { start, end } = getFestivalDayWindow(day)
  let rangeStart = start.getTime()
  let rangeEnd = end.getTime()

  if (events.length > 0) {
    const starts = events.map((event) => new Date(event.startTime).getTime())
    const ends = events.map((event) => new Date(event.endTime).getTime())

    if (options.trimStart) {
      rangeStart = Math.max(rangeStart, Math.min(...starts))
    }

    if (options.trimEnd) {
      rangeEnd = Math.min(rangeEnd, Math.max(...ends))
    }
  }

  return {
    rangeStart,
    rangeEnd,
    durationMs: Math.max(rangeEnd - rangeStart, 1),
  }
}

export function timelineHeightPx(durationMs: number): number {
  const minutes = durationMs / 60_000
  return Math.max(MIN_TIMELINE_HEIGHT_PX, minutes * PX_PER_MINUTE)
}

export function eventPlacement(
  event: TimetableEvent,
  rangeStart: number,
  durationMs: number,
  timelineHeight: number,
): EventPlacement {
  const start = new Date(event.startTime).getTime()
  const end = new Date(event.endTime).getTime()
  const topPx = ((start - rangeStart) / durationMs) * timelineHeight
  const rawHeightPx = ((end - start) / durationMs) * timelineHeight

  const eventDurationMs = Math.max(end - start, 1)
  const oneHourMs = 60 * 60 * 1000

  return {
    topPx,
    heightPx: Math.max(
      MIN_EVENT_HEIGHT_PX,
      rawHeightPx,
      eventDurationMs >= oneHourMs
        ? MIN_TWO_LINE_EVENT_HEIGHT_PX
        : MIN_EVENT_HEIGHT_PX,
    ),
  }
}

type TimeMarkerOptions = {
  hideStart?: boolean
  hideEnd?: boolean
}

export function buildTimeMarkers(
  rangeStart: number,
  rangeEnd: number,
  durationMs: number,
  timelineHeight: number,
  options: TimeMarkerOptions = {},
): TimeMarker[] {
  const markers: TimeMarker[] = []
  const firstMarker = new Date(rangeStart)
  firstMarker.setMinutes(0, 0, 0)

  let current = firstMarker.getTime()
  if (current < rangeStart) {
    current += HOUR_MS
  }

  while (current <= rangeEnd) {
    const isStart = current === rangeStart
    const isEnd = current === rangeEnd

    if (!(options.hideStart && isStart) && !(options.hideEnd && isEnd)) {
      markers.push({
        time: current,
        topPx: ((current - rangeStart) / durationMs) * timelineHeight,
      })
    }

    current += HOUR_MS
  }

  return markers
}

export function eventsForStage(
  events: TimetableEvent[],
  stage: string,
): TimetableEvent[] {
  return events.filter((event) => event.stage === stage)
}

export function groupEventsByDay(
  events: TimetableEvent[],
): Map<string, TimetableEvent[]> {
  const groups = new Map<string, TimetableEvent[]>(
    FESTIVAL_DAYS.map((day) => [day, []]),
  )

  for (const event of events) {
    const day = getFestivalDayForTime(new Date(event.startTime))
    if (!day) continue
    groups.get(day)!.push(event)
  }

  return new Map(
    FESTIVAL_DAYS.filter((day) => groups.get(day)!.length > 0).map((day) => [
      day,
      groups.get(day)!,
    ]),
  )
}

export function formatSlotTime(time: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(time))
}
