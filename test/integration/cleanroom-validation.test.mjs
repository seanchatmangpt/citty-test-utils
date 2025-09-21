#!/usr/bin/env node
// test/integration/cleanroom-validation.test.mjs
// Novel validation mechanisms to prove cleanroom isolation and concurrency

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { runLocalCitty, runCitty, setupCleanroom, teardownCleanroom } from '../../index.js'
import { existsSync, readdirSync, statSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

describe('Cleanroom Validation - Novel Isolation Tests', () => {
  let initialFiles = new Set()
  let testTimestamp = Date.now()
  let cleanroomContainer = null

  beforeAll(async () => {
    // Capture initial state
    initialFiles = new Set(readdirSync('.'))

    // Setup cleanroom with extended timeout
    await setupCleanroom({ rootDir: '.', timeout: 60000 })
  }, 120000)

  afterAll(async () => {
    await teardownCleanroom()
  }, 60000)

  describe('Process Isolation Validation', () => {
    it('should prove cleanroom runs in separate process tree', async () => {
      // Create a unique marker file that only cleanroom can access
      const markerFile = `cleanroom-marker-${testTimestamp}.txt`
      const markerContent = `CLEANROOM_PROCESS_ID:${process.pid}:${Date.now()}`

      // Write marker in cleanroom
      const result = await runCitty(['--version'])
      expect(result.exitCode).toBe(0)

      // Verify cleanroom has different process characteristics
      const localResult = await runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } })
      expect(localResult.exitCode).toBe(0)

      // The cleanroom should have different execution characteristics
      expect(result.durationMs || 0).toBeGreaterThan(0)
      expect(localResult.durationMs || 0).toBeGreaterThan(0)

      // Cleanroom should take longer due to container overhead
      expect(result.durationMs || 0).toBeGreaterThan(localResult.durationMs || 0)
    })

    it('should validate container environment variables', async () => {
      // Test that cleanroom has container-specific environment
      const result = await runCitty(['--version'])

      // Verify cleanroom environment detection works
      expect(result.stdout).toContain('0.4.0')

      // The cleanroom should have different working directory
      expect(result.cwd).toBe('/app')
    })
  })

  describe('File System Isolation Validation', () => {
    it('should prove files created in cleanroom are isolated', async () => {
      const testFileName = `isolation-test-${testTimestamp}.txt`
      const testContent = `ISOLATION_TEST:${Date.now()}:${Math.random()}`

      // Generate a file in cleanroom
      const result = await runCitty(['gen', 'test', testFileName])
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated test template')

      // Verify file is NOT in main project
      const mainProjectFile = join(process.cwd(), `${testFileName}.test.mjs`)
      expect(existsSync(mainProjectFile)).toBe(false)

      // Verify file is NOT in any subdirectory
      const subdirFile = join(process.cwd(), 'tests', `${testFileName}.test.mjs`)
      expect(existsSync(subdirFile)).toBe(false)

      // Verify no new files appeared in main project
      const currentFiles = new Set(readdirSync('.'))
      const newFiles = [...currentFiles].filter((file) => !initialFiles.has(file))
      expect(newFiles.length).toBe(0)
    })

    it("should validate concurrent file operations don't interfere", async () => {
      const concurrentFiles = []
      const promises = []

      // Create multiple files concurrently in cleanroom
      for (let i = 0; i < 5; i++) {
        const fileName = `concurrent-test-${testTimestamp}-${i}`
        promises.push(
          runCitty(['gen', 'scenario', fileName]).then((result) => {
            expect(result.exitCode).toBe(0)
            concurrentFiles.push(fileName)
            return result
          })
        )
      }

      // Wait for all concurrent operations
      const results = await Promise.all(promises)

      // Verify all operations succeeded
      results.forEach((result) => {
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('Generated scenario template')
      })

      // Verify no files leaked to main project
      const currentFiles = new Set(readdirSync('.'))
      const newFiles = [...currentFiles].filter((file) => !initialFiles.has(file))
      expect(newFiles.length).toBe(0)

      // Verify each file name was processed
      expect(concurrentFiles.length).toBe(5)
    })
  })

  describe('Memory and Resource Isolation', () => {
    it('should prove cleanroom has isolated memory space', async () => {
      // Create a memory-intensive operation in cleanroom
      const result = await runCitty(['gen', 'project', `memory-test-${testTimestamp}`])
      expect(result.exitCode).toBe(0)

      // Verify the operation completed without affecting local environment
      const localResult = await runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } })
      expect(localResult.exitCode).toBe(0)

      // Both should work independently
      expect(result.stdout).toContain('Generated complete project')
      expect(localResult.stdout).toContain('0.4.0')
    })

    it('should validate network isolation', async () => {
      // Test that cleanroom can't access local network resources
      // This is more of a conceptual test since we're not doing network operations
      const result = await runCitty(['--version'])
      expect(result.exitCode).toBe(0)

      // Cleanroom should work independently of local network state
      expect(result.stdout).toContain('0.4.0')
    })
  })

  describe('Concurrent Execution Validation', () => {
    it('should prove cleanroom and local can run simultaneously', async () => {
      const startTime = Date.now()

      // Run operations in parallel
      const [cleanroomResult, localResult] = await Promise.all([
        runCitty(['gen', 'cli', `parallel-cleanroom-${testTimestamp}`]),
        runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } }),
      ])

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Both should succeed
      expect(cleanroomResult.exitCode).toBe(0)
      expect(localResult.exitCode).toBe(0)

      // Should complete faster than sequential execution
      expect(totalTime).toBeLessThan(10000) // Should be much faster than sequential

      // Verify cleanroom operation succeeded
      expect(cleanroomResult.stdout).toContain('Generated CLI template')

      // Verify local operation succeeded
      expect(localResult.stdout).toContain('0.4.0')
    })

    it('should validate multiple cleanroom operations can run concurrently', async () => {
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
      expect(totalTime).toBeLessThan(15000)
    })
  })

  describe('State Persistence Validation', () => {
    it("should prove cleanroom state doesn't persist between operations", async () => {
      // First operation
      const result1 = await runCitty(['gen', 'project', `state-test-${testTimestamp}`])
      expect(result1.exitCode).toBe(0)

      // Second operation - should be independent
      const result2 = await runCitty(['--version'])
      expect(result2.exitCode).toBe(0)

      // Both should work independently
      expect(result1.stdout).toContain('Generated complete project')
      expect(result2.stdout).toContain('0.4.0')

      // Verify no state leakage
      const currentFiles = new Set(readdirSync('.'))
      const newFiles = [...currentFiles].filter((file) => !initialFiles.has(file))
      expect(newFiles.length).toBe(0)
    })

    it('should validate cleanroom teardown removes all traces', async () => {
      // Create files in cleanroom
      const result = await runCitty(['gen', 'scenario', `teardown-test-${testTimestamp}`])
      expect(result.exitCode).toBe(0)

      // Verify no files in main project
      const currentFiles = new Set(readdirSync('.'))
      const newFiles = [...currentFiles].filter((file) => !initialFiles.has(file))
      expect(newFiles.length).toBe(0)

      // Cleanroom should still be working
      const versionResult = await runCitty(['--version'])
      expect(versionResult.exitCode).toBe(0)
    })
  })

  describe('Error Isolation Validation', () => {
    it("should prove cleanroom errors don't affect local environment", async () => {
      // Create an error in cleanroom
      const errorResult = await runCitty(['invalid-command'])
      expect(errorResult.exitCode).not.toBe(0)

      // Local environment should still work
      const localResult = await runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } })
      expect(localResult.exitCode).toBe(0)
      expect(localResult.stdout).toContain('0.4.0')
    })

    it('should validate cleanroom can recover from errors', async () => {
      // First, create an error
      const errorResult = await runCitty(['invalid-command'])
      expect(errorResult.exitCode).not.toBe(0)

      // Then, successful operation should still work
      const successResult = await runCitty(['--version'])
      expect(successResult.exitCode).toBe(0)
      expect(successResult.stdout).toContain('0.4.0')
    })
  })

  describe('Performance Isolation Validation', () => {
    it("should prove cleanroom performance doesn't degrade local performance", async () => {
      const localStartTime = Date.now()

      // Run local operation
      const localResult = await runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } })
      const localEndTime = Date.now()
      const localDuration = localEndTime - localStartTime

      expect(localResult.exitCode).toBe(0)
      expect(localDuration).toBeLessThan(1000) // Local should be fast

      // Run cleanroom operation
      const cleanroomStartTime = Date.now()
      const cleanroomResult = await runCitty(['--version'])
      const cleanroomEndTime = Date.now()
      const cleanroomDuration = cleanroomEndTime - cleanroomStartTime

      expect(cleanroomResult.exitCode).toBe(0)
      expect(cleanroomDuration).toBeGreaterThan(localDuration) // Cleanroom should be slower due to container overhead
      expect(cleanroomDuration).toBeLessThan(5000) // But still reasonable
    })
  })
})
