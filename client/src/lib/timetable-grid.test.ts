import { describe, expect, it } from 'vitest'
import {
  buildTimeMarkers,
  eventPlacement,
  getTimelineRange,
  sortStages,
  timelineHeightPx,
} from './timetable-grid'

const events = [
  {
    id: '1',
    artist: 'A',
    stage: 'DAAD Stage',
    festivalDay: 'Friday',
    startTime: new Date('2026-06-19T12:00:00'),
    endTime: new Date('2026-06-19T13:00:00'),
    notes: null,
  },
  {
    id: '2',
    artist: 'B',
    stage: 'The Dome',
    festivalDay: 'Friday',
    startTime: new Date('2026-06-19T12:00:00'),
    endTime: new Date('2026-06-19T13:00:00'),
    notes: null,
  },
  {
    id: '3',
    artist: 'C',
    stage: 'The Dome',
    festivalDay: 'Friday',
    startTime: new Date('2026-06-19T12:30:00'),
    endTime: new Date('2026-06-19T14:00:00'),
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

  it('places event top at start time and height by duration', () => {
    const { rangeStart, durationMs } = getTimelineRange(events)
    const height = timelineHeightPx(durationMs)

    const oneHour = eventPlacement(events[0]!, rangeStart, durationMs, height)
    const ninetyMin = eventPlacement(events[2]!, rangeStart, durationMs, height)

    expect(oneHour.topPx).toBe(0)
    expect(oneHour.heightPx).toBeLessThan(ninetyMin.heightPx)
    expect(ninetyMin.topPx).toBeGreaterThan(oneHour.topPx)
    expect(ninetyMin.topPx).toBeCloseTo(height / 4, 0)
  })

  it('aligns same-time events at the same vertical offset', () => {
    const { rangeStart, durationMs } = getTimelineRange(events)
    const height = timelineHeightPx(durationMs)

    const a = eventPlacement(events[0]!, rangeStart, durationMs, height)
    const b = eventPlacement(events[1]!, rangeStart, durationMs, height)

    expect(a.topPx).toBe(b.topPx)
  })

  it('builds hour markers within the timeline', () => {
    const { rangeStart, rangeEnd, durationMs } = getTimelineRange(events)
    const height = timelineHeightPx(durationMs)
    const markers = buildTimeMarkers(rangeStart, rangeEnd, durationMs, height)

    expect(markers.length).toBeGreaterThan(0)
    expect(markers[0]!.topPx).toBeGreaterThanOrEqual(0)
  })
})
