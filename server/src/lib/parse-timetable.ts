export type TimetableRow = {
  date: string
  day: string
  time: string
  endTime: string
  stage: string
  artist: string
  notes: string | null
}

export type ParsedSlot = Omit<TimetableRow, 'endTime'> & {
  startTime: Date
  endTime: Date
}

export function parseTimetableCsv(content: string): ParsedSlot[] {
  const lines = content.trim().split('\n').slice(1)
  const rows = lines.filter(Boolean).map(parseCsvLine)
  const startTimes = resolveStartTimes(rows)

  return rows.map((row, index) => {
    const startTime = startTimes[index]!
    return {
      ...row,
      startTime,
      endTime: resolveSlotEndTime(row, startTime),
    }
  })
}

function parseCsvLine(line: string): TimetableRow {
  const parts = line.split(',')
  const [date, day, time, endTime, stage, ...artistParts] = parts
  const artist = artistParts.join(',').trim()

  if (!date || !day || !time || !endTime || !stage || !artist) {
    throw new Error(`Invalid timetable row: ${line}`)
  }

  return {
    date,
    day,
    time,
    endTime,
    stage: normalizeStage(stage),
    artist,
    notes: null,
  }
}

function normalizeStage(stage: string): string {
  if (stage === 'Am/Beach') {
    return 'AM/Beach'
  }

  return stage
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

function resolveSlotEndTime(row: TimetableRow, start: Date): Date {
  const end = new Date(`${row.date}T${row.endTime}:00`)

  if (end <= start) {
    end.setDate(end.getDate() + 1)
  }

  return end
}

function festivalSortKey(row: TimetableRow): number {
  const base = new Date(`${row.date}T00:00:00`).getTime()
  const [hours, minutes] = row.time.split(':').map(Number)
  let dayMinutes = hours! * 60 + minutes!

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
