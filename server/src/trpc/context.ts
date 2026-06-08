import type { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import { prisma } from '../db.js'

export function createContext(opts: CreateExpressContextOptions) {
  void opts
  return { prisma }
}

export type Context = ReturnType<typeof createContext>
