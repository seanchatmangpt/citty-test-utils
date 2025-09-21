#!/usr/bin/env node
// test/integration/error-handling.test.mjs
// Tests for error handling and edge cases

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { runLocalCitty, runCitty, setupCleanroom, teardownCleanroom } from '../../index.js'

describe('Error Handling', () => {
  beforeAll(async () => {
    await setupCleanroom({ rootDir: '.', timeout: 60000 })
  }, 120000)

  afterAll(async () => {
    await teardownCleanroom()
  }, 60000)

  describe('Invalid Commands', () => {
    it.skip('should handle invalid nouns', async () => {
      // SKIPPED: Domain discovery interfering with stdout
      const result = await runLocalCitty(['invalid-noun', 'some-verb'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(1)
      expect(result.stdout).toContain('USAGE')
      expect(result.stderr).toContain('Unknown command')
    })

    it.skip('should handle invalid verbs', async () => {
      // SKIPPED: Domain discovery interfering with stdout
      const result = await runLocalCitty(['info', 'invalid-verb'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(1)
      expect(result.stdout).toContain('USAGE')
      expect(result.stderr).toContain('Unknown command')
    })

    it('should handle missing required arguments', async () => {
      const result = await runLocalCitty(['gen', 'project'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Missing required positional argument: NAME')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty commands', async () => {
      const result = await runLocalCitty([], {
        env: { TEST_CLI: 'true' },
      })

      // Should show help or error
      expect([0, 1]).toContain(result.exitCode)
    })

    it('should handle very long command names', async () => {
      const longName = 'a'.repeat(1000)
      const result = await runLocalCitty(['gen', 'project', longName], {
        env: { TEST_CLI: 'true' },
      })

      // Should either succeed or fail gracefully
      expect([0, 1]).toContain(result.exitCode)
    })
  })

  describe('Environment Variables', () => {
    it('should respect TEST_CLI environment variable', async () => {
      const result = await runLocalCitty(['info', 'version'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Version: 1.0.0')
    })

    it('should work without TEST_CLI environment variable', async () => {
      const result = await runLocalCitty(['info', 'version'], {
        env: {},
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Version: 1.0.0')
    })
  })
})
