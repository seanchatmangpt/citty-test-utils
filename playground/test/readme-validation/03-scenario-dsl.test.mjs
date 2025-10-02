import { describe, it, expect } from 'vitest'
import { scenario, scenarios } from 'citty-test-utils'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const playgroundDir = join(__dirname, '../..')

describe('README Scenario DSL Examples', () => {
  it('Scenario DSL: Multi-step workflow', async () => {
    // From README line 351-368
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

  it('Scenario DSL: Complex multi-step test', async () => {
    // From README line 614-627
    const result = await scenario('Complete workflow')
      .step('Get help')
      .run('--help', { cwd: playgroundDir })
      .expectSuccess()
      .expectOutput('USAGE')
      .step('Get version')
      .run(['--version'], { cwd: playgroundDir })
      .expectSuccess()
      .expectOutput(/\d+\.\d+\.\d+/)
      .execute('local')

    expect(result.success).toBe(true)
  })

  it('Pre-built Scenarios: help', async () => {
    // From README line 377, 630
    const helpResult = await scenarios.help('local', { cwd: playgroundDir }).execute()
    expect(helpResult.success).toBe(true)
  })

  it('Pre-built Scenarios: version', async () => {
    // From README line 378, 631
    const versionResult = await scenarios.version('local', { cwd: playgroundDir }).execute()
    expect(versionResult.success).toBe(true)
  })

  it('Pre-built Scenarios: invalidCommand', async () => {
    // From README line 379, 632
    const errorResult = await scenarios.invalidCommand(
      'nonexistent',
      'local',
      { cwd: playgroundDir }
    ).execute()
    expect(errorResult.success).toBe(true)
  })

  it('Pre-built Scenarios: jsonOutput', async () => {
    // From README line 382, 633
    const jsonResult = await scenarios.jsonOutput(
      ['greet', 'Alice', '--json'],
      'local',
      { cwd: playgroundDir }
    ).execute()
    expect(jsonResult.success).toBe(true)
  })
})
