import { describe, expect, it, vi } from 'vitest'
import { appRouter } from './router.js'

function createCaller(sessionId?: string) {
  return appRouter.createCaller({
    prisma: {
      event: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      favourite: {
        findUnique: vi.fn(),
        delete: vi.fn(),
        create: vi.fn(),
      },
    },
    sessionId,
  })
}

describe('appRouter', () => {
  it('health returns ok status', async () => {
    const caller = createCaller()
    const result = await caller.health()

    expect(result.status).toBe('ok')
    expect(result.timestamp).toBeTypeOf('string')
  })

  it('favourites.toggle requires a session id', async () => {
    const caller = createCaller()

    await expect(
      caller.favourites.toggle({ eventId: 'event-1' }),
    ).rejects.toThrow('Missing session ID')
  })
})
