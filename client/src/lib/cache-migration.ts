import { offlineCacheOptions } from './trpc'

const LEGACY_QUERY_CACHE_KEYS = [
  'timetable-query-cache',
  'timetable-query-cache-daad-2026-v1',
  'timetable-query-cache-daad-2026-v2',
]

export function migrateOfflineCache(): void {
  for (const key of LEGACY_QUERY_CACHE_KEYS) {
    localStorage.removeItem(key)
  }

  if (
    offlineCacheOptions.buster !==
    localStorage.getItem('timetable-cache-buster')
  ) {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('timetable-query-cache-')) {
        localStorage.removeItem(key)
      }
    }
    localStorage.setItem('timetable-cache-buster', offlineCacheOptions.buster)
  }
}

export function queryCacheStorageKey(): string {
  return `timetable-query-cache-${offlineCacheOptions.buster}`
}
