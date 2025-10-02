import { describe, it, expect } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Get the playground directory path
const __filename = fileURLToPath(import.meta.url)
const playgroundDir = join(dirname(__filename), '../..')

describe('Snapshot Testing Integration', () => {
  describe('Basic Snapshot Testing', () => {
    it('should support expectSnapshotStdout()', async () => {
      const result = await runLocalCitty(['--show-help'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectSnapshotStdout('playground-help')
    })

    it('should support expectSnapshotStderr()', async () => {
      const result = await runLocalCitty(['error', 'generic'], {
        cwd: playgroundDir,
      })

      result.expectFailure().expectSnapshotStderr('playground-error')
    })

    it('should support expectSnapshotJson()', async () => {
      const result = await runLocalCitty(['greet', 'Snapshot', '--json'], {
        cwd: playgroundDir,
        json: true,
      })

      result.expectSuccess().expectSnapshotJson('playground-greet-json')
    })

    it('should support expectSnapshotFull()', async () => {
      const result = await runLocalCitty(['--show-version'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectSnapshotFull('playground-version-full')
    })

    it('should support expectSnapshotOutput()', async () => {
      const result = await runLocalCitty(['info'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectSnapshotOutput('playground-info-output')
    })
  })

  describe('Snapshot Types', () => {
    it('should handle stdout snapshots', async () => {
      const result = await runLocalCitty(['greet', 'Alice'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectSnapshotStdout('greet-alice-stdout')
    })

    it('should handle stderr snapshots', async () => {
      const result = await runLocalCitty(['error', 'validation'], {
        cwd: playgroundDir,
      })

      result.expectFailure().expectSnapshotStderr('error-validation-stderr')
    })

    it('should handle JSON snapshots', async () => {
      const result = await runLocalCitty(['math', 'add', '5', '3', '--json'], {
        cwd: playgroundDir,
        json: true,
      })

      result.expectSuccess().expectSnapshotJson('math-add-json')
    })

    it('should handle full result snapshots', async () => {
      const result = await runLocalCitty(['math', 'multiply', '4', '7'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectSnapshotFull('math-multiply-full')
    })

    it('should handle output snapshots', async () => {
      const result = await runLocalCitty(['greet', 'Bob', '--count', '2'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectSnapshotOutput('greet-bob-count-output')
    })
  })

  describe('Snapshot with Different Commands', () => {
    it('should snapshot help output', async () => {
      const result = await runLocalCitty(['--show-help'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectSnapshotStdout('help-output')
    })

    it('should snapshot version output', async () => {
      const result = await runLocalCitty(['--show-version'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectSnapshotStdout('version-output')
    })

    it('should snapshot greet command output', async () => {
      const result = await runLocalCitty(['greet', 'Test'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectSnapshotStdout('greet-test-output')
    })

    it('should snapshot greet with options', async () => {
      const result = await runLocalCitty(['greet', 'Options', '--count', '3', '--verbose'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectSnapshotStdout('greet-options-output')
    })

    it('should snapshot math add output', async () => {
      const result = await runLocalCitty(['math', 'add', '10', '20'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectSnapshotStdout('math-add-output')
    })

    it('should snapshot math multiply output', async () => {
      const result = await runLocalCitty(['math', 'multiply', '6', '7'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectSnapshotStdout('math-multiply-output')
    })

    it('should snapshot info command output', async () => {
      const result = await runLocalCitty(['info'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectSnapshotStdout('info-output')
    })

    it('should snapshot info JSON output', async () => {
      const result = await runLocalCitty(['info', '--json'], {
        cwd: playgroundDir,
        json: true,
      })

      result.expectSuccess().expectSnapshotJson('info-json-output')
    })
  })

  describe('Snapshot Error Cases', () => {
    it('should snapshot generic error', async () => {
      const result = await runLocalCitty(['error', 'generic'], {
        cwd: playgroundDir,
      })

      result.expectFailure().expectSnapshotStderr('error-generic-stderr')
    })

    it('should snapshot validation error', async () => {
      const result = await runLocalCitty(['error', 'validation'], {
        cwd: playgroundDir,
      })

      result.expectFailure().expectSnapshotStderr('error-validation-stderr')
    })

    it('should snapshot invalid command error', async () => {
      const result = await runLocalCitty(['invalid-command'], {
        cwd: playgroundDir,
      })

      result.expectFailure().expectSnapshotStderr('invalid-command-stderr')
    })

    it('should snapshot missing arguments error', async () => {
      const result = await runLocalCitty(['math', 'add'], {
        cwd: playgroundDir,
      })

      result.expectFailure().expectSnapshotStderr('missing-args-stderr')
    })
  })

  describe('Snapshot with JSON Output', () => {
    it('should snapshot greet JSON', async () => {
      const result = await runLocalCitty(['greet', 'JSON', '--json'], {
        cwd: playgroundDir,
        json: true,
      })

      result.expectSuccess().expectSnapshotJson('greet-json-snapshot')
    })

    it('should snapshot math add JSON', async () => {
      const result = await runLocalCitty(['math', 'add', '15', '25', '--json'], {
        cwd: playgroundDir,
        json: true,
      })

      result.expectSuccess().expectSnapshotJson('math-add-json-snapshot')
    })

    it('should snapshot math multiply JSON', async () => {
      const result = await runLocalCitty(['math', 'multiply', '8', '9', '--json'], {
        cwd: playgroundDir,
        json: true,
      })

      result.expectSuccess().expectSnapshotJson('math-multiply-json-snapshot')
    })

    it('should snapshot info JSON', async () => {
      const result = await runLocalCitty(['info', '--json'], {
        cwd: playgroundDir,
        json: true,
      })

      result.expectSuccess().expectSnapshotJson('info-json-snapshot')
    })
  })

  describe('Snapshot Full Results', () => {
    it('should snapshot full success result', async () => {
      const result = await runLocalCitty(['greet', 'Full'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectSnapshotFull('greet-full-result')
    })

    it('should snapshot full failure result', async () => {
      const result = await runLocalCitty(['error', 'generic'], {
        cwd: playgroundDir,
      })

      result.expectFailure().expectSnapshotFull('error-full-result')
    })

    it('should snapshot full JSON result', async () => {
      const result = await runLocalCitty(['math', 'add', '100', '200', '--json'], {
        cwd: playgroundDir,
        json: true,
      })

      result.expectSuccess().expectSnapshotFull('math-add-full-json-result')
    })
  })

  describe('Snapshot Edge Cases', () => {
    it('should handle empty output snapshots', async () => {
      const result = await runLocalCitty(['--show-version'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectSnapshotStdout('version-empty-output')
    })

    it('should handle multiline output snapshots', async () => {
      const result = await runLocalCitty(['greet', 'Multiline', '--count', '3'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectSnapshotStdout('greet-multiline-output')
    })

    it('should handle verbose output snapshots', async () => {
      const result = await runLocalCitty(['greet', 'Verbose', '--verbose'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectSnapshotStdout('greet-verbose-output')
    })

    it('should handle timeout snapshots', async () => {
      const result = await runLocalCitty(['error', 'timeout'], {
        cwd: playgroundDir,
        timeout: 1000,
      })

      result.expectFailure().expectSnapshotFull('timeout-result')
    })
  })

  describe('Snapshot with Environment Variables', () => {
    it('should snapshot with custom environment', async () => {
      const result = await runLocalCitty(['greet', 'Env'], {
        cwd: playgroundDir,
        env: { TEST_MODE: 'true' },
      })

      result.expectSuccess().expectSnapshotStdout('greet-env-output')
    })

    it('should snapshot with debug environment', async () => {
      const result = await runLocalCitty(['info'], {
        cwd: playgroundDir,
        env: { DEBUG: 'true' },
      })

      result.expectSuccess().expectSnapshotStdout('info-debug-output')
    })
  })

  describe('Snapshot Consistency', () => {
    it('should produce consistent snapshots for same input', async () => {
      const result1 = await runLocalCitty(['greet', 'Consistent'], {
        cwd: playgroundDir,
      })
      const result2 = await runLocalCitty(['greet', 'Consistent'], {
        cwd: playgroundDir,
      })

      result1.expectSuccess().expectSnapshotStdout('greet-consistent-1')
      result2.expectSuccess().expectSnapshotStdout('greet-consistent-2')

      // Results should be identical
      expect(result1.result.stdout).toBe(result2.result.stdout)
    })

    it('should produce consistent JSON snapshots', async () => {
      const result1 = await runLocalCitty(['math', 'add', '5', '5', '--json'], {
        cwd: playgroundDir,
        json: true,
      })
      const result2 = await runLocalCitty(['math', 'add', '5', '5', '--json'], {
        cwd: playgroundDir,
        json: true,
      })

      result1.expectSuccess().expectSnapshotJson('math-consistent-json-1')
      result2.expectSuccess().expectSnapshotJson('math-consistent-json-2')

      // Results should be identical
      expect(result1.result.json).toEqual(result2.result.json)
    })
  })

  describe('Snapshot Management', () => {
    it('should handle snapshot creation', async () => {
      const result = await runLocalCitty(['greet', 'Management'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectSnapshotStdout('snapshot-management-test')
    })

    it('should handle snapshot updates', async () => {
      const result = await runLocalCitty(['greet', 'Update'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectSnapshotStdout('snapshot-update-test')
    })

    it('should handle snapshot validation', async () => {
      const result = await runLocalCitty(['greet', 'Validation'], {
        cwd: playgroundDir,
      })

      result.expectSuccess().expectSnapshotStdout('snapshot-validation-test')
    })
  })
})
