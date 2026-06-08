import { consola } from '@un-test/core'
import { resolve } from 'pathe'
import { existsSync } from 'node:fs'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { execSync } from 'node:child_process'
import * as readline from 'node:readline'

/**
 * Auto Record: Session Transpilation
 * Prompts user for commands, executes them, and builds a scenario test.
 */
export async function autoRecord({ cwd = process.cwd(), cliPath }) {
  consola.info('📼 AutoDX Record initialized...')
  
  let targetCli = cliPath ? resolve(cwd, cliPath) : null
  if (!targetCli) {
    const pkgPath = resolve(cwd, 'package.json')
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(await readFile(pkgPath, 'utf8'))
      if (pkg.bin) {
        const binValue = typeof pkg.bin === 'string' ? pkg.bin : Object.values(pkg.bin)[0]
        targetCli = resolve(cwd, binValue)
      }
    }
  }

  if (!targetCli || !existsSync(targetCli)) {
    throw new Error('❌ Could not auto-detect CLI entry point.')
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const ask = (query) => new Promise(resolve => rl.question(query, resolve))

  consola.info('Starting recording session. Type "exit" or "quit" to finish and generate the test.')
  
  const steps = []
  
  while (true) {
    const input = await ask('\n> ')
    if (input.trim().toLowerCase() === 'exit' || input.trim().toLowerCase() === 'quit') {
      break
    }
    
    if (!input.trim()) continue

    consola.start(`Executing: node ${targetCli} ${input}`)
    
    let stdout = ''
    let stderr = ''
    let exitCode = 0
    let success = true
    
    try {
      stdout = execSync(`node ${targetCli} ${input}`, { encoding: 'utf8', stdio: 'pipe' })
      consola.success(`Command succeeded (Exit 0)`)
      console.log(stdout)
    } catch (err) {
      exitCode = err.status || 1
      stdout = err.stdout?.toString() || ''
      stderr = err.stderr?.toString() || err.message
      success = false
      consola.error(`Command failed (Exit ${exitCode})`)
      if (stdout) console.log('STDOUT:', stdout)
      if (stderr) console.error('STDERR:', stderr)
    }
    
    steps.push({
      input,
      success,
      exitCode,
      stdoutMatch: stdout ? stdout.split('\\n')[0].replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&') : null,
      stderrMatch: stderr ? stderr.split('\\n')[0].replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&') : null
    })
  }

  rl.close()

  if (steps.length === 0) {
    consola.info('No steps recorded. Exiting.')
    return
  }

  const scenarioSteps = steps.map((step, idx) => {
    let code = `      .step('Step ${idx + 1}', ['${step.input.split(' ').join("', '")}'])\n`
    if (step.success) {
      code += `      .expectSuccess()\n`
      if (step.stdoutMatch) code += `      .expectOutput(/${step.stdoutMatch}/)\n`
    } else {
      code += `      .expectFailure()\n`
      if (step.stderrMatch) code += `      .expectStderr(/${step.stderrMatch}/)\n`
    }
    return code
  }).join('')

  const testContent = `
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { runLocalCitty } from '@un-test/runners-local'
import { scenario } from '@un-test/scenario'
import { resolve } from 'pathe'

const CLI_PATH = resolve('${targetCli}')
const CWD = resolve('${cwd}')

describe('AutoDX Recorded Session', () => {
  beforeAll(() => {
    process.env.TEST_CLI_PATH = CLI_PATH
    process.env.TEST_CWD = CWD
  })
  
  afterAll(() => {
    delete process.env.TEST_CLI_PATH
    delete process.env.TEST_CWD
  })

  it('should execute recorded workflow', async () => {
    const s = scenario('Recorded Workflow')
${scenarioSteps}    const result = await s.execute('local')
    expect(result.success).toBe(true)
  })
})
`.trim()

  const testDir = resolve(cwd, 'test/integration')
  if (!existsSync(testDir)) await mkdir(testDir, { recursive: true })
  
  const timestamp = Date.now()
  const outPath = resolve(testDir, `recorded-${timestamp}.test.mjs`)
  await writeFile(outPath, testContent, 'utf8')
  
  consola.success(`✅ Session transpiled and saved to: ${outPath}`)
}
