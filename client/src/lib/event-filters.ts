import type { TimetableEvent } from './timetable-grid'
import { sortStages } from './timetable-grid'

export function filterEvents(
  events: TimetableEvent[],
  filters: { festivalDays?: string[]; stages?: string[] },
): TimetableEvent[] {
  const festivalDays = filters.festivalDays ?? []
  const stages = filters.stages ?? []

  return events.filter((event) => {
    if (festivalDays.length > 0 && !festivalDays.includes(event.festivalDay)) {
      return false
    }

    if (stages.length > 0 && !stages.includes(event.stage)) {
      return false
    }

    return true
  })
}

export function getStagesFromEvents(events: TimetableEvent[]): string[] {
  return sortStages([...new Set(events.map((event) => event.stage))])
}
