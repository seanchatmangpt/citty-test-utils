import { describe, it, expect } from 'vitest'
import { runLocalCitty, scenario } from 'citty-test-utils'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const playgroundDir = join(__dirname, '../..')

describe('README Quick Start Examples', () => {
  it('Quick Start: Drive the bundled playground locally', async () => {
    // From README line 76-88 (API: v0.6.0 uses single object with args property)
    const help = await runLocalCitty({
      args: ['--help'],
      cwd: playgroundDir,
      cliPath: 'src/cli.mjs',
      env: { TEST_CLI: 'true' },
    })

    help.expectSuccess().expectOutput('USAGE')

    // Verify first line contains the expected CLI name
    const firstLine = help.result.stdout.split('\n')[0]
    expect(firstLine).toContain('playground')
  })

  it('Quick Start: Build a multi-step scenario', async () => {
    // From README line 91-103 (API: v0.6.0 - scenario.run needs args array and options)
    const result = await scenario('Playground smoke test')
      .step('Show help')
      .run({ args: ['--help'], cwd: playgroundDir, cliPath: 'src/cli.mjs', env: { TEST_CLI: 'true' } })
      .expectSuccess()
      .expectOutput('USAGE')
      .step('Reject invalid command')
      .run({ args: ['invalid-command'], cwd: playgroundDir, cliPath: 'src/cli.mjs', env: { TEST_CLI: 'true' } })
      .expectFailure()
      .execute('local')

    expect(result.success).toBe(true)
  })

  it('Quick Start: Inspect the toolkit CLI', async () => {
    // From README line 70-73 (API: v0.6.0)
    const result = await runLocalCitty({
      args: ['--show-help'],
      cwd: join(__dirname, '../../..'), // Main project root
      cliPath: 'src/cli.mjs',
    })

    result.expectSuccess()
    // Should list nouns
    expect(result.result.stdout).toMatch(/test|gen|runner|info|analysis/)
  })
})
