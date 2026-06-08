import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseTimetableCsv } from './parse-timetable.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const csvPath = join(__dirname, '../../data/daad_2026_timetable.csv')

describe('parseTimetableCsv', () => {
  it('parses all rows from the festival CSV', () => {
    const content = readFileSync(csvPath, 'utf-8')
    const slots = parseTimetableCsv(content)

    expect(slots).toHaveLength(86)
    expect(slots[0]).toMatchObject({
      artist: 'Vedat Akdağ',
      stage: 'Cooking Groove',
      day: 'Wednesday',
    })
  })

  it('rolls after-midnight slots forward per stage', () => {
    const content = readFileSync(csvPath, 'utf-8')
    const slots = parseTimetableCsv(content)

    const oscar = slots.find((slot) => slot.artist === 'Oscar Mulero')
    const charlotte = slots.find((slot) => slot.artist === 'Charlotte de Witte')

    expect(oscar?.startTime.getTime()).toBeGreaterThan(
      charlotte!.startTime.getTime(),
    )
  })

  it('ends a slot when the next one on the same stage starts', () => {
    const content = readFileSync(csvPath, 'utf-8')
    const slots = parseTimetableCsv(content)

    const charlotte = slots.find((slot) => slot.artist === 'Charlotte de Witte')
    const mode = slots.find((slot) => slot.artist === 'Mode & Valens')

    expect(charlotte?.endTime).toEqual(mode?.startTime)
  })
})
