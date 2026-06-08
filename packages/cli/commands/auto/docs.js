import { defineCommand } from 'citty'
import { autoDocs } from '../../../autodx/src/docs.js'

export const autoDocsCommand = defineCommand({
  meta: {
    name: 'docs',
    description: 'Living Documentation: Parses the CLI and updates README.md automatically',
  },
  args: {
    'cli-path': {
      type: 'string',
      description: 'Path to the target CLI to test (auto-detected if omitted)',
    },
  },
  async run(ctx) {
    await autoDocs({
      cwd: process.cwd(),
      cliPath: ctx.args['cli-path'],
    })
  },
})
