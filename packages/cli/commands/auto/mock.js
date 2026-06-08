import { defineCommand } from 'citty'
import { autoMock } from '../../../autodx/src/mock.js'

export const autoMockCommand = defineCommand({
  meta: {
    name: 'mock',
    description: 'Zero-Friction Determinism: Scaffolds network request interception fixtures',
  },
  async run() {
    await autoMock({ cwd: process.cwd() })
  },
})
