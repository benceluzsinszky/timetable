export type TimetableRow = {
  date: string
  day: string
  time: string
  stage: string
  artist: string
  notes: string | null
}

export type ParsedSlot = TimetableRow & {
  startTime: Date
  endTime: Date
}

const DEFAULT_SLOT_MS = 60 * 60 * 1000

export function parseTimetableCsv(content: string): ParsedSlot[] {
  const lines = content.trim().split('\n').slice(1)
  const rows = lines.filter(Boolean).map(parseCsvLine)
  const startTimes = resolveStartTimes(rows)
  const endTimes = resolveEndTimes(rows, startTimes)

  return rows.map((row, index) => ({
    ...row,
    startTime: startTimes[index]!,
    endTime: endTimes[index]!,
  }))
}

function parseCsvLine(line: string): TimetableRow {
  const [date, day, time, stage, artist, notes] = line.split(',')
  if (!date || !day || !time || !stage || !artist) {
    throw new Error(`Invalid timetable row: ${line}`)
  }

  return {
    date,
    day,
    time,
    stage,
    artist,
    notes: notes?.trim() ? notes.trim() : null,
  }
}

function resolveStartTimes(rows: TimetableRow[]): Date[] {
  const startTimes = new Array<Date>(rows.length)
  const indicesByStage = groupIndicesByStage(rows)

  for (const indices of indicesByStage.values()) {
    const sorted = [...indices].sort(
      (a, b) => festivalSortKey(rows[a]!) - festivalSortKey(rows[b]!),
    )

    let lastStart: Date | null = null

    for (const index of sorted) {
      const row = rows[index]!
      const start = new Date(`${row.date}T${row.time}:00`)

      if (lastStart && start <= lastStart) {
        start.setDate(start.getDate() + 1)
      }

      startTimes[index] = start
      lastStart = start
    }
  }

  return startTimes
}

function resolveEndTimes(rows: TimetableRow[], startTimes: Date[]): Date[] {
  const endTimes = rows.map(
    (_, index) => new Date(startTimes[index]!.getTime() + DEFAULT_SLOT_MS),
  )
  const indicesByStage = groupIndicesByStage(rows)

  for (const indices of indicesByStage.values()) {
    const sorted = [...indices].sort(
      (a, b) => startTimes[a]!.getTime() - startTimes[b]!.getTime(),
    )

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i]!
      const next = sorted[i + 1]!
      endTimes[current] = startTimes[next]!
    }
  }

  return endTimes
}

function festivalSortKey(row: TimetableRow): number {
  const base = new Date(`${row.date}T00:00:00`).getTime()
  const [hours, minutes] = row.time.split(':').map(Number)
  let dayMinutes = hours! * 60 + minutes!

  // After-midnight slots belong to the previous festival evening.
  if (hours! < 8) {
    dayMinutes += 24 * 60
  }

  return base + dayMinutes * 60_000
}

function groupIndicesByStage(rows: TimetableRow[]): Map<string, number[]> {
  const groups = new Map<string, number[]>()

  rows.forEach((row, index) => {
    const indices = groups.get(row.stage) ?? []
    indices.push(index)
    groups.set(row.stage, indices)
  })

  return groups
}
