import { defineCommand, runMain } from 'citty'
import { consola } from '@un-test/core'
import { isDebug } from 'std-env'
import { createHooks } from 'hookable'
import { resolve } from 'pathe'
import { pathToFileURL } from 'node:url'
import { testCommand } from './commands/test.js'
import { genCommand } from './commands/gen.js'
import { runnerCommand } from './commands/runner.js'
import { infoCommand } from './commands/info.js'
import { installDepsCommand } from './commands/install-deps.js'
import { autoCommand } from './commands/auto.js'
import { analysisCommand } from './commands/analysis.js'

// Create hooks instance
const hooks = createHooks()

// Top-level error handlers
// Removed unhandledRejection to ensure hard crashes (Toyota Production System philosophy)

const utu = defineCommand({
  meta: {
    name: 'ctu',
    version: '1.0.0',
    description: 'un-test-utils CLI - Modular testing framework construction kit',
  },
  args: {
    'show-help': { type: 'boolean', description: 'Show help information', default: false },
    'show-version': { type: 'boolean', description: 'Show version information', default: false },
    json: { type: 'boolean', description: 'Output in JSON format', default: false },
    verbose: { type: 'boolean', description: 'Enable verbose output', default: false },
    plugins: { type: 'string', description: 'Comma-separated paths to plugin scripts' },
  },
  async setup(ctx) {
    // Load plugins if provided
    if (ctx.args.plugins) {
      const pluginPaths = ctx.args.plugins.split(',')
      for (const path of pluginPaths) {
        const fullPath = resolve(process.cwd(), path)
        const plugin = await import(pathToFileURL(fullPath).href).then(m => m.default || m)
        if (typeof plugin === 'function') {
          await plugin(hooks)
        } else if (plugin && typeof plugin.setup === 'function') {
          await plugin.setup(hooks)
        }
        consola.success(`Loaded plugin: ${path}`)
      }
    }
    await hooks.callHook('utu:setup', ctx)
  },
  run: async (ctx) => {
    await hooks.callHook('utu:beforeRun', ctx)
    const { 'show-help': showHelp, 'show-version': showVersion, json, verbose } = ctx.args
    if (verbose) consola.level = 4

    if (showVersion) {
      console.log('1.0.0')
      return
    }

    if (showHelp || ctx.args._.length === 0) {
       // ... simplified help for ctu ...
       console.log('un-test-utils CLI (ctu v1.0.0)')
       console.log('\nUSAGE ctu <noun> <verb> [options]')
    }
    await hooks.callHook('utu:afterRun', ctx)
  },
  subCommands: {
    auto: autoCommand,
    analysis: analysisCommand,
    test: testCommand,
    gen: genCommand,
    runner: runnerCommand,
    info: infoCommand,
    'install-deps': installDepsCommand,
  },
})

const subcommands = ['auto', 'analysis', 'test', 'gen', 'runner', 'info', 'install-deps']
const args = process.argv.slice(2)
const firstPositional = args.find(arg => !arg.startsWith('-'))

if (firstPositional && !subcommands.includes(firstPositional)) {
  console.error(`Unknown command: ${firstPositional}`)
  console.log('un-test-utils CLI (ctu v1.0.0)')
  console.log('\nUSAGE ctu [OPTIONS] auto|analysis|test|gen|runner|info|install-deps')
  console.log('\nOPTIONS')
  console.log('  --show-help       Show help information')
  console.log('  --show-version    Show version information')
  console.log('  --json            Output in JSON format')
  console.log('  --verbose         Enable verbose output')
  console.log('\nCOMMANDS')
  console.log('  auto            Hyper advanced AutoDX, AutoQoL, and AutoEtc generative engine')
  console.log('  analysis        Analyze CLI test coverage and generate reports')
  console.log('  test            Run tests and scenarios')
  console.log('  gen             Generate test files and templates using nunjucks')
  console.log('  runner          Custom runner functionality')
  console.log('  info            Show CLI information')
  console.log('  install-deps    Automatically detect package manager and install dependencies')
  process.exit(1)
}

runMain(utu)
