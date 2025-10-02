#!/usr/bin/env node
/**
 * @fileoverview Improved Cleanroom Tests with Docker availability checking
 * @description Demonstrates proper Docker test patterns with cleanup and skip logic
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { runLocalCitty, runCitty } from '../../index.js'
import { getSharedCleanroom, isCleanroomAvailable } from '../setup/shared-cleanroom.mjs'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

describe.concurrent('Cleanroom Tests with Docker Management', () => {
  let dockerAvailable = false
  let testTimestamp = Date.now()

  beforeAll(async () => {
    console.log('🔍 Checking Docker availability...')

    // Check if Docker is running
    const available = await execAsync('docker info --format "{{.ServerVersion}}"')
      .then(() => true)
      .catch(() => false)

    if (!available) {
      console.warn('⚠️ Docker not available, cleanroom tests will be skipped')
      return
    }

    dockerAvailable = true
    console.log('✅ Docker is available')

    // Clean up any existing test containers
    console.log('🧹 Cleaning up existing test containers...')
    await execAsync('docker rm -f $(docker ps -aq --filter "label=ctu-test") 2>/dev/null || true')

    // Setup shared cleanroom
    await getSharedCleanroom()
  }, 60000)

  afterEach(async () => {
    if (!dockerAvailable) return

    // Clean up after each test to prevent resource leaks
    await execAsync('docker rm -f $(docker ps -aq --filter "label=ctu-test") 2>/dev/null || true')
  })

  afterAll(async () => {
    if (!dockerAvailable) return

    // Final cleanup
    console.log('🧹 Final cleanup of test containers...')
    await execAsync('docker rm -f $(docker ps -aq --filter "label=ctu-test") 2>/dev/null || true')
  }, 30000)

  describe.concurrent('Basic Functionality', () => {
    it('should execute command in cleanroom when Docker is available', async () => {
      if (!dockerAvailable || !isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - Docker/cleanroom not available')
        return
      }

      const result = await runCitty(['--version'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('0.5.0')
      expect(result.cwd).toBe('/app')
    })

    it('should handle gen commands in cleanroom', async () => {
      if (!dockerAvailable || !isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - Docker/cleanroom not available')
        return
      }

      const result = await runCitty(['gen', 'project', `test-project-${testTimestamp}`])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated complete project')
      expect(result.cwd).toBe('/app')
    })
  })

  describe.concurrent('Concurrent Operations', () => {
    it('should run cleanroom and local operations concurrently', async () => {
      if (!dockerAvailable || !isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - Docker/cleanroom not available')
        return
      }

      const startTime = Date.now()

      const [cleanroomResult, localResult] = await Promise.all([
        runCitty(['gen', 'cli', `concurrent-${testTimestamp}`]),
        runLocalCitty(['--version'], { env: { TEST_CLI: 'true' } }),
      ])

      const duration = Date.now() - startTime

      expect(cleanroomResult.exitCode).toBe(0)
      expect(localResult.exitCode).toBe(0)
      expect(duration).toBeLessThan(15000)
    })

    it('should handle multiple concurrent cleanroom operations', async () => {
      if (!dockerAvailable || !isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - Docker/cleanroom not available')
        return
      }

      const startTime = Date.now()

      const promises = Array.from({ length: 3 }, (_, i) =>
        runCitty(['gen', 'test', `concurrent-${testTimestamp}-${i}`])
      )

      const results = await Promise.all(promises)
      const duration = Date.now() - startTime

      results.forEach((result) => {
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('Generated test template')
      })

      expect(duration).toBeLessThan(20000)
    })
  })

  describe.concurrent('Error Handling', () => {
    it('should handle invalid commands gracefully', async () => {
      if (!dockerAvailable || !isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - Docker/cleanroom not available')
        return
      }

      const result = await runCitty(['invalid-command'])

      expect(result.exitCode).not.toBe(0)
    })

    it('should handle timeouts gracefully', async () => {
      if (!dockerAvailable || !isCleanroomAvailable()) {
        console.log('⏭️ Skipping test - Docker/cleanroom not available')
        return
      }

      const result = await runCitty(['--help'], { timeout: 30000 })

      expect(result.exitCode).toBe(0)
      expect(result.durationMs).toBeLessThan(30000)
    })
  })

  describe.concurrent('Resource Management', () => {
    it('should clean up containers properly', async () => {
      if (!dockerAvailable) {
        console.log('⏭️ Skipping test - Docker not available')
        return
      }

      // Get initial container count
      const { stdout: initialContainers } = await execAsync(
        'docker ps -aq --filter "label=ctu-test" | wc -l'
      )

      // Run operation
      if (isCleanroomAvailable()) {
        await runCitty(['--version'])
      }

      // Check container count hasn't increased
      const { stdout: finalContainers } = await execAsync(
        'docker ps -aq --filter "label=ctu-test" | wc -l'
      )

      expect(parseInt(finalContainers)).toBeLessThanOrEqual(parseInt(initialContainers) + 1)
    })
  })
})
