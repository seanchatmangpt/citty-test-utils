import { describe, it, expect } from 'vitest'
import { z } from 'zod'

describe('Zod in Vitest', () => {
  it('should work', () => {
    const schema = z.object({
      a: z.string().default('hello')
    })
    const result = schema.parse({})
    expect(result.a).toBe('hello')
  })
})
