import { describe, it } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'

/**
 * Demo Local Project Tests
 *
 * Clean, minimal examples for testing your CLI projects.
 * Copy this pattern for your own projects!
 */

describe('demo-local', () => {
  it('should show help', async () => {
    const result = await runLocalCitty({ args: ['--help'] })

    result
      .expectSuccess()
      .expectOutput(/USAGE|COMMANDS/)
      .expectNoStderr()
  })

  it('should show version', async () => {
    const result = await runLocalCitty({ args: ['--version'] })

    result
      .expectSuccess()
      .expectOutput(/\d+\.\d+\.\d+/)
  })

  it('should execute basic commands', async () => {
    const result = await runLocalCitty({ args: ['info'] })

    result.expectSuccess()
  })
})
