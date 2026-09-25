import { defineCommand } from 'citty'
import { autoMagicScaffold } from '../../../autodx/src/magic.js'

export const autoMagicCommand = defineCommand({
  meta: {
    name: 'magic',
    description: 'Auto-detects CLI, infers structure, and generates complete test suites',
  },
  args: {
    'cli-path': {
      type: 'string',
      description: 'Path to the target CLI to test (auto-detected if omitted)',
    },
    run: {
      type: 'boolean',
      description: 'Run the generated suite immediately after generation',
      default: false,
    },
    'dry-run': {
      type: 'boolean',
      description: 'Perform inference but do not write files',
      default: false,
    },
  },
  async run(ctx) {
    await autoMagicScaffold({
      cwd: process.cwd(),
      cliPath: ctx.args['cli-path'],
      write: !ctx.args['dry-run'],
      run: ctx.args.run,
    })
  },
})
