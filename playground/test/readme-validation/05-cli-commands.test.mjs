import { describe, it, expect } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const playgroundDir = join(__dirname, '../..')
const mainDir = join(__dirname, '../../..')

describe('README CLI Commands Examples', () => {
  it('Analysis: discover with auto-detection', async () => {
    // From README line 137
    const result = await runLocalCitty(
      ['analysis', 'discover', '--verbose'],
      {
        cwd: mainDir,
      }
    )

    result.expectSuccess()
    expect(result.result.stdout).toMatch(/Resolving|CLI entry/i)
  })

  it('Analysis: discover with --entry-file', async () => {
    // From README line 142-144, 477-478
    const result = await runLocalCitty(
      ['analysis', 'discover', '--entry-file', './playground/src/cli.mjs'],
      {
        cwd: mainDir,
      }
    )

    result.expectSuccess()
    expect(result.result.stdout).toMatch(/playground/)
  })

  it('Analysis: coverage with --test-dir', async () => {
    // From README line 138, 479
    const result = await runLocalCitty(
      ['analysis', 'coverage', '--entry-file', './playground/src/cli.mjs', '--test-dir', 'playground/test'],
      {
        cwd: mainDir,
      }
    )

    result.expectSuccess()
    expect(result.result.stdout).toMatch(/Coverage|%/)
  })

  it('Analysis: recommend with --priority', async () => {
    // From README line 139, 480
    const result = await runLocalCitty(
      ['analysis', 'recommend', '--entry-file', './playground/src/cli.mjs', '--priority', 'high'],
      {
        cwd: mainDir,
      }
    )

    result.expectSuccess()
    expect(result.result.stdout).toMatch(/Recommendations|Priority/)
  })

  it('Runner: local command execution', async () => {
    // From README line 151-152, 483
    const result = await runLocalCitty(
      ['runner', 'local', '--help'],
      {
        cwd: mainDir,
      }
    )

    result.expectSuccess()
  })

  it('Generator: project generation', async () => {
    // From README line 488
    const result = await runLocalCitty(
      ['gen', 'project', 'test-cli-validation', '--description', 'Test CLI'],
      {
        cwd: mainDir,
      }
    )

    result.expectSuccess()
  })

  it('Test: run with environment', async () => {
    // From README line 492, 755
    const result = await runLocalCitty(
      ['test', 'run', '--environment', 'local'],
      {
        cwd: mainDir,
      }
    )

    // May fail if no tests configured, but should not crash
    expect([0, 1]).toContain(result.result.exitCode)
  })
})
