#!/usr/bin/env node
// test/integration/main-cli.test.mjs
// Tests for main CLI commands (help, version, etc.)

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { runLocalCitty, runCitty, setupCleanroom, teardownCleanroom } from '../../index.js'

describe('Main CLI Commands', () => {
  beforeAll(async () => {
    await setupCleanroom({ rootDir: '.', timeout: 30000 })
  }, 60000)

  afterAll(async () => {
    await teardownCleanroom()
  }, 30000)

  describe('Help and Version', () => {
    it('should show help with noun-verb structure', async () => {
      const result = await runLocalCitty(['--show-help'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('ctu')
      expect(result.stdout).toContain('USAGE')
      expect(result.stdout).toContain('test')
      expect(result.stdout).toContain('gen')
      expect(result.stdout).toContain('runner')
      expect(result.stdout).toContain('info')
      expect(result.stdout).toContain('analysis')
    })

    it('should show version information', async () => {
      const result = await runLocalCitty(['--show-version'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatch(/0\.4\.0/)
    })

    it('should support JSON output', async () => {
      const result = await runLocalCitty(['--show-version', '--json'])

      expect(result.exitCode).toBe(0)
      expect(result.json).toBeDefined()
      expect(result.json.version).toBe('0.4.0')
    })
  })

  describe('Cross-Environment Consistency', () => {
    it('should work consistently between local and cleanroom', async () => {
      const localResult = await runLocalCitty(['--show-version'])
      const cleanroomResult = await runCitty(['--show-version'])

      expect(localResult.exitCode).toBe(cleanroomResult.exitCode)
      expect(localResult.stdout).toBe(cleanroomResult.stdout)
    })
  })
})
