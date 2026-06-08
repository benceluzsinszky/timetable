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

export const PX_PER_MINUTE = 2
const MIN_TIMELINE_HEIGHT_PX = 480
const MIN_EVENT_HEIGHT_PX = 44
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

export function getTimelineRange(events: TimetableEvent[]) {
  const starts = events.map((event) => new Date(event.startTime).getTime())
  const ends = events.map((event) => new Date(event.endTime).getTime())
  const rangeStart = Math.min(...starts)
  const rangeEnd = Math.max(...ends)

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

  return {
    topPx,
    heightPx: Math.max(MIN_EVENT_HEIGHT_PX, rawHeightPx),
  }
}

export function buildTimeMarkers(
  rangeStart: number,
  rangeEnd: number,
  durationMs: number,
  timelineHeight: number,
): TimeMarker[] {
  const markers: TimeMarker[] = []
  const firstMarker = new Date(rangeStart)
  firstMarker.setMinutes(0, 0, 0)

  let current = firstMarker.getTime()
  if (current < rangeStart) {
    current += HOUR_MS
  }

  while (current <= rangeEnd) {
    markers.push({
      time: current,
      topPx: ((current - rangeStart) / durationMs) * timelineHeight,
    })
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
  const groups = new Map<string, TimetableEvent[]>()

  for (const event of events) {
    const dayEvents = groups.get(event.festivalDay) ?? []
    dayEvents.push(event)
    groups.set(event.festivalDay, dayEvents)
  }

  return groups
}

export function formatSlotTime(time: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(time))
}
