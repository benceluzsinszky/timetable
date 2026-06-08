// Per-browser favourites in localStorage — no accounts, no server sync.
export const FAVOURITES_KEY = 'timetable-favourites'

export function getFavouriteIds(): string[] {
  const raw = localStorage.getItem(FAVOURITES_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : []
  } catch {
    return []
  }
}

export function isEventFavourited(eventId: string): boolean {
  return getFavouriteIds().includes(eventId)
}

export function toggleFavouriteId(eventId: string): boolean {
  const ids = new Set(getFavouriteIds())
  const favourited = !ids.has(eventId)

  if (favourited) {
    ids.add(eventId)
  } else {
    ids.delete(eventId)
  }

  localStorage.setItem(FAVOURITES_KEY, JSON.stringify([...ids]))
  return favourited
}
