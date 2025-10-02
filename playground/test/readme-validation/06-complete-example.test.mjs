import { describe, it, expect } from 'vitest'
import { runLocalCitty, scenario, scenarios, testUtils } from 'citty-test-utils'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const playgroundDir = join(__dirname, '../..')

describe('README Complete Example', () => {
  it('Complete Example: Test local runner', async () => {
    // From README line 788-796
    const localResult = await runLocalCitty(['--help'], {
      cwd: playgroundDir,
      env: { DEBUG: 'true' },
    })

    localResult
      .expectSuccess()
      .expectOutput('USAGE')
      .expectOutput(/playground/)
      .expectNoStderr()
  })

  it('Complete Example: Test scenario', async () => {
    // From README line 798-814
    const scenarioResult = await scenario('Complete workflow')
      .step('Get help')
      .run('--help', { cwd: playgroundDir })
      .expectSuccess()
      .expectOutput('USAGE')
      .step('Get version')
      .run('--version', { cwd: playgroundDir })
      .expectSuccess()
      .expectOutput(/\d+\.\d+\.\d+/)
      .step('Test invalid command')
      .run('invalid-command', { cwd: playgroundDir })
      .expectFailure()
      .execute('local')

    expect(scenarioResult.success).toBe(true)
  })

  it('Complete Example: Pre-built scenarios', async () => {
    // From README line 817-821
    const helpResult = await scenarios.help('local', { cwd: playgroundDir }).execute()
    const versionResult = await scenarios.version('local', { cwd: playgroundDir }).execute()

    expect(helpResult.success).toBe(true)
    expect(versionResult.success).toBe(true)
  })

  it('Complete Example: Flaky operations with retry', async () => {
    // From README line 824-830, 896-903
    await testUtils.retry(
      async () => {
        const result = await runLocalCitty(['--help'], {
          cwd: playgroundDir,
          env: { DEBUG: 'true' },
        })
        result.expectSuccess()
      },
      3,
      1000
    )
  })

  it('Vitest Integration: should work locally', async () => {
    // From README line 845-855
    const result = await runLocalCitty(['--help'], {
      cwd: playgroundDir,
      env: { DEBUG: 'true' },
    })

    result
      .expectSuccess()
      .expectOutput('USAGE')
      .expectOutput(/playground/)
      .expectNoStderr()
  })

  it('Vitest Integration: Complex workflow', async () => {
    // From README line 868-885
    const result = await scenario('Complete workflow')
      .step('Get help')
      .run('--help', { cwd: playgroundDir })
      .expectSuccess()
      .expectOutput('USAGE')
      .step('Get version')
      .run('--version', { cwd: playgroundDir })
      .expectSuccess()
      .expectOutput(/\d+\.\d+\.\d+/)
      .step('Test invalid command')
      .run('invalid-command', { cwd: playgroundDir })
      .expectFailure()
      .execute('local')

    expect(result.success).toBe(true)
  })

  it('Vitest Integration: Pre-built scenarios', async () => {
    // From README line 887-893
    const helpResult = await scenarios.help('local', { cwd: playgroundDir }).execute()
    const versionResult = await scenarios.version('local', { cwd: playgroundDir }).execute()

    expect(helpResult.success).toBe(true)
    expect(versionResult.success).toBe(true)
  })
})
