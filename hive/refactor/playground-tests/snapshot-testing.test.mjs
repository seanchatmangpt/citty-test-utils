import { describe, it } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'

/**
 * Snapshot Testing - Capture and Compare Output
 *
 * Demonstrates snapshot testing for CLI output, JSON responses,
 * and full result objects. Perfect for regression testing!
 */

describe('Snapshot Testing', () => {
  describe('Basic Snapshots', () => {
    it('should snapshot help output', async () => {
      const result = await runLocalCitty({ args: ['--show-help'] })

      result
        .expectSuccess()
        .expectSnapshotStdout('playground-help')
    })

    it('should snapshot version output', async () => {
      const result = await runLocalCitty({ args: ['--show-version'] })

      result
        .expectSuccess()
        .expectSnapshotStdout('playground-version')
    })

    it('should snapshot error output', async () => {
      const result = await runLocalCitty({ args: ['error', 'generic'] })

      result
        .expectFailure()
        .expectSnapshotStderr('playground-error')
    })
  })

  describe('JSON Snapshots', () => {
    it('should snapshot JSON greeting', async () => {
      const result = await runLocalCitty({
        args: ['greet', 'Snapshot', '--json']
      })

      result
        .expectSuccess()
        .expectSnapshotJson('greet-json')
    })

    it('should snapshot math operation JSON', async () => {
      const result = await runLocalCitty({
        args: ['math', 'add', '5', '3', '--json']
      })

      result
        .expectSuccess()
        .expectSnapshotJson('math-add-json')
    })

    it('should snapshot info JSON', async () => {
      const result = await runLocalCitty({
        args: ['info', '--json']
      })

      result
        .expectSuccess()
        .expectSnapshotJson('info-json')
    })
  })

  describe('Full Result Snapshots', () => {
    it('should snapshot complete success result', async () => {
      const result = await runLocalCitty({ args: ['greet', 'Full'] })

      result
        .expectSuccess()
        .expectSnapshotFull('greet-full')
    })

    it('should snapshot complete failure result', async () => {
      const result = await runLocalCitty({ args: ['error', 'validation'] })

      result
        .expectFailure()
        .expectSnapshotFull('error-full')
    })
  })

  describe('Complex Command Snapshots', () => {
    it('should snapshot greeting with options', async () => {
      const result = await runLocalCitty({
        args: ['greet', 'Test', '--count', '3', '--verbose']
      })

      result
        .expectSuccess()
        .expectSnapshotStdout('greet-verbose-count')
    })

    it('should snapshot math multiply', async () => {
      const result = await runLocalCitty({
        args: ['math', 'multiply', '6', '7']
      })

      result
        .expectSuccess()
        .expectSnapshotStdout('math-multiply')
    })
  })

  describe('Snapshot Consistency', () => {
    it('should produce identical snapshots for same input', async () => {
      const result1 = await runLocalCitty({ args: ['greet', 'Consistent'] })
      const result2 = await runLocalCitty({ args: ['greet', 'Consistent'] })

      // Both should match the same snapshot
      result1.expectSnapshotStdout('greet-consistent')
      result2.expectSnapshotStdout('greet-consistent')
    })
  })
})
