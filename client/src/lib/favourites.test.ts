import { beforeEach, describe, expect, it } from 'vitest'
import {
  getFavouriteIds,
  isEventFavourited,
  toggleFavouriteId,
  withLocalFavourites,
} from './favourites'
import type { TimetableEvent } from './timetable-grid'

const event: TimetableEvent = {
  id: 'event-1',
  artist: 'Artist',
  stage: 'DAAD Stage',
  festivalDay: 'Friday',
  startTime: '2026-06-19T12:00:00.000Z',
  endTime: '2026-06-19T13:00:00.000Z',
  notes: null,
}

describe('favourites', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores favourites in localStorage', () => {
    expect(toggleFavouriteId('event-1')).toBe(true)
    expect(getFavouriteIds()).toEqual(['event-1'])
    expect(toggleFavouriteId('event-1')).toBe(false)
    expect(getFavouriteIds()).toEqual([])
  })

  it('merges local favourites onto events', () => {
    toggleFavouriteId('event-1')

    expect(withLocalFavourites([event])[0]?.favourites).toEqual([
      { id: 'local' },
    ])
    expect(isEventFavourited('event-1')).toBe(true)
  })
})
