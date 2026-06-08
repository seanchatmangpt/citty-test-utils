import { defineCommand } from 'citty'
import { autoMagicCommand } from './auto/magic.js'
import { autoHealCommand } from './auto/heal.js'
import { autoQoLCommand } from './auto/qol.js'
import { autoCoverCommand } from './auto/cover.js'
import { autoDocsCommand } from './auto/docs.js'
import { autoEvolveCommand } from './auto/evolve.js'
import { autoIsolateCommand } from './auto/isolate.js'
import { autoMockCommand } from './auto/mock.js'
import { autoRecordCommand } from './auto/record.js'

export const autoCommand = defineCommand({
  meta: {
    name: 'auto',
    description: 'Hyper advanced AutoDX, AutoQoL, and AutoEtc generative engine',
  },
  subCommands: {
    magic: autoMagicCommand,
    heal: autoHealCommand,
    qol: autoQoLCommand,
    cover: autoCoverCommand,
    docs: autoDocsCommand,
    evolve: autoEvolveCommand,
    isolate: autoIsolateCommand,
    mock: autoMockCommand,
    record: autoRecordCommand,
  },
})
