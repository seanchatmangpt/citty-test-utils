import { describe, it, expect } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const playgroundDir = join(__dirname, '../..')

describe('README Local Runner Examples', () => {
  it('Local Runner: Basic execution with options', async () => {
    // From README line 302-314
    const result = await runLocalCitty(['--help'], {
      cwd: playgroundDir,
      timeout: 30000,
      env: {
        DEBUG: 'true',
      },
    })

    result.expectSuccess().expectOutput('USAGE').expectNoStderr()
  })

  it('Local Runner: With working directory', async () => {
    // From README line 423-435
    const result = await runLocalCitty(['--help'], {
      cwd: playgroundDir,
    })

    result.expectSuccess().expectOutput('USAGE').expectNoStderr()
  })

  it('Local Runner: Complete API usage', async () => {
    // From README line 532-551
    const result = await runLocalCitty(['--help'], {
      cwd: playgroundDir,
      json: false,
      timeout: 30000,
      env: {
        DEBUG: 'true',
        NODE_ENV: 'test',
      },
    })

    result
      .expectSuccess()
      .expectOutput('USAGE')
      .expectOutput(/playground/i)
      .expectNoStderr()
      .expectOutputLength(10, 5000)
  })

  it('Local Runner: Testing greet command', async () => {
    // From README line 787-796
    const localResult = await runLocalCitty(['greet', 'Alice'], {
      cwd: playgroundDir,
      env: { DEBUG: 'true' },
    })

    localResult.expectSuccess().expectOutput('Alice').expectNoStderr()
  })
})
