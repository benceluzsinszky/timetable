import { describe, expect, it } from 'vitest'
import { filterEvents, getStagesFromEvents } from './event-filters'
import type { TimetableEvent } from './timetable-grid'

const events: TimetableEvent[] = [
  {
    id: '1',
    artist: 'A',
    stage: 'The Dome',
    festivalDay: 'Friday',
    startTime: '2026-06-19T12:00:00.000Z',
    endTime: '2026-06-19T13:00:00.000Z',
    notes: null,
  },
  {
    id: '2',
    artist: 'B',
    stage: 'DAAD Stage',
    festivalDay: 'Saturday',
    startTime: '2026-06-20T12:00:00.000Z',
    endTime: '2026-06-20T13:00:00.000Z',
    notes: null,
  },
]

describe('event-filters', () => {
  it('filters by festival day and stage', () => {
    expect(
      filterEvents(events, {
        festivalDays: ['Friday'],
        stages: ['The Dome'],
      }),
    ).toEqual([events[0]])
  })

  it('returns all events when filters are empty', () => {
    expect(filterEvents(events, {})).toEqual(events)
  })

  it('derives sorted stages from events', () => {
    expect(getStagesFromEvents(events)).toEqual(['DAAD Stage', 'The Dome'])
  })
})
