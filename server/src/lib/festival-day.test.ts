import { describe, expect, it } from 'vitest'
import {
  getFestivalDayForTime,
  getFestivalDayWindow,
  isWithinFestivalDay,
  parseFestivalDateTime,
} from './festival-day.js'

describe('festival-day', () => {
  it('defines each day as 9am to the next 9am', () => {
    const thursday = getFestivalDayWindow('Thursday')

    expect(thursday.start).toEqual(parseFestivalDateTime('2026-06-18', '09:00'))
    expect(thursday.end).toEqual(parseFestivalDateTime('2026-06-19', '09:00'))
  })

  it('assigns after-midnight slots to the previous festival day', () => {
    expect(
      getFestivalDayForTime(parseFestivalDateTime('2026-06-19', '01:00')),
    ).toBe('Thursday')
    expect(
      getFestivalDayForTime(parseFestivalDateTime('2026-06-19', '08:30')),
    ).toBe('Thursday')
    expect(
      getFestivalDayForTime(parseFestivalDateTime('2026-06-19', '09:00')),
    ).toBe('Friday')
  })

  it('filters by festival day window', () => {
    expect(
      isWithinFestivalDay(
        parseFestivalDateTime('2026-06-19', '01:00'),
        'Thursday',
      ),
    ).toBe(true)
    expect(
      isWithinFestivalDay(
        parseFestivalDateTime('2026-06-19', '01:00'),
        'Friday',
      ),
    ).toBe(false)
  })
})
