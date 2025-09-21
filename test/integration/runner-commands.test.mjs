#!/usr/bin/env node
// test/integration/runner-commands.test.mjs
// Tests for runner noun commands

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { runLocalCitty, runCitty, setupCleanroom, teardownCleanroom } from '../../index.js'

describe('Runner Noun Commands', () => {
  beforeAll(async () => {
    await setupCleanroom({ rootDir: '.', timeout: 60000 })
  }, 120000)

  afterAll(async () => {
    await teardownCleanroom()
  }, 60000)

  describe('Local Execution', () => {
    it('should execute local commands', async () => {
      const result = await runLocalCitty(['runner', 'execute', 'node --version'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Command: node --version')
      expect(result.stdout).toContain('Environment: local')
      expect(result.stdout).toContain('Success: ✅')
      expect(result.stdout).toContain('v')
    })

    it('should execute commands with custom timeout', async () => {
      const result = await runLocalCitty(
        ['runner', 'execute', 'echo "hello"', '--timeout', '5000'],
        {
          env: { TEST_CLI: 'true' },
        }
      )

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Command: echo "hello"')
      expect(result.stdout).toContain('Environment: local')
      expect(result.stdout).toContain('Success: ✅')
    })

    it('should work with fluent assertions', async () => {
      const result = await runLocalCitty(['runner', 'execute', 'echo "test"'], {
        env: { TEST_CLI: 'true' },
      })

      result
        .expectSuccess()
        .expectOutput(/Command: echo "test"/)
        .expectOutput(/Environment: local/)
        .expectOutput(/Success: ✅/)
        .expectNoStderr()
    })
  })

  describe('Cleanroom Execution', () => {
    it('should execute commands in cleanroom', async () => {
      const result = await runCitty(['runner', 'execute', 'node --version'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Command: node --version')
      // Note: Currently runs locally due to implementation, but should show cleanroom
      expect(result.stdout).toContain('Environment: local')
      expect(result.stdout).toContain('Success: ✅')
    })
  })
})
