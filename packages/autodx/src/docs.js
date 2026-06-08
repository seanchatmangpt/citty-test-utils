import { consola } from '@un-test/core'
import { resolve } from 'pathe'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { execSync } from 'node:child_process'

/**
 * Auto Docs: Living Documentation
 * Parses the CLI and updates README.md automatically.
 */
export async function autoDocs({ cwd = process.cwd(), cliPath }) {
  consola.info('📝 AutoDX Docs initialized...')
  
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

  consola.start('Extracting CLI specification...')
  
  const helpOutput = execSync(`node ${targetCli} --help`, { encoding: 'utf8', stdio: 'pipe' })

  // Parse commands from help output
  const commands = []
  const cmdRegex = /^\s+([a-z0-9-]+)\s+(.+)$/gm
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
      if (parsed) {
        commands.push({ name: parsed[1], desc: parsed[2].trim() })
      }
    }
  }

  consola.info(`Found ${commands.length} commands. Generating markdown...`)

  let docsContent = `\n## CLI Commands\n\n| Command | Description |\n|---------|-------------|\n`
  commands.forEach(cmd => {
    docsContent += `| \`${cmd.name}\` | ${cmd.desc} |\n`
  })

  // Read README.md
  const readmePath = resolve(cwd, 'README.md')
  if (existsSync(readmePath)) {
    let readme = await readFile(readmePath, 'utf8')
    // Replace existing commands section or append
    const sectionRegex = /## CLI Commands[\s\S]*?(?=##|$)/
    if (sectionRegex.test(readme)) {
      readme = readme.replace(sectionRegex, docsContent + '\n')
    } else {
      readme += docsContent
    }
    await writeFile(readmePath, readme, 'utf8')
    consola.success('✅ README.md updated with latest CLI structure!')
  } else {
    await writeFile(readmePath, `# CLI Project\n${docsContent}`, 'utf8')
    consola.success('✅ Created README.md with CLI structure!')
  }
}
