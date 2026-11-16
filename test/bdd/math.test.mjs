import { describe, it, expect } from 'vitest'
import { scenario } from '@un-test/scenario'

describe('Math Command BDD Scenarios', () => {
  it('should correctly add two numbers', async () => {
    const result = await scenario('Math addition')
      .step('Run math add 5 10')
      .run('math add 5 10')
      .expectSuccess()
      .expectOutput('5 + 10 = 15')
      .execute()

    expect(result.success).toBe(true)
  })

  it('should support JSON output for addition', async () => {
    const result = await scenario('Math addition JSON')
      .step('Run math add with json flag')
      .run('math add 12 8 --json')
      .expectSuccess()
      .expectJson((json) => {
        expect(json.operation).toBe('add')
        expect(json.a).toBe(12)
        expect(json.b).toBe(8)
        expect(json.result).toBe(20)
      })
      .execute()

    expect(result.success).toBe(true)
  })

  it('should correctly multiply two numbers', async () => {
    const result = await scenario('Math multiplication')
      .step('Run math multiply 4 7')
      .run('math multiply 4 7')
      .expectSuccess()
      .expectOutput('4 × 7 = 28')
      .execute()

    expect(result.success).toBe(true)
  })
})
