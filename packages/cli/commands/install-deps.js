import { defineCommand } from 'citty'
import { installDependencies } from 'nypm'

export const installDepsCommand = defineCommand({
  meta: {
    name: 'install-deps',
    description: 'Automatically detect package manager and install dependencies',
  },
  args: {
    cwd: {
      type: 'string',
      description: 'Current working directory',
      default: '.',
    },
  },
  async run({ args }) {
    await installDependencies({
      cwd: args.cwd,
      silent: false,
    })
  },
})
