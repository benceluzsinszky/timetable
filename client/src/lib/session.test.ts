import { afterEach, describe, expect, it } from 'vitest'
import { getSessionId } from './session'

describe('getSessionId', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('creates and reuses a session id', () => {
    const first = getSessionId()
    const second = getSessionId()

    expect(first).toBe(second)
    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
  })
})
