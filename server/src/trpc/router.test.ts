import { describe, expect, it, vi } from 'vitest'
import { appRouter } from './router.js'

function createCaller() {
  return appRouter.createCaller({
    prisma: {
      event: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
  })
}

describe('appRouter', () => {
  it('health returns ok status', async () => {
    const caller = createCaller()
    const result = await caller.health()

    expect(result.status).toBe('ok')
    expect(result.timestamp).toBeTypeOf('string')
  })

  it('events.days returns festival days', async () => {
    const caller = createCaller()

    expect(await caller.events.days()).toEqual([
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
      'Monday',
    ])
  })
})
