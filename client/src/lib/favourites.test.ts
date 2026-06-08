import { beforeEach, describe, expect, it } from 'vitest'
import {
  getFavouriteIds,
  isEventFavourited,
  toggleFavouriteId,
} from './favourites'

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

  it('tracks favourited event ids', () => {
    toggleFavouriteId('event-1')
    expect(isEventFavourited('event-1')).toBe(true)
  })
})
