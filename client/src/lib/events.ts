import type { TimetableEvent } from './timetable-grid'
import type { RouterOutputs } from './trpc'

export function toTimetableEvents(
  events: RouterOutputs['events']['list'] | undefined,
): TimetableEvent[] {
  return (events ?? []) as TimetableEvent[]
}

export function isFavourited(event: TimetableEvent): boolean {
  return Array.isArray(event.favourites) && event.favourites.length > 0
}
