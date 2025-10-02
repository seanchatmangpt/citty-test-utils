import { describe, it, expect } from 'vitest'
import { runLocalCitty, wrapWithAssertions } from 'citty-test-utils'

/**
 * Fluent Assertions - Beautiful Chainable API
 *
 * This demonstrates the power of fluent assertions for clean, readable tests.
 * Chain expectations for maximum clarity!
 */

describe('Fluent Assertions', () => {
  describe('Basic Chaining', () => {
    it('should chain success and output checks', async () => {
      const result = await runLocalCitty({ args: ['greet', 'Alice'] })

      // Beautiful chaining!
      result
        .expectSuccess()
        .expectOutput('Hello, Alice!')
        .expectNoStderr()
    })

    it('should chain with regex patterns', async () => {
      const result = await runLocalCitty({ args: ['greet', 'Bob'] })

      result
        .expectSuccess()
        .expectOutput(/Hello, Bob/)
        .expectOutputLength(10, 50)
    })

    it('should chain failure expectations', async () => {
      const result = await runLocalCitty({ args: ['error', 'generic'] })

      result
        .expectFailure()
        .expectStderr(/Generic error/)
    })
  })

  describe('JSON Assertions', () => {
    it('should validate JSON with inline validator', async () => {
      const result = await runLocalCitty({
        args: ['greet', 'Test', '--json']
      })

      result
        .expectSuccess()
        .expectJson((json) => {
          expect(json.message).toBe('Hello, Test!')
          expect(json.count).toBe(1)
          expect(json.verbose).toBe(false)
        })
        .expectNoStderr()
    })

    it('should chain JSON checks', async () => {
      const result = await runLocalCitty({
        args: ['math', 'add', '5', '3', '--json']
      })

      result
        .expectSuccess()
        .expectJson((json) => {
          expect(json.operation).toBe('add')
          expect(json.a).toBe(5)
          expect(json.b).toBe(3)
          expect(json.result).toBe(8)
        })
    })
  })

  describe('Complex Chaining', () => {
    it('should handle multiple expectations', async () => {
      const result = await runLocalCitty({
        args: ['greet', 'Alice', '--count', '2']
      })

      result
        .expectSuccess()
        .expectOutput(/Hello, Alice/)
        .expectOutput(/\(1\/2\)/)
        .expectOutput(/\(2\/2\)/)
        .expectNoStderr()
        .expectOutputLength(20, 100)
    })

    it('should validate verbose output', async () => {
      const result = await runLocalCitty({
        args: ['greet', 'Test', '--verbose']
      })

      result
        .expectSuccess()
        .expectOutput(/Verbose mode enabled/)
        .expectOutput(/Hello, Test/)
    })
  })

  describe('Using wrapWithAssertions Helper', () => {
    it('should wrap plain results with assertions', async () => {
      // Get a plain result
      const plainResult = await runLocalCitty({
        args: ['greet', 'Test'],
        returnRaw: true  // hypothetical option
      })

      // Wrap it to get fluent API
      const wrapped = wrapWithAssertions(plainResult)

      wrapped
        .expectSuccess()
        .expectOutput(/Hello, Test/)
    })

    it('should enable custom assertion patterns', async () => {
      const result = await runLocalCitty({ args: ['info'] })

      // Custom expectations
      result
        .expectSuccess()
        .expectOutput(/Playground CLI Information/)
        .expectOutputLength(50, 500)
    })
  })

  describe('Error Messages', () => {
    it('should provide clear error for failed expectations', async () => {
      const result = await runLocalCitty({ args: ['greet', 'Test'] })

      expect(() => {
        result.expectOutput(/Not Found/)
      }).toThrow('Expected output to match /Not Found/')
    })

    it('should provide clear error for wrong exit codes', async () => {
      const result = await runLocalCitty({ args: ['greet', 'Test'] })

      expect(() => {
        result.expectFailure()
      }).toThrow('Expected failure (non-zero exit code), got 0')
    })
  })
})
