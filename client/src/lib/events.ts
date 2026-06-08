import { isEventFavourited } from './favourites'
import type { TimetableEvent } from './timetable-grid'
import type { RouterOutputs } from './trpc'

export function toTimetableEvents(
  events: RouterOutputs['events']['list'] | undefined,
): TimetableEvent[] {
  return (events ?? []) as TimetableEvent[]
}

export function isFavourited(event: TimetableEvent): boolean {
  return (
    isEventFavourited(event.id) ||
    (Array.isArray(event.favourites) && event.favourites.length > 0)
  )
}
