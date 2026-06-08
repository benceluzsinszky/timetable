import { describe, expect, it } from 'vitest'
import { parseFestivalDateTime } from '@timetable/server/festival-day'
import type { TimetableEvent } from './timetable-grid'
import { searchEvents } from './event-search'

function event(artist: string, start: string, day = 'Friday'): TimetableEvent {
  return {
    id: artist,
    artist,
    stage: 'DAAD Stage',
    festivalDay: day,
    startTime: parseFestivalDateTime('2026-06-19', start),
    endTime: parseFestivalDateTime('2026-06-19', '23:00'),
    notes: null,
  }
}

describe('searchEvents', () => {
  const events = [
    event('Charlotte De Witte', '22:00'),
    event('Oscar Mulero', '01:00', 'Thursday'),
    event('Vedat Akdağ', '21:00', 'Wednesday'),
  ]

  it('returns nothing before two characters', () => {
    expect(searchEvents(events, 'v')).toEqual([])
    expect(searchEvents(events, '  ')).toEqual([])
  })

  it('matches artist names case-insensitively', () => {
    expect(searchEvents(events, 'osca').map((item) => item.artist)).toEqual([
      'Oscar Mulero',
    ])
    expect(searchEvents(events, 'DE WI').map((item) => item.artist)).toEqual([
      'Charlotte De Witte',
    ])
  })

  it('sorts matches by start time', () => {
    const timedEvents = [
      event('Beta Artist', '23:00'),
      event('Alpha Artist', '20:00'),
    ]

    expect(searchEvents(timedEvents, 'ar').map((item) => item.artist)).toEqual([
      'Alpha Artist',
      'Beta Artist',
    ])
  })
})
