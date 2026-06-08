import type { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import { prisma } from '../db.js'

export function createContext({ req }: CreateExpressContextOptions) {
  const sessionId = req.headers['x-session-id']

  return {
    prisma,
    sessionId: typeof sessionId === 'string' ? sessionId : undefined,
  }
}

export type Context = ReturnType<typeof createContext>
