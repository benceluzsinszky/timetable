import { describe, expect, it } from 'vitest'
import {
  getFestivalDayForTime,
  getFestivalDayWindow,
  isWithinFestivalDay,
} from './festival-day.js'

describe('festival-day', () => {
  it('defines each day as 9am to the next 9am', () => {
    const thursday = getFestivalDayWindow('Thursday')

    expect(thursday.start).toEqual(new Date('2026-06-18T09:00:00'))
    expect(thursday.end).toEqual(new Date('2026-06-19T09:00:00'))
  })

  it('assigns after-midnight slots to the previous festival day', () => {
    expect(getFestivalDayForTime(new Date('2026-06-19T01:00:00'))).toBe(
      'Thursday',
    )
    expect(getFestivalDayForTime(new Date('2026-06-19T08:30:00'))).toBe(
      'Thursday',
    )
    expect(getFestivalDayForTime(new Date('2026-06-19T09:00:00'))).toBe(
      'Friday',
    )
  })

  it('filters by festival day window', () => {
    expect(
      isWithinFestivalDay(new Date('2026-06-19T01:00:00'), 'Thursday'),
    ).toBe(true)
    expect(isWithinFestivalDay(new Date('2026-06-19T01:00:00'), 'Friday')).toBe(
      false,
    )
  })
})
