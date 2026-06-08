import type { TimetableEvent } from './timetable-grid'

const MIN_QUERY_LENGTH = 2
const DEFAULT_LIMIT = 8

function normalizeQuery(query: string): string {
  return query.trim().toLocaleLowerCase()
}

export function searchEvents(
  events: TimetableEvent[],
  query: string,
  limit = DEFAULT_LIMIT,
): TimetableEvent[] {
  const normalized = normalizeQuery(query)
  if (normalized.length < MIN_QUERY_LENGTH) return []

  return events
    .filter((event) => event.artist.toLocaleLowerCase().includes(normalized))
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    )
    .slice(0, limit)
}

export { MIN_QUERY_LENGTH }
