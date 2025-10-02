import { describe, it, expect } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'

/**
 * Fluent Test Project
 *
 * Shows the power of fluent, chainable assertions.
 * Write beautiful, readable tests!
 */

describe('fluent-test', () => {
  it('should chain multiple assertions', async () => {
    const result = await runLocalCitty({ args: ['--help'] })

    // Beautiful fluent chaining
    result
      .expectSuccess()
      .expectOutput(/USAGE|COMMANDS/)
      .expectNoStderr()
      .expectOutputLength(10, 1000)
  })

  it('should validate JSON responses', async () => {
    const result = await runLocalCitty({ args: ['info', '--json'] })

    result
      .expectSuccess()
      .expectJson((json) => {
        expect(json).toBeDefined()
        expect(json.name).toBeTruthy()
      })
  })

  it('should handle complex scenarios', async () => {
    const result = await runLocalCitty({
      args: ['greet', 'World'],
      env: { DEBUG: 'true' }
    })

    result
      .expectSuccess()
      .expectOutput(/Hello/)
      .expectNoStderr()
  })
})
