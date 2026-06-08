import { z } from 'zod'
import { publicProcedure, router } from './trpc.js'

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
        return ctx.prisma.event.findMany({
          where: {
            ...(input?.stage ? { stage: input.stage } : {}),
            ...(input?.festivalDay ? { festivalDay: input.festivalDay } : {}),
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
      return rows.map((row) => row.stage)
    }),

    days: publicProcedure.query(async ({ ctx }) => {
      const rows = await ctx.prisma.event.findMany({
        distinct: ['festivalDay'],
        select: { festivalDay: true, startTime: true },
        orderBy: { startTime: 'asc' },
      })
      return rows.map((row) => row.festivalDay)
    }),
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
