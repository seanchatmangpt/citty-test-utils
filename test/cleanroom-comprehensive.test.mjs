#!/usr/bin/env node
// test/cleanroom-comprehensive.test.mjs - Comprehensive cleanroom testing

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupCleanroom, runCitty, teardownCleanroom } from '../index.js'

describe('Cleanroom Comprehensive Tests', () => {
  beforeAll(async () => {
    await setupCleanroom({ rootDir: '.', timeout: 60000 })
  })

  afterAll(async () => {
    await teardownCleanroom()
  })

  describe('Gen Command Cleanroom Functionality', () => {
    it('should generate project in isolated cleanroom directory', async () => {
      const result = await runCitty(['gen', 'project', 'cleanroom-project'], {
        env: {},
        timeout: 15000,
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated complete project: cleanroom-project')
      expect(result.stdout).toContain('/tmp/citty-project')
      expect(result.stdout).toContain('cleanroom container')
      expect(result.stdout).toContain('Environment: cleanroom')
    })

    it('should generate scenario in isolated cleanroom directory', async () => {
      const result = await runCitty(['gen', 'scenario', 'cleanroom-scenario'], {
        env: {},
        timeout: 10000,
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated scenario template: cleanroom-scenario')
      expect(result.stdout).toContain('/tmp/citty-scenario')
    })

    it('should generate test file in isolated cleanroom directory', async () => {
      const result = await runCitty(['gen', 'test', 'cleanroom-test'], {
        env: {},
        timeout: 10000,
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated test template: cleanroom-test')
      expect(result.stdout).toContain('/tmp/citty-test')
    })

    it('should generate config in isolated cleanroom directory', async () => {
      const result = await runCitty(['gen', 'config', 'cleanroom-config'], {
        env: {},
        timeout: 20000,
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated config template: cleanroom-config')
      expect(result.stdout).toContain('/tmp/citty-test')
    })

    it('should generate CLI in isolated cleanroom directory', async () => {
      const result = await runCitty(['gen', 'cli', 'cleanroom-cli'], {
        env: {},
        timeout: 20000,
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated CLI template: cleanroom-cli')
      expect(result.stdout).toContain('/tmp/citty-cli')
    })
  })

  describe('Cleanroom Isolation and No Pollution', () => {
    it('should not pollute main project structure', async () => {
      const result = await runCitty(['gen', 'project', 'pollution-test'], {
        env: {},
        timeout: 15000,
      })

      expect(result.exitCode).toBe(0)
      const output = result.stdout

      // Should be in temp directory, not main project
      expect(output).toContain('/tmp/citty-project')
      expect(output).not.toContain('/app/src/')
      expect(output).not.toContain('/app/tests/')
      expect(output).toContain('cleanroom container')
    })

    it('should handle multiple generations without conflicts', async () => {
      const results = await Promise.all([
        runCitty(['gen', 'scenario', 'multi-1'], { env: {}, timeout: 10000 }),
        runCitty(['gen', 'scenario', 'multi-2'], { env: {}, timeout: 10000 }),
        runCitty(['gen', 'test', 'multi-3'], { env: {}, timeout: 10000 }),
      ])

      results.forEach((result, index) => {
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('/tmp/citty-')
      })
    })

    it('should use unique temporary directory names', async () => {
      const result1 = await runCitty(['gen', 'project', 'unique-1'], {
        env: {},
        timeout: 15000,
      })
      const result2 = await runCitty(['gen', 'project', 'unique-2'], {
        env: {},
        timeout: 15000,
      })

      expect(result1.exitCode).toBe(0)
      expect(result2.exitCode).toBe(0)

      // Extract temp directory paths
      const path1 = result1.stdout.match(/\/tmp\/citty-project-[^\/]+/)?.[0]
      const path2 = result2.stdout.match(/\/tmp\/citty-project-[^\/]+/)?.[0]

      expect(path1).toBeDefined()
      expect(path2).toBeDefined()
      expect(path1).not.toBe(path2) // Should be different directories
    })
  })

  describe('Cleanroom Environment Detection', () => {
    it('should detect cleanroom environment correctly', async () => {
      const result = await runCitty(['gen', 'project', 'env-test'], {
        env: {},
        timeout: 15000,
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Environment: cleanroom')
      expect(result.stdout).toContain('🐳 Note: Files created in cleanroom container')
    })

    it('should use cleanroom-specific paths', async () => {
      const result = await runCitty(['gen', 'config', 'path-test'], {
        env: {},
        timeout: 20000,
      })

      expect(result.exitCode).toBe(0)
      const output = result.stdout

      // Should use cleanroom paths
      expect(output).toContain('/tmp/citty-test')
      expect(output).toContain('temporary directory')
      expect(output).not.toContain(process.cwd()) // Should not use local paths
    })
  })

  describe('Cleanroom Performance and Reliability', () => {
    it('should complete file generation within reasonable time', async () => {
      const startTime = Date.now()

      const result = await runCitty(['gen', 'project', 'perf-test'], {
        env: {},
        timeout: 15000,
      })

      const duration = Date.now() - startTime

      expect(result.exitCode).toBe(0)
      expect(duration).toBeLessThan(10000) // Should complete within 10 seconds
    })

    it('should handle concurrent file generation', async () => {
      const startTime = Date.now()

      const results = await Promise.all([
        runCitty(['gen', 'scenario', 'concurrent-1'], { env: {}, timeout: 10000 }),
        runCitty(['gen', 'scenario', 'concurrent-2'], { env: {}, timeout: 10000 }),
        runCitty(['gen', 'test', 'concurrent-3'], { env: {}, timeout: 10000 }),
      ])

      const duration = Date.now() - startTime

      results.forEach((result) => {
        expect(result.exitCode).toBe(0)
      })

      expect(duration).toBeLessThan(15000) // Should complete within 15 seconds
    })
  })
})
