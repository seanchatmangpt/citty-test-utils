import { defineCommand } from 'citty'
import { autoQoLZeroConfig } from '../../../autodx/src/qol.js'

export const autoQoLCommand = defineCommand({
  meta: {
    name: 'qol',
    description: 'AutoQoL Zero-Config environment setup for rapid DX',
  },
  async run() {
    await autoQoLZeroConfig({ cwd: process.cwd() })
  },
})
