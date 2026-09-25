import { defineCommand } from 'citty'
import { autoMagicCommand } from './auto/magic.js'
import { autoHealCommand } from './auto/heal.js'
import { autoQoLCommand } from './auto/qol.js'

export const autoCommand = defineCommand({
  meta: {
    name: 'auto',
    description: 'Hyper advanced AutoDX, AutoQoL, and AutoEtc generative engine',
  },
  subCommands: {
    magic: autoMagicCommand,
    heal: autoHealCommand,
    qol: autoQoLCommand,
  },
})
