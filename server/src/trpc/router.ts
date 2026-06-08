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
            stage: z.string().optional(),
            festivalDay: z.string().optional(),
          })
          .optional(),
      )
      .query(async ({ ctx, input }) => {
        const festivalDayWindow = input?.festivalDay
          ? getFestivalDayWindow(input.festivalDay)
          : null

        return ctx.prisma.event.findMany({
          where: {
            ...(input?.stage ? { stage: input.stage } : {}),
            ...(festivalDayWindow
              ? {
                  startTime: {
                    gte: festivalDayWindow.start,
                    lt: festivalDayWindow.end,
                  },
                }
              : {}),
          },
          orderBy: { startTime: 'asc' },
          include: {
            favourites: ctx.sessionId
              ? { where: { sessionId: ctx.sessionId }, select: { id: true } }
              : false,
          },
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

  favourites: router({
    toggle: publicProcedure
      .input(z.object({ eventId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.sessionId) {
          throw new Error('Missing session ID')
        }

        const existing = await ctx.prisma.favourite.findUnique({
          where: {
            sessionId_eventId: {
              sessionId: ctx.sessionId,
              eventId: input.eventId,
            },
          },
        })

        if (existing) {
          await ctx.prisma.favourite.delete({ where: { id: existing.id } })
          return { favourited: false }
        }

        await ctx.prisma.favourite.create({
          data: { sessionId: ctx.sessionId, eventId: input.eventId },
        })
        return { favourited: true }
      }),
  }),
})

export type AppRouter = typeof appRouter
