import { describe, it, expect } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'

/**
 * Playground CLI Tests - Beautiful Examples
 *
 * This test file demonstrates the clean, minimal API for testing Citty CLIs.
 * These examples are copy-paste ready for your own projects!
 */

describe('Playground CLI Tests', () => {
  describe('Basic Commands', () => {
    it('should show help information', async () => {
      // Clean, minimal API - just pass args and check results
      const result = await runLocalCitty({ args: ['--show-help'] })

      result
        .expectSuccess()
        .expectOutput(/playground/)
        .expectOutput(/COMMANDS/)
    })

    it('should show version information', async () => {
      const result = await runLocalCitty({ args: ['--show-version'] })

      result
        .expectSuccess()
        .expectOutput(/1\.0\.0/)
    })

    it('should execute greet command', async () => {
      const result = await runLocalCitty({ args: ['greet', 'Alice'] })

      result
        .expectSuccess()
        .expectOutput(/Hello, Alice/)
        .expectNoStderr()
    })

    it('should execute greet command with options', async () => {
      const result = await runLocalCitty({
        args: ['greet', 'Bob', '--count', '3', '--verbose']
      })

      result
        .expectSuccess()
        .expectOutput(/Verbose mode enabled/)
        .expectOutput(/Hello, Bob! \(1\/3\)/)
        .expectOutput(/Hello, Bob! \(2\/3\)/)
        .expectOutput(/Hello, Bob! \(3\/3\)/)
    })

    it('should execute math add command', async () => {
      const result = await runLocalCitty({ args: ['math', 'add', '5', '3'] })

      result
        .expectSuccess()
        .expectOutput(/5 \+ 3 = 8/)
        .expectNoStderr()
    })

    it('should execute math multiply command', async () => {
      const result = await runLocalCitty({ args: ['math', 'multiply', '4', '7'] })

      result
        .expectSuccess()
        .expectOutput(/4 × 7 = 28/)
        .expectNoStderr()
    })

    it('should handle JSON output', async () => {
      const result = await runLocalCitty({
        args: ['greet', 'Charlie', '--json']
      })

      result
        .expectSuccess()
        .expectJson((json) => {
          expect(json.message).toBe('Hello, Charlie!')
          expect(json.count).toBe(1)
          expect(json.verbose).toBe(false)
        })
    })

    it('should handle invalid commands gracefully', async () => {
      const result = await runLocalCitty({ args: ['invalid-command'] })

      result
        .expectFailure()
        .expectStderr(/Unknown command/)
    })
  })

  describe('Error Handling', () => {
    it('should handle generic errors', async () => {
      const result = await runLocalCitty({ args: ['error', 'generic'] })

      result
        .expectFailure()
        .expectStderr(/Generic error occurred/)
    })

    it('should handle validation errors', async () => {
      const result = await runLocalCitty({ args: ['error', 'validation'] })

      result
        .expectFailure()
        .expectStderr(/Validation error/)
    })

    it('should handle timeout errors', async () => {
      const result = await runLocalCitty({
        args: ['error', 'timeout'],
        timeout: 1000
      })

      result.expectFailure()
    }, 15000)
  })

  describe('Environment Variables', () => {
    it('should support custom environment variables', async () => {
      const result = await runLocalCitty({
        args: ['greet', 'Test'],
        env: { DEBUG: '1', TEST_MODE: 'true' }
      })

      result
        .expectSuccess()
        .expectOutput(/Hello, Test/)
    })
  })
})
