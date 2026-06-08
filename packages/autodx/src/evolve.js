import { consola } from '@un-test/core'
import { autoCover } from './cover.js'
import { autoDocs } from './docs.js'
import { autoHeal } from './heal.js'
import { watch } from 'node:fs'
import { resolve } from 'pathe'

/**
 * Auto Evolve: The Omnipresent Daemon
 * Watches for file changes and recursively applies AutoDX features.
 */
export async function autoEvolve({ cwd = process.cwd(), cliPath }) {
  consola.info('🔄 AutoDX Evolve daemon initialized...')
  consola.info('Watching for changes in src/ and test/ directories...')

  const srcDir = resolve(cwd, 'src')
  
  let isProcessing = false

  const processChanges = async () => {
    if (isProcessing) return
    isProcessing = true
    consola.start('Change detected! Evolving project...')
    await autoDocs({ cwd, cliPath })
    await autoCover({ cwd, cliPath })
    await autoHeal({ cwd })
    consola.success('✅ Evolution cycle complete. Waiting for changes...')
    isProcessing = false
  }

  watch(srcDir, { recursive: true }, (eventType, filename) => {
    if (filename && (filename.endsWith('.js') || filename.endsWith('.mjs'))) {
      processChanges().catch(err => {
        consola.fatal('Evolution cycle failed catastrophically:', err)
        process.exit(1)
      })
    }
  })
}
