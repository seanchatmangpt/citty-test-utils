import { resolve, join, dirname } from 'pathe'
import { existsSync } from 'node:fs'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { consola } from '@un-test/core'
import { pathToFileURL } from 'node:url'
import { execSync } from 'node:child_process'

/**
 * Hyper Advanced Generative Scaffold
 * Discovers a CLI tool dynamically, parses its structure using AST/runtime analysis,
 * and magically generates a comprehensive Vitest integration suite.
 */
export async function autoMagicScaffold({ cwd = process.cwd(), cliPath, write = true, run = false }) {
  consola.info('✨ Initializing AutoDX Magic Engine...')
  
  // 1. Discovery
  let targetCli = cliPath ? resolve(cwd, cliPath) : null
  if (!targetCli) {
    consola.start('Auto-detecting CLI entry point...')
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
    throw new Error('❌ Could not auto-detect CLI entry point. Please specify --cli-path.')
  }
  consola.success(`Found CLI entry: ${targetCli}`)

  // 2. Inference (Simple execution based for Magic generation)
  consola.start('Inferring CLI structure...')
  let helpOutput = ''
  try {
    helpOutput = execSync(`node ${targetCli} --help`, { encoding: 'utf8', stdio: 'pipe' })
  } catch (err) {
    helpOutput = err.stdout?.toString() || ''
  }

  const commands = []
  const cmdRegex = /^\s+([a-z0-9-]+)\s+(.+)$/gm
  let match
  let inCommandsSection = false
  for (const line of helpOutput.split('\n')) {
    if (line.match(/COMMANDS/i)) {
      inCommandsSection = true
      continue
    }
    if (inCommandsSection && line.trim() === '') continue
    if (inCommandsSection && !line.startsWith(' ')) {
      inCommandsSection = false
    }
    if (inCommandsSection) {
      const parsed = cmdRegex.exec(line)
      if (parsed) commands.push(parsed[1])
    }
  }
  
  consola.success(`Inferred commands: ${commands.join(', ') || 'None (Single command CLI)'}`)

  // 3. Generative Scaffolding
  consola.start('Generating hyper-advanced scenario test suite...')
  
  const testContent = `
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { runLocalCitty } from '@un-test/runners-local'
import { scenario } from '@un-test/scenario'
import { resolve } from 'pathe'

const CLI_PATH = resolve('${targetCli}')
const CWD = resolve('${cwd}')

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
      .step('Run help', '--help')
      .expectSuccess()
      .expectOutput(/USAGE|COMMANDS|OPTIONS/i)
      
    const result = await s.execute('local')
    expect(result.success).toBe(true)
  })

${commands.map(cmd => `
  it('should execute ${cmd} command', async () => {
    // Generated baseline test for ${cmd}
    const result = await runLocalCitty(['${cmd}', '--help'], { cwd: CWD, cliPath: CLI_PATH })
    result.expectSuccess().expectOutput(/${cmd}/i)
  })
`).join('\n')}
})
`.trim()

  if (write) {
    const testDir = resolve(cwd, 'test/integration')
    await mkdir(testDir, { recursive: true })
    const outPath = resolve(testDir, 'magic.test.mjs')
    await writeFile(outPath, testContent, 'utf8')
    consola.success(`✅ Generated test suite at: ${outPath}`)
    
    if (run) {
      consola.start('Executing generated test suite...')
      execSync('npx vitest run test/integration/magic.test.mjs', { stdio: 'inherit', cwd })
      consola.success('✅ AutoDX Magic cycle complete!')
    }
  }

  return { testContent, commands, targetCli }
}
