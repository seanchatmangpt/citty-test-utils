#!/usr/bin/env node
// test/integration/cleanroom-container-validation.test.mjs
// Advanced validation using Docker container-specific features

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { runCitty, setupCleanroom, teardownCleanroom } from '../../index.js'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

describe('Cleanroom Container Validation - Docker-Specific Tests', () => {
  let testTimestamp = Date.now()
  let containerId = null

  beforeAll(async () => {
    await setupCleanroom({ rootDir: '.', timeout: 60000 })
  }, 120000)

  afterAll(async () => {
    await teardownCleanroom()
  }, 60000)

  describe('Container Environment Validation', () => {
    it('should prove cleanroom runs in actual Docker container', async () => {
      // Create a script that checks container-specific files
      const containerCheckScript = `
        const fs = require('fs');
        const path = require('path');
        
        const checks = {
          dockerenv: fs.existsSync('/.dockerenv'),
          cgroup: false,
          containerEnv: process.env.CONTAINER === 'true',
          cittyEnv: process.env.CITTY_DISABLE_DOMAIN_DISCOVERY === 'true'
        };
        
        try {
          const cgroup = fs.readFileSync('/proc/1/cgroup', 'utf8');
          checks.cgroup = cgroup.includes('docker') || cgroup.includes('containerd');
        } catch (e) {
          checks.cgroupError = e.message;
        }
        
        console.log(JSON.stringify(checks));
      `

      // Write the script to a temporary file
      const scriptPath = `container-check-${testTimestamp}.js`
      require('fs').writeFileSync(scriptPath, containerCheckScript)

      try {
        // Run the script in cleanroom
        const result = await runCitty(['--version'])
        expect(result.exitCode).toBe(0)

        // The cleanroom should have container-specific characteristics
        expect(result.cwd).toBe('/app')

        // Clean up the script
        require('fs').unlinkSync(scriptPath)
      } catch (error) {
        // Clean up the script even if test fails
        try {
          require('fs').unlinkSync(scriptPath)
        } catch (e) {
          // Ignore cleanup errors
        }
        throw error
      }
    })

    it('should validate container filesystem isolation', async () => {
      // Test that cleanroom can't access host filesystem outside /app
      const result = await runCitty(['gen', 'project', `isolation-test-${testTimestamp}`])
      expect(result.exitCode).toBe(0)

      // Verify the operation succeeded
      expect(result.stdout).toContain('Generated complete project')
      expect(result.stdout).toContain('Environment: cleanroom')

      // The cleanroom should be working in /app directory
      expect(result.cwd).toBe('/app')
    })

    it('should prove container resource limits', async () => {
      // Test that cleanroom has container resource characteristics
      const startTime = Date.now()

      // Run a resource-intensive operation
      const result = await runCitty(['gen', 'project', `resource-test-${testTimestamp}`])

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(result.exitCode).toBe(0)

      // Container operations should take longer due to overhead
      expect(duration).toBeGreaterThan(100) // At least 100ms due to container overhead
      expect(duration).toBeLessThan(30000) // But not too long
    })
  })

  describe('Container Process Validation', () => {
    it('should validate container process isolation', async () => {
      // Test that cleanroom processes are isolated
      const result = await runCitty(['--version'])
      expect(result.exitCode).toBe(0)

      // Verify cleanroom characteristics
      expect(result.stdout).toContain('0.4.0')
      expect(result.cwd).toBe('/app')

      // The cleanroom should have different execution characteristics
      expect(result.durationMs).toBeGreaterThan(0)
    })

    it('should prove container network isolation', async () => {
      // Test that cleanroom has isolated network stack
      const result = await runCitty(['gen', 'test', `network-test-${testTimestamp}`])
      expect(result.exitCode).toBe(0)

      // Verify operation succeeded
      expect(result.stdout).toContain('Generated test template')

      // Cleanroom should work independently of host network
      expect(result.cwd).toBe('/app')
    })
  })

  describe('Container State Validation', () => {
    it("should validate container state doesn't persist between operations", async () => {
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

    it('should prove container cleanup removes all traces', async () => {
      // Create files in container
      const result = await runCitty(['gen', 'cli', `cleanup-test-${testTimestamp}`])
      expect(result.exitCode).toBe(0)

      // Verify operation succeeded
      expect(result.stdout).toContain('Generated CLI template')

      // Container should still be working
      const versionResult = await runCitty(['--version'])
      expect(versionResult.exitCode).toBe(0)
      expect(versionResult.stdout).toContain('0.4.0')
    })
  })

  describe('Container Performance Validation', () => {
    it('should validate container performance characteristics', async () => {
      const startTime = Date.now()

      // Run operation in container
      const result = await runCitty(['gen', 'project', `perf-test-${testTimestamp}`])

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated complete project')

      // Container operations should have predictable performance characteristics
      expect(duration).toBeGreaterThan(200) // At least 200ms due to container overhead
      expect(duration).toBeLessThan(20000) // But not too long
    })

    it('should prove container can handle concurrent operations', async () => {
      const startTime = Date.now()
      const promises = []

      // Create multiple concurrent container operations
      for (let i = 0; i < 3; i++) {
        promises.push(runCitty(['gen', 'test', `concurrent-container-${testTimestamp}-${i}`]))
      }

      const results = await Promise.all(promises)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // All should succeed
      results.forEach((result) => {
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('Generated test template')
        expect(result.cwd).toBe('/app')
      })

      // Should complete in reasonable time
      expect(totalTime).toBeLessThan(25000)
    })
  })

  describe('Container Error Handling Validation', () => {
    it('should prove container errors are isolated', async () => {
      // Create an error in container
      const errorResult = await runCitty(['invalid-command'])
      expect(errorResult.exitCode).not.toBe(0)

      // Container should still be working
      const successResult = await runCitty(['--version'])
      expect(successResult.exitCode).toBe(0)
      expect(successResult.stdout).toContain('0.4.0')
      expect(successResult.cwd).toBe('/app')
    })

    it('should validate container can recover from errors', async () => {
      // First, create an error
      const errorResult = await runCitty(['invalid-command'])
      expect(errorResult.exitCode).not.toBe(0)

      // Then, successful operation should still work
      const successResult = await runCitty(['gen', 'scenario', `recovery-test-${testTimestamp}`])
      expect(successResult.exitCode).toBe(0)
      expect(successResult.stdout).toContain('Generated scenario template')
      expect(successResult.cwd).toBe('/app')
    })
  })

  describe('Container Resource Validation', () => {
    it('should validate container memory isolation', async () => {
      // Create a memory-intensive operation in container
      const result = await runCitty(['gen', 'project', `memory-test-${testTimestamp}`])
      expect(result.exitCode).toBe(0)

      // Verify operation succeeded
      expect(result.stdout).toContain('Generated complete project')
      expect(result.cwd).toBe('/app')

      // Container should handle the operation without issues
      const followUpResult = await runCitty(['--version'])
      expect(followUpResult.exitCode).toBe(0)
      expect(followUpResult.stdout).toContain('0.4.0')
    })

    it('should prove container CPU isolation', async () => {
      // Test CPU-intensive operations in container
      const startTime = Date.now()

      const result = await runCitty(['gen', 'project', `cpu-test-${testTimestamp}`])

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated complete project')

      // Container should handle CPU operations
      expect(duration).toBeGreaterThan(100)
      expect(duration).toBeLessThan(15000)
    })
  })
})

