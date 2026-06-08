import { defineCommand } from 'citty'
import { autoCover } from '../../../autodx/src/cover.js'

export const autoCoverCommand = defineCommand({
  meta: {
    name: 'cover',
    description: 'Generative Coverage: Analyzes the CLI AST and generates missing test scenarios',
  },
  args: {
    'cli-path': {
      type: 'string',
      description: 'Path to the target CLI to test (auto-detected if omitted)',
    },
  },
  async run(ctx) {
    await autoCover({
      cwd: process.cwd(),
      cliPath: ctx.args['cli-path'],
    })
  },
})
