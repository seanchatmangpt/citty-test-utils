import { defineCommand } from 'citty'
import { autoHeal } from '../../../autodx/src/heal.js'

export const autoHealCommand = defineCommand({
  meta: {
    name: 'heal',
    description: 'AutoDX feature that automatically corrects failing test snapshots',
  },
  async run() {
    await autoHeal({ cwd: process.cwd() })
  },
})
