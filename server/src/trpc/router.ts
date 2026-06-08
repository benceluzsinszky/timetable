import { z } from 'zod'
import { FESTIVAL_DAYS, getFestivalDayWindow } from '../lib/festival-day.js'
import { publicProcedure, router } from './trpc.js'

const STAGE_ORDER = [
  'DAAD Stage',
  'The Dome',
  'Dragon Nest',
  'Cooking Groove',
  'AM/Beach',
]

function sortStageNames(stages: string[]): string[] {
  return [...stages].sort((a, b) => {
    const aIndex = STAGE_ORDER.indexOf(a)
    const bIndex = STAGE_ORDER.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })
}

export const appRouter = router({
  health: publicProcedure.query(() => ({
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
  })),

  events: router({
    list: publicProcedure
      .input(
        z
          .object({
            stages: z.array(z.string()).optional(),
            festivalDays: z.array(z.string()).optional(),
          })
          .optional(),
      )
      .query(async ({ ctx, input }) => {
        const festivalDayWindows =
          input?.festivalDays?.map((day) => getFestivalDayWindow(day)) ?? []

        return ctx.prisma.event.findMany({
          where: {
            ...(input?.stages?.length ? { stage: { in: input.stages } } : {}),
            ...(festivalDayWindows.length
              ? {
                  OR: festivalDayWindows.map((window) => ({
                    startTime: {
                      gte: window.start,
                      lt: window.end,
                    },
                  })),
                }
              : {}),
          },
          orderBy: { startTime: 'asc' },
        })
      }),

    stages: publicProcedure.query(async ({ ctx }) => {
      const rows = await ctx.prisma.event.findMany({
        distinct: ['stage'],
        select: { stage: true },
        orderBy: { stage: 'asc' },
      })
      return sortStageNames(rows.map((row) => row.stage))
    }),

    days: publicProcedure.query(() => [...FESTIVAL_DAYS]),
  }),
})

export type AppRouter = typeof appRouter
