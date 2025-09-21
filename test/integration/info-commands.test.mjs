#!/usr/bin/env node
// test/integration/info-commands.test.mjs
// Tests for info noun commands

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { runLocalCitty, runCitty, setupCleanroom, teardownCleanroom } from '../../index.js'

describe('Info Noun Commands', () => {
  beforeAll(async () => {
    await setupCleanroom({ rootDir: '.', timeout: 60000 })
  }, 120000)

  afterAll(async () => {
    await teardownCleanroom()
  }, 60000)

  describe('Version Info', () => {
    it('should show version info', async () => {
      const result = await runLocalCitty(['info', 'version'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Version: 0.4.0')
    })

    it('should show version info in JSON', async () => {
      const result = await runLocalCitty(['info', 'version', '--json'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.json).toBeDefined()
      expect(result.json.version).toBe('0.4.0')
      expect(result.json.name).toBe('ctu')
    })
  })

  describe('Other Info Commands', () => {
    it('should show features info', async () => {
      const result = await runLocalCitty(['info', 'features'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('features information: pending')
    })

    it('should show config info', async () => {
      const result = await runLocalCitty(['info', 'config'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('config information: pending')
    })

    it('should show all info', async () => {
      const result = await runLocalCitty(['info', 'all'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('all information: pending')
    })
  })

  describe('Fluent Assertions', () => {
    it('should work with info version', async () => {
      const result = await runLocalCitty(['info', 'version'], {
        env: { TEST_CLI: 'true' },
      })

      result
        .expectSuccess()
        .expectOutput(/Version: 0\.4\.0/)
        .expectNoStderr()
    })

    it('should work with JSON output', async () => {
      const result = await runLocalCitty(['info', 'version', '--json'], {
        env: { TEST_CLI: 'true' },
      })

      result
        .expectSuccess()
        .expectJson((json) => {
          if (json.version !== '0.4.0') {
            throw new Error(`Expected version '0.4.0', got '${json.version}'`)
          }
          if (json.name !== 'ctu') {
            throw new Error(`Expected name 'ctu', got '${json.name}'`)
          }
        })
        .expectNoStderr()
    })
  })
})
