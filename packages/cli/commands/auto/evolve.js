import { defineCommand } from 'citty'
import { autoEvolve } from '../../../autodx/src/evolve.js'

export const autoEvolveCommand = defineCommand({
  meta: {
    name: 'evolve',
    description: 'The Omnipresent Daemon: Watches for changes and recursively applies AutoDX features',
  },
  args: {
    'cli-path': {
      type: 'string',
      description: 'Path to the target CLI to test (auto-detected if omitted)',
    },
  },
  async run(ctx) {
    await autoEvolve({
      cwd: process.cwd(),
      cliPath: ctx.args['cli-path'],
    })
  },
})
