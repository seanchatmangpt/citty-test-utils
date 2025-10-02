import { describe, it } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'

/**
 * Snapshot Test Project
 *
 * Demonstrates snapshot testing for your CLI projects.
 * Snapshots make regression testing easy!
 */

describe('snapshot-test-project', () => {
  it('should snapshot help output', async () => {
    const result = await runLocalCitty({ args: ['--help'] })

    result
      .expectSuccess()
      .expectSnapshotStdout('help-snapshot')
  })

  it('should snapshot version', async () => {
    const result = await runLocalCitty({ args: ['--version'] })

    result
      .expectSuccess()
      .expectSnapshotStdout('version-snapshot')
  })

  it('should snapshot command output', async () => {
    const result = await runLocalCitty({ args: ['info'] })

    result
      .expectSuccess()
      .expectSnapshotFull('info-full-snapshot')
  })

  it('should snapshot JSON output', async () => {
    const result = await runLocalCitty({ args: ['info', '--json'] })

    result
      .expectSuccess()
      .expectSnapshotJson('info-json-snapshot')
  })
})
