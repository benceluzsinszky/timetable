import { parseFestivalDateTime } from '@timetable/server/festival-day'
import { describe, expect, it } from 'vitest'
import {
  buildTimeMarkers,
  eventPlacement,
  getFestivalDayTimelineRange,
  sortStages,
  timelineHeightPx,
} from './timetable-grid'

const events = [
  {
    id: '1',
    artist: 'A',
    stage: 'DAAD Stage',
    festivalDay: 'Friday',
    startTime: parseFestivalDateTime('2026-06-19', '12:00'),
    endTime: parseFestivalDateTime('2026-06-19', '13:00'),
    notes: null,
  },
  {
    id: '2',
    artist: 'B',
    stage: 'The Dome',
    festivalDay: 'Friday',
    startTime: parseFestivalDateTime('2026-06-19', '12:00'),
    endTime: parseFestivalDateTime('2026-06-19', '13:00'),
    notes: null,
  },
  {
    id: '3',
    artist: 'C',
    stage: 'The Dome',
    festivalDay: 'Friday',
    startTime: parseFestivalDateTime('2026-06-19', '12:30'),
    endTime: parseFestivalDateTime('2026-06-19', '14:00'),
    notes: null,
  },
]

describe('timetable-grid', () => {
  it('sorts stages in festival order', () => {
    expect(sortStages(['AM/Beach', 'DAAD Stage', 'The Dome'])).toEqual([
      'DAAD Stage',
      'The Dome',
      'AM/Beach',
    ])
  })

  it('trims empty space at the edges of the first and last day blocks', () => {
    const wednesday = getFestivalDayTimelineRange(
      'Wednesday',
      [
        {
          id: '1',
          artist: 'Vedat Akdağ',
          stage: 'Cooking Groove',
          festivalDay: 'Wednesday',
          startTime: parseFestivalDateTime('2026-06-17', '21:00'),
          endTime: parseFestivalDateTime('2026-06-17', '23:00'),
          notes: null,
        },
      ],
      { trimStart: true },
    )

    expect(wednesday.rangeStart).toEqual(
      parseFestivalDateTime('2026-06-17', '21:00').getTime(),
    )

    const sunday = getFestivalDayTimelineRange(
      'Sunday',
      [
        {
          id: '2',
          artist: 'GusGus',
          stage: 'Dragon Nest',
          festivalDay: 'Sunday',
          startTime: parseFestivalDateTime('2026-06-21', '21:30'),
          endTime: parseFestivalDateTime('2026-06-21', '23:30'),
          notes: null,
        },
      ],
      { trimEnd: true },
    )

    expect(sunday.rangeEnd).toEqual(
      parseFestivalDateTime('2026-06-21', '23:30').getTime(),
    )
  })

  it('places event top at start time and height by duration', () => {
    const { rangeStart, durationMs } = getFestivalDayTimelineRange('Friday')
    const height = timelineHeightPx(durationMs)

    const oneHour = eventPlacement(events[0]!, rangeStart, durationMs, height)
    const ninetyMin = eventPlacement(events[2]!, rangeStart, durationMs, height)

    expect(oneHour.topPx).toBeCloseTo(height / 8, 0)
    expect(oneHour.heightPx).toBeLessThan(ninetyMin.heightPx)
    expect(ninetyMin.topPx).toBeGreaterThan(oneHour.topPx)
    expect(ninetyMin.topPx).toBeCloseTo((height * 3.5) / 24, 0)
  })

  it('aligns same-time events at the same vertical offset', () => {
    const { rangeStart, durationMs } = getFestivalDayTimelineRange('Friday')
    const height = timelineHeightPx(durationMs)

    const a = eventPlacement(events[0]!, rangeStart, durationMs, height)
    const b = eventPlacement(events[1]!, rangeStart, durationMs, height)

    expect(a.topPx).toBe(b.topPx)
  })

  it('builds hour markers within the timeline', () => {
    const { rangeStart, rangeEnd, durationMs } =
      getFestivalDayTimelineRange('Friday')
    const height = timelineHeightPx(durationMs)
    const markers = buildTimeMarkers(rangeStart, rangeEnd, durationMs, height)

    expect(markers.length).toBeGreaterThan(0)
    expect(markers[0]!.topPx).toBeGreaterThanOrEqual(0)
  })

  it('hides duplicate 9am markers between consecutive day blocks', () => {
    const thursday = getFestivalDayTimelineRange('Thursday')
    const friday = getFestivalDayTimelineRange('Friday')
    const thursdayHeight = timelineHeightPx(thursday.durationMs)
    const fridayHeight = timelineHeightPx(friday.durationMs)

    const thursdayMarkers = buildTimeMarkers(
      thursday.rangeStart,
      thursday.rangeEnd,
      thursday.durationMs,
      thursdayHeight,
      { hideEnd: true },
    )
    const fridayMarkers = buildTimeMarkers(
      friday.rangeStart,
      friday.rangeEnd,
      friday.durationMs,
      fridayHeight,
      { hideStart: true },
    )

    expect(thursdayMarkers.at(-1)?.time).not.toBe(thursday.rangeEnd)
    expect(fridayMarkers[0]?.time).not.toBe(friday.rangeStart)
    expect(thursday.rangeEnd).toBe(friday.rangeStart)
  })
})
