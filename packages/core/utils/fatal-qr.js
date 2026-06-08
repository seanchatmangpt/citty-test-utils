import { consola } from 'consola'
import { renderUnicode } from 'uqr'

/**
 * Attaches an 'uncaughtException' listener that prints a QR code of the crash dump.
 * UNJS MAXIMALISM: Turning fatal errors into scannable diagnostics.
 */
export function installFatalReporter() {
  process.on('uncaughtException', (error) => {
    const stack = error?.stack || String(error)
    const jsonStack = JSON.stringify(stack)
    const base64Stack = Buffer.from(jsonStack).toString('base64')
    
    consola.log('\n--- FATAL ERROR QR DUMP ---')
    consola.log(renderUnicode(base64Stack))
    consola.log('--- END OF QR DUMP ---\n')
    
    // We exit to prevent the process from hanging in an unstable state
    process.exit(1)
  })
}
