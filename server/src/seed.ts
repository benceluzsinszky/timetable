import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaPg } from '@prisma/adapter-pg'
import type { Prisma } from './generated/prisma/client.js'
import { PrismaClient } from './generated/prisma/client.js'
import { parseTimetableCsv } from './lib/parse-timetable.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const csvPath = join(__dirname, '../data/daad_2026_timetable.csv')

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const content = readFileSync(csvPath, 'utf-8')
  const slots = parseTimetableCsv(content)

  await prisma.favourite.deleteMany()
  await prisma.event.deleteMany()

  const data: Prisma.EventCreateManyInput[] = slots.map((slot) => ({
    artist: slot.artist,
    stage: slot.stage,
    festivalDay: slot.day,
    startTime: slot.startTime,
    endTime: slot.endTime,
    notes: slot.notes,
  }))

  await prisma.event.createMany({ data })

  console.log(`Seeded ${slots.length} events from timetable CSV`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
