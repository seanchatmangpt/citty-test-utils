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
import { analysisCommand } from './commands/analysis.js'
import { installDepsCommand } from './commands/install-deps.js'

// Create hooks instance
const hooks = createHooks()

// Top-level error handlers
process.on('unhandledRejection', (error) => {
  consola.error('Error:', error.message)
  if (isDebug) consola.error(error.stack)
  process.exit(1)
})

const utu = defineCommand({
  meta: {
    name: 'utu',
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
        try {
          const fullPath = resolve(process.cwd(), path)
          const plugin = await import(pathToFileURL(fullPath).href).then(m => m.default || m)
          if (typeof plugin === 'function') {
            await plugin(hooks)
          } else if (plugin && typeof plugin.setup === 'function') {
            await plugin.setup(hooks)
          }
          consola.success(`Loaded plugin: ${path}`)
        } catch (err) {
          consola.error(`Failed to load plugin ${path}:`, err.message)
        }
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
       // ... simplified help forutu ...
       console.log('un-test-utils CLI (utu v1.0.0)')
       console.log('\nUSAGE utu <noun> <verb> [options]')
    }
    await hooks.callHook('utu:afterRun', ctx)
  },
  subCommands: {
    test: testCommand,
    gen: genCommand,
    runner: runnerCommand,
    info: infoCommand,
    analysis: analysisCommand,
    'install-deps': installDepsCommand,
  },
})

runMain(utu)
