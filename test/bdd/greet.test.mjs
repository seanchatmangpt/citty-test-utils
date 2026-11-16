import { describe, it, expect } from 'vitest'
import { scenario } from '@un-test/scenario'

describe('Greet Command BDD Scenarios', () => {
  it('should greet the user with a default name of World', async () => {
    const result = await scenario('Greet with default')
      .step('Run greet command with no positional argument')
      .run('greet')
      .expectSuccess()
      .expectOutput('Hello, World! (1/1)')
      .execute()

    expect(result.success).toBe(true)
  })

  it('should greet a specified person by name', async () => {
    const result = await scenario('Greet by name')
      .step('Run greet with Alice')
      .run('greet Alice')
      .expectSuccess()
      .expectOutput('Hello, Alice! (1/1)')
      .execute()

    expect(result.success).toBe(true)
  })

  it('should greet multiple times when count flag is provided', async () => {
    const result = await scenario('Greet multiple times')
      .step('Run greet with Bob and count=3')
      .run('greet Bob --count 3')
      .expectSuccess()
      .expectOutput('Hello, Bob! (1/3)')
      .expectOutput('Hello, Bob! (2/3)')
      .expectOutput('Hello, Bob! (3/3)')
      .execute()

    expect(result.success).toBe(true)
  })

  it('should support JSON output mode', async () => {
    const result = await scenario('Greet with JSON')
      .step('Run greet with Charlie and json flag')
      .run('greet Charlie --json')
      .expectSuccess()
      .expectJson((json) => {
        expect(json.message).toBe('Hello, Charlie!')
        expect(json.count).toBe(1)
        expect(json.verbose).toBe(false)
      })
      .execute()

    expect(result.success).toBe(true)
  })
})
