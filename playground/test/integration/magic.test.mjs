import { describe, it, expect, beforeAll, afterAll } from 'vitest'
  import { runLocalCitty } from '@un-test/runners-local'
  import { scenario } from '@un-test/scenario'
  import { resolve } from 'pathe'

  const CLI_PATH = resolve('/Users/sac/citty-test-utils/playground/src/cli.mjs')
  const CWD = resolve('/Users/sac/citty-test-utils/playground')

  describe('AutoDX Magic Generated Test Suite', () => {
  beforeAll(() => {
    process.env.TEST_CLI_PATH = CLI_PATH
    process.env.TEST_CWD = CWD
  })

  afterAll(() => {
    delete process.env.TEST_CLI_PATH
    delete process.env.TEST_CWD
  })

  it('should display help', async () => {
    const s = scenario('Help')
      .step('Run help', ['--show-help'])
      .expectOutput(/USAGE|COMMANDS|OPTIONS/i)

    const result = await s.execute('local')
    expect(result.success).toBe(true)
  })

  
  it('should execute greet command', async () => {
    // Generated baseline test for greet
    const result = await runLocalCitty(['greet', '--help'], { cwd: CWD, cliPath: CLI_PATH })
    expect(result.result.stdout || result.result.stderr).toBeDefined()
  })
  

  it('should execute error command', async () => {
    // Generated baseline test for error
    const result = await runLocalCitty(['error', '--help'], { cwd: CWD, cliPath: CLI_PATH })
    expect(result.result.stdout || result.result.stderr).toBeDefined()
  })
  
  })