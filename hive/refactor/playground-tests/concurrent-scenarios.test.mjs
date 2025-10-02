import { describe, it, expect } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'

/**
 * Concurrent Testing - Running Tests in Parallel
 *
 * Demonstrates running multiple CLI commands concurrently for faster test execution.
 * Perfect for testing independent commands in parallel!
 */

describe('Concurrent Testing', () => {
  describe('Basic Concurrent Execution', () => {
    it('should run multiple commands in parallel', async () => {
      const [result1, result2, result3] = await Promise.all([
        runLocalCitty({ args: ['greet', 'Alice'] }),
        runLocalCitty({ args: ['greet', 'Bob'] }),
        runLocalCitty({ args: ['math', 'add', '5', '3'] })
      ])

      result1.expectSuccess().expectOutput(/Hello, Alice/)
      result2.expectSuccess().expectOutput(/Hello, Bob/)
      result3.expectSuccess().expectOutput(/5 \+ 3 = 8/)
    })

    it('should handle concurrent JSON operations', async () => {
      const results = await Promise.all([
        runLocalCitty({ args: ['greet', 'Test1', '--json'] }),
        runLocalCitty({ args: ['greet', 'Test2', '--json'] }),
        runLocalCitty({ args: ['math', 'multiply', '4', '7', '--json'] })
      ])

      results.forEach(result => result.expectSuccess())
    })
  })

  describe('Performance Benefits', () => {
    it('should be faster than sequential execution', async () => {
      const startConcurrent = Date.now()
      await Promise.all([
        runLocalCitty({ args: ['greet', 'A'] }),
        runLocalCitty({ args: ['greet', 'B'] }),
        runLocalCitty({ args: ['greet', 'C'] })
      ])
      const concurrentTime = Date.now() - startConcurrent

      const startSequential = Date.now()
      await runLocalCitty({ args: ['greet', 'A'] })
      await runLocalCitty({ args: ['greet', 'B'] })
      await runLocalCitty({ args: ['greet', 'C'] })
      const sequentialTime = Date.now() - startSequential

      console.log(`Concurrent: ${concurrentTime}ms, Sequential: ${sequentialTime}ms`)
      expect(concurrentTime).toBeLessThan(sequentialTime)
    })
  })

  describe('Mixed Success and Failure', () => {
    it('should handle concurrent successes and failures', async () => {
      const [success, failure1, failure2] = await Promise.all([
        runLocalCitty({ args: ['greet', 'Success'] }),
        runLocalCitty({ args: ['error', 'generic'] }),
        runLocalCitty({ args: ['invalid-command'] })
      ])

      success.expectSuccess()
      failure1.expectFailure()
      failure2.expectFailure()
    })
  })

  describe('Concurrent Analysis Commands', () => {
    it('should run analysis commands in parallel', async () => {
      const [discover, analyze] = await Promise.all([
        runLocalCitty({
          args: [
            'analysis', 'discover',
            '--cli-path', 'playground/src/cli.mjs'
          ]
        }),
        runLocalCitty({
          args: [
            'analysis', 'analyze',
            '--cli-path', 'playground/src/cli.mjs',
            '--test-dir', 'playground/test'
          ]
        })
      ])

      discover.expectSuccess()
      analyze.expectSuccess()
    })
  })
})
