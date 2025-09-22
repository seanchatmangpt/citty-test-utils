#!/usr/bin/env node
// test/integration/cleanroom-consolidated.test.mjs
// Consolidated cleanroom tests - replaces multiple redundant files

import { describe, it, expect } from 'vitest'
import { runLocalCitty, runCitty } from '../../index.js'
import { getSharedCleanroom, isCleanroomAvailable } from '../setup/shared-cleanroom.mjs'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

describe.concurrent('Cleanroom Consolidated Tests', () => {
  let initialFiles = new Set()
  let testTimestamp = Date.now()

  describe.concurrent('Basic Functionality', () => {
    it('should prove cleanroom is working', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const result = await runCitty(['--version'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('0.5.0')
      expect(result.cwd).toBe('/app')
    })

    it('should prove gen commands work in cleanroom', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const result = await runCitty(['gen', 'project', `test-project-${testTimestamp}`])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated complete project')
      expect(result.stdout).toContain('Environment: cleanroom')
      expect(result.cwd).toBe('/app')
    })
  })

  describe.concurrent('Concurrency Validation', () => {
    it('should prove cleanroom and local operations run concurrently', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const startTime = Date.now()

      const [cleanroomResult, localResult] = await Promise.all([
        runCitty(['gen', 'cli', `concurrent-cleanroom-${testTimestamp}`]),
        runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } }),
      ])

      const endTime = Date.now()
      const totalTime = endTime - startTime

      expect(cleanroomResult.exitCode).toBe(0)
      expect(localResult.exitCode).toBe(0)
      expect(cleanroomResult.stdout).toContain('Generated CLI template')
      expect(localResult.stdout).toContain('0.4.0')
      expect(totalTime).toBeLessThan(15000)
    })

    it('should prove multiple cleanroom operations run concurrently', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const startTime = Date.now()

      const promises = Array.from({ length: 5 }, (_, i) =>
        runCitty(['gen', 'test', `concurrent-cleanroom-${testTimestamp}-${i}`])
      )

      const results = await Promise.all(promises)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      results.forEach((result) => {
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('Generated test template')
      })

      expect(totalTime).toBeLessThan(20000)
    })
  })

  describe.concurrent('Isolation Validation', () => {
    it('should prove files created in cleanroom are isolated', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const fileName = `isolation-test-${testTimestamp}`

      const result = await runCitty(['gen', 'test', fileName])
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated test template')

      const mainProjectFile = join(process.cwd(), `${fileName}.test.mjs`)
      expect(existsSync(mainProjectFile)).toBe(false)
    })

    it("should prove cleanroom errors don't affect local environment", async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const errorResult = await runCitty(['invalid-command'])
      expect(errorResult.exitCode).not.toBe(0)

      const localResult = await runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } })
      expect(localResult.exitCode).toBe(0)
      expect(localResult.stdout).toContain('0.4.0')
    })
  })

  describe.concurrent('Performance Validation', () => {
    it('should prove cleanroom operations complete in reasonable time', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()
      const startTime = Date.now()

      const result = await runCitty(['gen', 'project', `perf-test-${testTimestamp}`])

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated complete project')
      expect(duration).toBeLessThan(15000)
    })

    it('should prove concurrent performance benefits', async () => {
      if (!isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      await getSharedCleanroom()

      // Sequential execution
      const sequentialStart = Date.now()
      for (let i = 0; i < 3; i++) {
        const result = await runCitty(['gen', 'test', `sequential-${testTimestamp}-${i}`])
        expect(result.exitCode).toBe(0)
      }
      const sequentialTime = Date.now() - sequentialStart

      // Concurrent execution
      const concurrentStart = Date.now()
      const promises = Array.from({ length: 3 }, (_, i) =>
        runCitty(['gen', 'test', `concurrent-${testTimestamp}-${i}`])
      )
      const results = await Promise.all(promises)
      const concurrentTime = Date.now() - concurrentStart

      results.forEach((result) => {
        expect(result.exitCode).toBe(0)
      })

      const speedup = sequentialTime / concurrentTime
      expect(speedup).toBeGreaterThan(1.2)
    })
  })
})
