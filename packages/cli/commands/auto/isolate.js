import { defineCommand } from 'citty'
import { autoIsolate } from '../../../autodx/src/isolate.js'

export const autoIsolateCommand = defineCommand({
  meta: {
    name: 'isolate',
    description: 'Imperceptible Docker Isolation: Scans the project and scaffolds a Docker cleanroom',
  },
  async run() {
    await autoIsolate({ cwd: process.cwd() })
  },
})
