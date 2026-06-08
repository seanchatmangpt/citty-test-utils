import { defineCommand } from 'citty'
import { autoRecord } from '../../../autodx/src/record.js'

export const autoRecordCommand = defineCommand({
  meta: {
    name: 'record',
    description: 'Session Transpilation: Prompts user for commands, executes them, and builds a scenario test',
  },
  args: {
    'cli-path': {
      type: 'string',
      description: 'Path to the target CLI to test (auto-detected if omitted)',
    },
  },
  async run(ctx) {
    await autoRecord({
      cwd: process.cwd(),
      cliPath: ctx.args['cli-path'],
    })
  },
})
