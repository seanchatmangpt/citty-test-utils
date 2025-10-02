import { describe, it, expect } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const playgroundDir = join(__dirname, '../..')

describe('README Fluent Assertions API Examples', () => {
  it('Fluent Assertions: expectSuccess and expectOutput', async () => {
    // From README line 334-343
    const result = await runLocalCitty(['--help'], { cwd: playgroundDir })

    result
      .expectSuccess()
      .expectOutput('USAGE')
      .expectOutput(/playground/)
      .expectOutputContains('commands')
  })

  it('Fluent Assertions: expectFailure', async () => {
    // From README line 337
    const result = await runLocalCitty(['invalid-command'], { cwd: playgroundDir })

    result.expectFailure()
  })

  it('Fluent Assertions: expectNoStderr on success', async () => {
    // From README line 341
    const result = await runLocalCitty(['--help'], { cwd: playgroundDir })

    result.expectSuccess().expectNoStderr()
  })

  it('Fluent Assertions: expectOutputLength range', async () => {
    // From README line 342
    const result = await runLocalCitty(['--help'], { cwd: playgroundDir })

    result.expectSuccess().expectOutputLength(10, 1000)
  })

  it('Fluent Assertions: JSON validation', async () => {
    // From README line 343-345
    const result = await runLocalCitty(['greet', 'Alice', '--json'], {
      cwd: playgroundDir,
      json: true,
    })

    result.expectSuccess().expectJson((data) => {
      expect(data.message).toBeDefined()
    })
  })

  it('Fluent Assertions: Complete assertion chain', async () => {
    // From README line 584-605
    const result = await runLocalCitty(['--help'], { cwd: playgroundDir })

    result
      .expectSuccess()
      .expectOutput('USAGE')
      .expectOutput(/playground/)
      .expectOutputContains('commands')
      .expectNoStderr()
      .expectOutputLength(10, 1000)
  })

  it('Fluent Assertions: expectExitCodeIn array', async () => {
    // From README line 590
    const result = await runLocalCitty(['--help'], { cwd: playgroundDir })

    result.expectExitCodeIn([0, 1, 2])
  })

  it('Fluent Assertions: expectOutputNotContains', async () => {
    // From README line 594
    const result = await runLocalCitty(['--help'], { cwd: playgroundDir })

    result.expectSuccess().expectOutputNotContains('FATAL_ERROR')
  })
})
