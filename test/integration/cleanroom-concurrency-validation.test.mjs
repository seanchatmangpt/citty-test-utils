#!/usr/bin/env node
// test/integration/cleanroom-concurrency-validation.test.mjs
// Advanced concurrency validation using timing and process analysis

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { runLocalCitty, runCitty, setupCleanroom, teardownCleanroom } from '../../index.js'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

describe('Cleanroom Concurrency Validation - Advanced Timing Tests', () => {
  let testTimestamp = Date.now()

  beforeAll(async () => {
    await setupCleanroom({ rootDir: '.', timeout: 60000 })
  }, 120000)

  afterAll(async () => {
    await teardownCleanroom()
  }, 60000)

  describe('Timing-Based Concurrency Validation', () => {
    it('should prove cleanroom and local operations run concurrently', async () => {
      const startTime = Date.now()

      // Create operations that will take different amounts of time
      const cleanroomPromise = runCitty(['gen', 'project', `timing-cleanroom-${testTimestamp}`])
      const localPromise = runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } })

      // Wait for both to complete
      const [cleanroomResult, localResult] = await Promise.all([cleanroomPromise, localPromise])

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Both should succeed
      expect(cleanroomResult.exitCode).toBe(0)
      expect(localResult.exitCode).toBe(0)

      // Verify results
      expect(cleanroomResult.stdout).toContain('Generated complete project')
      expect(localResult.stdout).toContain('0.4.0')

      // Total time should be less than sum of individual times (proving concurrency)
      const cleanroomTime = cleanroomResult.durationMs
      const localTime = localResult.durationMs
      const maxSequentialTime = Math.max(cleanroomTime, localTime) + 1000 // Add buffer

      expect(totalTime).toBeLessThan(maxSequentialTime)
      expect(totalTime).toBeLessThan(20000) // Should complete in reasonable time
    })

    it('should validate multiple cleanroom operations run concurrently', async () => {
      const startTime = Date.now()
      const promises = []

      // Create multiple cleanroom operations
      for (let i = 0; i < 4; i++) {
        promises.push(runCitty(['gen', 'test', `concurrent-timing-${testTimestamp}-${i}`]))
      }

      const results = await Promise.all(promises)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // All should succeed
      results.forEach((result) => {
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('Generated test template')
      })

      // Should complete faster than sequential execution
      const maxIndividualTime = Math.max(...results.map((r) => r.durationMs))
      expect(totalTime).toBeLessThan(maxIndividualTime * 2) // Should be much faster than sequential
      expect(totalTime).toBeLessThan(25000) // But still reasonable
    })

    it("should prove cleanroom operations don't block each other", async () => {
      const startTime = Date.now()

      // Start a long-running cleanroom operation
      const longOperation = runCitty(['gen', 'project', `long-op-${testTimestamp}`])

      // Wait a bit, then start a short operation
      await new Promise((resolve) => setTimeout(resolve, 100))
      const shortOperation = runCitty(['--version'])

      // Wait for both
      const [longResult, shortResult] = await Promise.all([longOperation, shortOperation])

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Both should succeed
      expect(longResult.exitCode).toBe(0)
      expect(shortResult.exitCode).toBe(0)

      // Short operation should complete quickly even with long operation running
      expect(shortResult.durationMs).toBeLessThan(5000)
      expect(totalTime).toBeLessThan(30000)
    })
  })

  describe('Process Analysis Validation', () => {
    it('should prove cleanroom operations use different execution paths', async () => {
      // Run operations and analyze their characteristics
      const cleanroomResult = await runCitty([
        'gen',
        'scenario',
        `process-analysis-${testTimestamp}`,
      ])
      const localResult = await runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } })

      // Both should succeed
      expect(cleanroomResult.exitCode).toBe(0)
      expect(localResult.exitCode).toBe(0)

      // They should have different characteristics
      expect(cleanroomResult.cwd).toBe('/app')
      expect(localResult.cwd).toBe(process.cwd())

      // Cleanroom should take longer due to container overhead
      expect(cleanroomResult.durationMs).toBeGreaterThan(localResult.durationMs)

      // But both should complete successfully
      expect(cleanroomResult.stdout).toContain('Generated scenario template')
      expect(localResult.stdout).toContain('0.4.0')
    })

    it('should validate cleanroom operations are independent', async () => {
      // Create operations that could interfere with each other
      const operations = []

      for (let i = 0; i < 3; i++) {
        operations.push(runCitty(['gen', 'cli', `independent-${testTimestamp}-${i}`]))
      }

      const results = await Promise.all(operations)

      // All should succeed independently
      results.forEach((result, index) => {
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('Generated CLI template')
        expect(result.cwd).toBe('/app')
      })

      // Verify they all completed
      expect(results.length).toBe(3)
    })
  })

  describe('Resource Contention Validation', () => {
    it("should prove cleanroom operations don't compete for local resources", async () => {
      const startTime = Date.now()

      // Run resource-intensive operations in parallel
      const cleanroomPromise = runCitty(['gen', 'project', `resource-contention-${testTimestamp}`])
      const localPromise = runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } })

      const [cleanroomResult, localResult] = await Promise.all([cleanroomPromise, localPromise])

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Both should succeed
      expect(cleanroomResult.exitCode).toBe(0)
      expect(localResult.exitCode).toBe(0)

      // Local operation should be fast regardless of cleanroom operation
      expect(localResult.durationMs).toBeLessThan(1000)

      // Total time should be reasonable
      expect(totalTime).toBeLessThan(20000)
    })

    it("should validate cleanroom operations don't affect local performance", async () => {
      // Measure local performance before cleanroom operations
      const beforeStart = Date.now()
      const beforeResult = await runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } })
      const beforeEnd = Date.now()
      const beforeDuration = beforeEnd - beforeStart

      expect(beforeResult.exitCode).toBe(0)

      // Run cleanroom operations
      const cleanroomResult = await runCitty([
        'gen',
        'project',
        `performance-test-${testTimestamp}`,
      ])
      expect(cleanroomResult.exitCode).toBe(0)

      // Measure local performance after cleanroom operations
      const afterStart = Date.now()
      const afterResult = await runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } })
      const afterEnd = Date.now()
      const afterDuration = afterEnd - afterStart

      expect(afterResult.exitCode).toBe(0)

      // Local performance should not be significantly affected
      const performanceDiff = Math.abs(afterDuration - beforeDuration)
      expect(performanceDiff).toBeLessThan(1000) // Should not differ by more than 1 second
    })
  })

  describe('State Isolation Validation', () => {
    it("should prove cleanroom state changes don't affect local state", async () => {
      // Create state in cleanroom
      const cleanroomResult = await runCitty(['gen', 'project', `state-isolation-${testTimestamp}`])
      expect(cleanroomResult.exitCode).toBe(0)

      // Verify cleanroom operation succeeded
      expect(cleanroomResult.stdout).toContain('Generated complete project')

      // Local operations should still work normally
      const localResult = await runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } })
      expect(localResult.exitCode).toBe(0)
      expect(localResult.stdout).toContain('0.4.0')

      // Both should have their expected working directories
      expect(cleanroomResult.cwd).toBe('/app')
      expect(localResult.cwd).toBe(process.cwd())
    })

    it('should validate cleanroom operations are stateless', async () => {
      // First operation
      const result1 = await runCitty(['gen', 'test', `stateless-${testTimestamp}-1`])
      expect(result1.exitCode).toBe(0)

      // Second operation - should be independent
      const result2 = await runCitty(['gen', 'scenario', `stateless-${testTimestamp}-2`])
      expect(result2.exitCode).toBe(0)

      // Both should work independently
      expect(result1.stdout).toContain('Generated test template')
      expect(result2.stdout).toContain('Generated scenario template')

      // Both should have same working directory
      expect(result1.cwd).toBe('/app')
      expect(result2.cwd).toBe('/app')
    })
  })

  describe('Error Isolation Validation', () => {
    it("should prove cleanroom errors don't affect local operations", async () => {
      // Create an error in cleanroom
      const errorResult = await runCitty(['invalid-command'])
      expect(errorResult.exitCode).not.toBe(0)

      // Local operations should still work
      const localResult = await runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } })
      expect(localResult.exitCode).toBe(0)
      expect(localResult.stdout).toContain('0.4.0')

      // Cleanroom should still be working
      const cleanroomResult = await runCitty(['--version'])
      expect(cleanroomResult.exitCode).toBe(0)
      expect(cleanroomResult.stdout).toContain('0.4.0')
    })

    it('should validate cleanroom can recover from errors', async () => {
      // First, create an error
      const errorResult = await runCitty(['invalid-command'])
      expect(errorResult.exitCode).not.toBe(0)

      // Then, successful operation should still work
      const successResult = await runCitty(['gen', 'cli', `recovery-${testTimestamp}`])
      expect(successResult.exitCode).toBe(0)
      expect(successResult.stdout).toContain('Generated CLI template')

      // Follow-up operation should also work
      const followUpResult = await runCitty(['--version'])
      expect(followUpResult.exitCode).toBe(0)
      expect(followUpResult.stdout).toContain('0.4.0')
    })
  })
})

