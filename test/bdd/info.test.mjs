import { describe, it, expect } from 'vitest'
import { scenario } from '@un-test/scenario'

describe('Info Command BDD Scenarios', () => {
  it('should display playground information in plain text format', async () => {
    const result = await scenario('Info plain text')
      .step('Run info command')
      .run('info')
      .expectSuccess()
      .expectOutput('Playground CLI Information:')
      .expectOutput('Name: citty-test-utils-playground')
      .expectOutput('Version: 1.0.0')
      .expectOutput('Commands: greet, math, error, info')
      .execute()

    expect(result.success).toBe(true)
  })

  it('should display playground information in JSON format when --json is provided', async () => {
    const result = await scenario('Info JSON format')
      .step('Run info command with --json')
      .run('info --json')
      .expectSuccess()
      .expectJson((json) => {
        expect(json.name).toBe('citty-test-utils-playground')
        expect(json.version).toBe('1.0.0')
        expect(json.description).toContain('Playground CLI')
        expect(json.commands).toContain('info')
        expect(json.features).toContain('JSON output support')
      })
      .execute()

    expect(result.success).toBe(true)
  })

  it('should display version information when run with --show-version', async () => {
    const result = await scenario('Show version')
      .step('Run with --show-version')
      .run('--show-version')
      .expectSuccess()
      .expectOutput('1.0.0')
      .execute()

    expect(result.success).toBe(true)
  })

  it('should display help information when run with --show-help', async () => {
    const result = await scenario('Show help')
      .step('Run with --show-help')
      .run('--show-help')
      .expectSuccess()
      .expectOutput(/USAGE playground/)
      .execute()

    expect(result.success).toBe(true)
  })

  it('should handle failures correctly when running an invalid command', async () => {
    const result = await scenario('Invalid command failure')
      .step('Run nonexistent command')
      .run('nonexistent')
      .expectFailure()
      .expectStderr(/Unknown command.*nonexistent/)
      .execute()

    expect(result.success).toBe(true)
  })
})
