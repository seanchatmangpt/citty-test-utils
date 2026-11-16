import { describe, it, expect } from 'vitest'
import { scenario } from '@un-test/scenario'

process.env.CONSOLA_LEVEL = '5'

describe('Help Command BDD Scenarios', () => {
  it('should display the main help output when run with --show-help', async () => {
    const result = await scenario('Show main help via flag')
      .step('Run main CLI with --show-help')
      .run('--show-help')
      .expectSuccess()
      .expectOutput(/USAGE playground greet|math|error|info/)
      .expectOutput(/COMMANDS/)
      .execute()

    expect(result.success).toBe(true)
  })

  it('should display greet command help output', async () => {
    const result = await scenario('Show greet command help')
      .step('Run greet command with --help')
      .run('greet --help')
      .expectSuccess()
      .expectOutput(/USAGE.*playground greet/)
      .expectOutput(/Name to greet/)
      .execute()

    expect(result.success).toBe(true)
  })

  it('should display math command help output', async () => {
    const result = await scenario('Show math command help')
      .step('Run math command with --help')
      .run('math --help')
      .expectSuccess()
      .expectOutput(/USAGE.*playground math/)
      .execute()

    expect(result.success).toBe(true)
  })
})
