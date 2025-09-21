#!/usr/bin/env node
// test/integration/noun-verb-cli-snapshots.test.mjs
// Snapshot tests for the new noun-verb CLI structure

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { runLocalCitty, runCitty, setupCleanroom, teardownCleanroom } from '../../index.js'

describe('Noun-Verb CLI Snapshot Tests', () => {
  beforeAll(async () => {
    await setupCleanroom({ rootDir: '.', timeout: 60000 })
  }, 120000)

  afterAll(async () => {
    await teardownCleanroom()
  }, 60000)

  describe('Main CLI Help Snapshots', () => {
    it('should match help output snapshot', async () => {
      const result = await runLocalCitty(['--help'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatchSnapshot('main-help-output')
    })

    it('should match version output snapshot', async () => {
      const result = await runLocalCitty(['--show-version'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatchSnapshot('main-version-output')
    })

    it('should match JSON version output snapshot', async () => {
      const result = await runLocalCitty(['--show-version', '--json'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.json).toMatchSnapshot('main-version-json')
    })
  })

  describe('Info Noun Snapshots', () => {
    it('should match info version output snapshot', async () => {
      const result = await runLocalCitty(['info', 'version'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatchSnapshot('info-version-output')
    })

    it('should match info version JSON snapshot', async () => {
      const result = await runLocalCitty(['info', 'version', '--json'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.json).toMatchSnapshot('info-version-json')
    })

    it('should match info features output snapshot', async () => {
      const result = await runLocalCitty(['info', 'features'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatchSnapshot('info-features-output')
    })

    it('should match info config output snapshot', async () => {
      const result = await runLocalCitty(['info', 'config'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatchSnapshot('info-config-output')
    })

    it('should match info all output snapshot', async () => {
      const result = await runLocalCitty(['info', 'all'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatchSnapshot('info-all-output')
    })
  })

  describe('Gen Noun Snapshots', () => {
    it('should match gen project output snapshot', async () => {
      const result = await runLocalCitty(['gen', 'project', 'snapshot-test-project'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatchSnapshot('gen-project-output')
    })

    it('should match gen test output snapshot', async () => {
      const result = await runLocalCitty(['gen', 'test', 'snapshot-test'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatchSnapshot('gen-test-output')
    })

    it('should match gen scenario output snapshot', async () => {
      const result = await runLocalCitty(['gen', 'scenario', 'snapshot-scenario'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatchSnapshot('gen-scenario-output')
    })

    it('should match gen cli output snapshot', async () => {
      const result = await runLocalCitty(['gen', 'cli', 'snapshot-cli'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatchSnapshot('gen-cli-output')
    })

    it('should match gen config output snapshot', async () => {
      const result = await runLocalCitty(['gen', 'config', 'snapshot-config'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatchSnapshot('gen-config-output')
    })
  })

  describe('Runner Noun Snapshots', () => {
    it('should match runner execute output snapshot', async () => {
      const result = await runLocalCitty(['runner', 'execute', 'node --version'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatchSnapshot('runner-execute-output')
    })

    it('should match runner execute with custom timeout snapshot', async () => {
      const result = await runLocalCitty(
        ['runner', 'execute', 'echo "hello"', '--timeout', '5000'],
        {
          env: { TEST_CLI: 'true' },
        }
      )

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatchSnapshot('runner-execute-timeout-output')
    })

    it('should match runner execute cleanroom snapshot', async () => {
      const result = await runCitty(['runner', 'execute', 'node --version'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatchSnapshot('runner-execute-cleanroom-output')
    })
  })

  describe('Test Noun Snapshots', () => {
    it('should match test run output snapshot', async () => {
      const result = await runLocalCitty(['test', 'run'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatchSnapshot('test-run-output')
    })

    it('should match test help output snapshot', async () => {
      const result = await runLocalCitty(['test', 'help'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatchSnapshot('test-help-output')
    })

    it('should match test version output snapshot', async () => {
      const result = await runLocalCitty(['test', 'version'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatchSnapshot('test-version-output')
    })

    it('should match test error output snapshot', async () => {
      const result = await runLocalCitty(['test', 'error'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatchSnapshot('test-error-output')
    })
  })

  describe('Error Handling Snapshots', () => {
    it('should match invalid noun error snapshot', async () => {
      const result = await runLocalCitty(['invalid-noun', 'some-verb'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(1)
      expect(result.stdout).toMatchSnapshot('invalid-noun-error-output')
      expect(result.stderr).toMatchSnapshot('invalid-noun-error-stderr')
    })

    it('should match invalid verb error snapshot', async () => {
      const result = await runLocalCitty(['info', 'invalid-verb'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(1)
      expect(result.stdout).toMatchSnapshot('invalid-verb-error-output')
      expect(result.stderr).toMatchSnapshot('invalid-verb-error-stderr')
    })

    it('should match missing argument error snapshot', async () => {
      const result = await runLocalCitty(['gen', 'project'], {
        env: { TEST_CLI: 'true' },
      })

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toMatchSnapshot('missing-argument-error-stderr')
    })
  })

  describe('Cross-Environment Snapshot Consistency', () => {
    it('should have consistent info version output between local and cleanroom', async () => {
      const localResult = await runLocalCitty(['info', 'version'], {
        env: { TEST_CLI: 'true' },
      })

      const cleanroomResult = await runCitty(['info', 'version'], {
        env: { TEST_CLI: 'true' },
      })

      expect(localResult.exitCode).toBe(cleanroomResult.exitCode)
      expect(localResult.stdout).toBe(cleanroomResult.stdout)

      // Both should match the same snapshot
      expect(localResult.stdout).toMatchSnapshot('info-version-cross-env')
      expect(cleanroomResult.stdout).toMatchSnapshot('info-version-cross-env')
    })

    it('should have consistent gen test output between local and cleanroom', async () => {
      const localResult = await runLocalCitty(['gen', 'test', 'cross-env-snapshot'], {
        env: { TEST_CLI: 'true' },
      })

      const cleanroomResult = await runCitty(['gen', 'test', 'cross-env-snapshot-cleanroom'], {
        env: { TEST_CLI: 'true' },
      })

      expect(localResult.exitCode).toBe(cleanroomResult.exitCode)

      // Both should contain the same pattern
      expect(localResult.stdout).toContain('Generated test file')
      expect(cleanroomResult.stdout).toContain('Generated test file')

      // Both should match the same snapshot pattern
      expect(localResult.stdout).toMatchSnapshot('gen-test-cross-env')
      expect(cleanroomResult.stdout).toMatchSnapshot('gen-test-cross-env')
    })
  })

  describe('JSON Output Snapshots', () => {
    it('should match all JSON output snapshots', async () => {
      const versionResult = await runLocalCitty(['info', 'version', '--json'], {
        env: { TEST_CLI: 'true' },
      })

      expect(versionResult.exitCode).toBe(0)
      expect(versionResult.json).toMatchSnapshot('json-version-output')

      const mainVersionResult = await runLocalCitty(['--show-version', '--json'], {
        env: { TEST_CLI: 'true' },
      })

      expect(mainVersionResult.exitCode).toBe(0)
      expect(mainVersionResult.json).toMatchSnapshot('json-main-version-output')
    })
  })
})
