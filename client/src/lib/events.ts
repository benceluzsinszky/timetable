import type { TimetableEvent } from './timetable-grid'
import type { RouterOutputs } from './trpc'

export function toTimetableEvents(
  events: RouterOutputs['events']['list'] | undefined,
): TimetableEvent[] {
  return (events ?? []) as TimetableEvent[]
}
