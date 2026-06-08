import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseFestivalDateTime } from './festival-day.js'
import { parseTimetableCsv } from './parse-timetable.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const csvPath = join(__dirname, '../../data/daad_2026_timetable.csv')

describe('parseTimetableCsv', () => {
  it('parses all rows from the festival CSV', () => {
    const content = readFileSync(csvPath, 'utf-8')
    const slots = parseTimetableCsv(content)

    expect(slots).toHaveLength(84)
    expect(slots[0]).toMatchObject({
      artist: 'Vedat Akdağ',
      stage: 'Cooking Groove',
      day: 'Wednesday',
    })
    expect(slots[0]!.endTime).toEqual(
      parseFestivalDateTime('2026-06-17', '23:00'),
    )
    expect(slots[0]!.startTime.toISOString()).toBe('2026-06-17T19:00:00.000Z')
  })

  it('normalizes Am/Beach to AM/Beach', () => {
    const content = readFileSync(csvPath, 'utf-8')
    const slots = parseTimetableCsv(content)

    expect(slots.every((slot) => slot.stage !== 'Am/Beach')).toBe(true)
    expect(slots.find((slot) => slot.artist === 'Lutum')?.stage).toBe(
      'AM/Beach',
    )
  })

  it('rolls after-midnight slots forward per stage', () => {
    const content = readFileSync(csvPath, 'utf-8')
    const slots = parseTimetableCsv(content)

    const oscar = slots.find((slot) => slot.artist === 'Oscar Mulero')
    const charlotte = slots.find((slot) =>
      slot.artist.includes('Charlotte De Witte'),
    )

    expect(oscar?.startTime.getTime()).toBeGreaterThan(
      charlotte!.startTime.getTime(),
    )
  })

  it('uses end times from the CSV', () => {
    const content = readFileSync(csvPath, 'utf-8')
    const slots = parseTimetableCsv(content)

    const nastia = slots.find((slot) => slot.artist === 'Nastia')
    const pachanga = slots.find((slot) => slot.artist === 'Pachanga Boys')

    expect(nastia?.endTime).toEqual(
      parseFestivalDateTime('2026-06-19', '07:00'),
    )
    expect(pachanga?.endTime).toEqual(
      parseFestivalDateTime('2026-06-18', '02:00'),
    )
  })

  it('keeps after-midnight slots on the correct calendar start time', () => {
    const content = readFileSync(csvPath, 'utf-8')
    const slots = parseTimetableCsv(content)

    const oscar = slots.find((slot) => slot.artist === 'Oscar Mulero')
    const cari = slots.find((slot) => slot.artist === 'Cari Lekebusch')

    expect(oscar?.startTime).toEqual(
      parseFestivalDateTime('2026-06-19', '01:00'),
    )
    expect(cari?.startTime).toEqual(
      parseFestivalDateTime('2026-06-19', '20:00'),
    )
    expect(oscar!.startTime.getTime()).toBeLessThan(cari!.startTime.getTime())
  })
})
