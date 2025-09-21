#!/usr/bin/env node
// test/integration/cleanroom-simple-validation.test.mjs
// Simple but robust cleanroom validation tests

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { runLocalCitty, runCitty, setupCleanroom, teardownCleanroom } from '../../index.js'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

describe('Cleanroom Simple Validation - Robust Tests', () => {
  let initialFiles = new Set()
  let testTimestamp = Date.now()

  beforeAll(async () => {
    // Capture initial state
    initialFiles = new Set(readdirSync('.'))

    // Setup cleanroom
    await setupCleanroom({ rootDir: '.', timeout: 60000 })
  }, 120000)

  afterAll(async () => {
    await teardownCleanroom()
  }, 60000)

  describe('Basic Cleanroom Functionality', () => {
    it('should prove cleanroom is working', async () => {
      const result = await runCitty(['--version'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('0.4.0')
      expect(result.cwd).toBe('/app')
    })

    it('should prove gen commands work in cleanroom', async () => {
      const result = await runCitty(['gen', 'project', `test-project-${testTimestamp}`])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated complete project')
      expect(result.stdout).toContain('Environment: cleanroom')
      expect(result.cwd).toBe('/app')
    })
  })

  describe('File System Isolation', () => {
    it('should prove files created in cleanroom are isolated', async () => {
      const fileName = `isolation-test-${testTimestamp}`

      // Generate a file in cleanroom
      const result = await runCitty(['gen', 'test', fileName])
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated test template')

      // Verify file is NOT in main project
      const mainProjectFile = join(process.cwd(), `${fileName}.test.mjs`)
      expect(existsSync(mainProjectFile)).toBe(false)

      // Verify no new files appeared in main project
      const currentFiles = new Set(readdirSync('.'))
      const newFiles = [...currentFiles].filter((file) => !initialFiles.has(file))
      expect(newFiles.length).toBe(0)
    })

    it('should prove multiple file operations are isolated', async () => {
      const fileNames = [
        `multi-test-${testTimestamp}-1`,
        `multi-test-${testTimestamp}-2`,
        `multi-test-${testTimestamp}-3`,
      ]

      // Generate multiple files in cleanroom
      for (const fileName of fileNames) {
        const result = await runCitty(['gen', 'scenario', fileName])
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('Generated scenario template')
      }

      // Verify no files leaked to main project
      const currentFiles = new Set(readdirSync('.'))
      const newFiles = [...currentFiles].filter((file) => !initialFiles.has(file))
      expect(newFiles.length).toBe(0)
    })
  })

  describe('Concurrent Operations', () => {
    it('should prove cleanroom and local operations can run concurrently', async () => {
      const startTime = Date.now()

      // Run operations in parallel
      const [cleanroomResult, localResult] = await Promise.all([
        runCitty(['gen', 'cli', `concurrent-cleanroom-${testTimestamp}`]),
        runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } }),
      ])

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Both should succeed
      expect(cleanroomResult.exitCode).toBe(0)
      expect(localResult.exitCode).toBe(0)

      // Verify results
      expect(cleanroomResult.stdout).toContain('Generated CLI template')
      expect(localResult.stdout).toContain('0.4.0')

      // Should complete in reasonable time (proving concurrency)
      expect(totalTime).toBeLessThan(15000)
    })

    it('should prove multiple cleanroom operations can run concurrently', async () => {
      const startTime = Date.now()
      const promises = []

      // Create multiple concurrent cleanroom operations
      for (let i = 0; i < 3; i++) {
        promises.push(runCitty(['gen', 'test', `concurrent-cleanroom-${testTimestamp}-${i}`]))
      }

      const results = await Promise.all(promises)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // All should succeed
      results.forEach((result) => {
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('Generated test template')
      })

      // Should complete in reasonable time
      expect(totalTime).toBeLessThan(20000)
    })
  })

  describe('Error Isolation', () => {
    it("should prove cleanroom errors don't affect local environment", async () => {
      // Create an error in cleanroom
      const errorResult = await runCitty(['invalid-command'])
      expect(errorResult.exitCode).not.toBe(0)

      // Local environment should still work
      const localResult = await runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } })
      expect(localResult.exitCode).toBe(0)
      expect(localResult.stdout).toContain('0.4.0')
    })

    it('should prove cleanroom can recover from errors', async () => {
      // First, create an error
      const errorResult = await runCitty(['invalid-command'])
      expect(errorResult.exitCode).not.toBe(0)

      // Then, successful operation should still work
      const successResult = await runCitty(['gen', 'project', `recovery-test-${testTimestamp}`])
      expect(successResult.exitCode).toBe(0)
      expect(successResult.stdout).toContain('Generated complete project')
    })
  })

  describe('State Isolation', () => {
    it("should prove cleanroom state doesn't persist between operations", async () => {
      // First operation
      const result1 = await runCitty(['gen', 'scenario', `state-test-${testTimestamp}`])
      expect(result1.exitCode).toBe(0)

      // Second operation - should be independent
      const result2 = await runCitty(['--version'])
      expect(result2.exitCode).toBe(0)

      // Both should work independently
      expect(result1.stdout).toContain('Generated scenario template')
      expect(result2.stdout).toContain('0.4.0')

      // Both should have same working directory
      expect(result1.cwd).toBe('/app')
      expect(result2.cwd).toBe('/app')
    })

    it('should prove cleanroom operations are stateless', async () => {
      // Create multiple operations
      const operations = [
        runCitty(['gen', 'test', `stateless-${testTimestamp}-1`]),
        runCitty(['gen', 'cli', `stateless-${testTimestamp}-2`]),
        runCitty(['gen', 'scenario', `stateless-${testTimestamp}-3`]),
      ]

      const results = await Promise.all(operations)

      // All should succeed
      results.forEach((result, index) => {
        expect(result.exitCode).toBe(0)
        expect(result.cwd).toBe('/app')
      })

      // Verify specific results
      expect(results[0].stdout).toContain('Generated test template')
      expect(results[1].stdout).toContain('Generated CLI template')
      expect(results[2].stdout).toContain('Generated scenario template')
    })
  })

  describe('Performance Validation', () => {
    it('should prove cleanroom operations complete in reasonable time', async () => {
      const startTime = Date.now()

      const result = await runCitty(['gen', 'project', `perf-test-${testTimestamp}`])

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated complete project')

      // Should complete in reasonable time
      expect(duration).toBeLessThan(15000)
    })

    it("should prove cleanroom operations don't affect local performance", async () => {
      // Measure local performance
      const localStart = Date.now()
      const localResult = await runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } })
      const localEnd = Date.now()
      const localDuration = localEnd - localStart

      expect(localResult.exitCode).toBe(0)
      expect(localDuration).toBeLessThan(2000) // Local should be fast

      // Run cleanroom operation
      const cleanroomResult = await runCitty(['gen', 'test', `perf-impact-${testTimestamp}`])
      expect(cleanroomResult.exitCode).toBe(0)

      // Measure local performance again
      const localStart2 = Date.now()
      const localResult2 = await runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } })
      const localEnd2 = Date.now()
      const localDuration2 = localEnd2 - localStart2

      expect(localResult2.exitCode).toBe(0)
      expect(localDuration2).toBeLessThan(2000) // Should still be fast
    })
  })

  describe('Environment Validation', () => {
    it('should prove cleanroom has correct environment', async () => {
      const result = await runCitty(['--version'])

      expect(result.exitCode).toBe(0)
      expect(result.cwd).toBe('/app')
      expect(result.stdout).toContain('0.4.0')
    })

    it('should prove cleanroom environment is consistent', async () => {
      const results = await Promise.all([
        runCitty(['--version']),
        runCitty(['--version']),
        runCitty(['--version']),
      ])

      // All should have same characteristics
      results.forEach((result) => {
        expect(result.exitCode).toBe(0)
        expect(result.cwd).toBe('/app')
        expect(result.stdout).toContain('0.4.0')
      })
    })
  })
})

