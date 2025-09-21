#!/usr/bin/env node
// test/integration/gen-commands.test.mjs
// Tests for gen noun commands

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { runLocalCitty, runCitty, setupCleanroom, teardownCleanroom } from '../../index.js'

describe('Gen Noun Commands', () => {
  beforeAll(async () => {
    await setupCleanroom({ rootDir: '.', timeout: 60000 })
  }, 120000)

  afterAll(async () => {
    await teardownCleanroom()
  }, 60000)

  describe('Project Generation', () => {
    it('should generate a test project', async () => {
      const result = await runLocalCitty(['gen', 'project', 'test-project'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated complete project: test-project')
      expect(result.stdout).toContain('Location:')
      expect(result.stdout).toContain('Files created:')
    })

    it('should work with fluent assertions', async () => {
      const result = await runLocalCitty(['gen', 'project', 'fluent-test'], {
        env: { TEST_CLI: 'true' },
      })

      result
        .expectSuccess()
        .expectOutput(/Generated complete project: fluent-test/)
        .expectOutput(/Location:/)
        .expectNoStderr()
    })
  })

  describe('Template Generation', () => {
    it('should generate a test file', async () => {
      const result = await runLocalCitty(['gen', 'test', `test-file-${Date.now()}`], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated test template')
      expect(result.stdout).toContain('Location:')
      expect(result.stdout).toContain('Template:')
    })

    it('should generate a scenario file', async () => {
      const result = await runLocalCitty(['gen', 'scenario', `scenario-file-${Date.now()}`], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated scenario template')
      expect(result.stdout).toContain('Location:')
      expect(result.stdout).toContain('Template:')
    })

    it('should generate a CLI file', async () => {
      const result = await runLocalCitty(['gen', 'cli', `cli-file-${Date.now()}`], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated CLI template')
      expect(result.stdout).toContain('Location:')
      expect(result.stdout).toContain('Template:')
    })

    it.skip('should generate config files', async () => {
      // SKIPPED: Config generation not implemented
      const result = await runLocalCitty(['gen', 'config', 'my-config'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Generated config files for: my-config')
    })
  })

  describe('Cross-Environment Testing', () => {
    it('should work consistently for gen commands', async () => {
      const timestamp = Date.now()
      const localResult = await runLocalCitty(['gen', 'test', `cross-env-test-${timestamp}`], {
        env: { TEST_CLI: 'true' },
      })

      const cleanroomResult = await runCitty(
        ['gen', 'test', `cross-env-test-cleanroom-${timestamp}`],
        {
          env: { TEST_CLI: 'true' },
        }
      )

      expect(localResult.exitCode).toBe(cleanroomResult.exitCode)
      expect(localResult.stdout).toContain('Generated test template')
      expect(cleanroomResult.stdout).toContain('Generated test template')
    })
  })
})
