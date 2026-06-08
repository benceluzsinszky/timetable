import { z } from 'zod'
import { publicProcedure, router } from './trpc.js'

export const appRouter = router({
  health: publicProcedure.query(() => ({
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
  })),

  events: router({
    list: publicProcedure.query(async ({ ctx }) => {
      return ctx.prisma.event.findMany({
        orderBy: { startTime: 'asc' },
        include: {
          favourites: ctx.sessionId
            ? { where: { sessionId: ctx.sessionId }, select: { id: true } }
            : false,
        },
      })
    }),

    create: publicProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          startTime: z.coerce.date(),
          endTime: z.coerce.date(),
          location: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return ctx.prisma.event.create({ data: input })
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
