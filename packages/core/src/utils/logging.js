import { createConsola } from 'consola'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import { hash } from 'ohash'
import { isTest, isCI, isDebug } from 'std-env'
import { renderUnicode } from 'uqr'

// Persistent storage for test performance tracking
const performanceStorage = createStorage({
  driver: fsDriver({ base: '.ctu/cache/performance' }),
})

/**
 * UNJS MAXIMALISM: Advanced Logging System
 * Combines consola for beautiful UI and uqr for crash diagnostics
 */
export const consola = createConsola({
  level: isDebug ? 5 : 3,
  reporters: [
    {
      log: (logObj, ctx) => {
        // Handle critical failures with QR code crash dumps
        if (logObj.level === 0 && logObj.type === 'fatal') {
          // Fatal
          const error = logObj.args[0]
          const errorMessage = error instanceof Error ? error.message : String(error)
          const errorStack = error instanceof Error ? error.stack : new Error().stack

          const crashDump = {
            timestamp: new Date().toISOString(),
            error: errorMessage,
            stack: errorStack,
            process: {
              platform: process.platform,
              version: process.version,
              arch: process.arch,
              cwd: process.cwd(),
              env: Object.keys(process.env).filter(
                (k) => !k.includes('SECRET') && !k.includes('KEY') && !k.includes('TOKEN')
              ),
            },
          }

          const base64Dump = Buffer.from(JSON.stringify(crashDump)).toString('base64')

          let qrCode = ''
          try {
            qrCode = renderUnicode(base64Dump, { border: 1 })
          } catch (e) {
            qrCode = `(QR code too large to display, base64 length: ${base64Dump.length})`
          }

          // Use consola.box for beautiful presentation
          consola.box({
            title: ' 🚨 CRITICAL FAILURE DETECTED 🚨 ',
            style: {
              borderColor: 'red',
              borderStyle: 'double',
              padding: 1,
            },
            message: [
              `Error: ${errorMessage}`,
              '',
              'Scan this QR code to view the base64 encoded crash dump:',
              '',
              qrCode,
              '',
              'Alternatively, report this issue at: https://github.com/seanchatmangpt/citty-test-utils/issues',
            ].join('\n'),
          })

          // Still log to stderr for non-interactive environments
          if (!process.stdout.isTTY) {
            console.error(`FATAL: ${errorMessage}\n${errorStack}`)
          }
          return
        }

        const args = Array.isArray(logObj.args) ? logObj.args : [logObj.args]

        // In test mode, keep it clean unless verbose
        if (isTest && !process.env.VERBOSE) {
          return
        }

        // Use standard consola formatting for other levels
        // We can use a trick to delegate to default console or use another reporter
        // But for UNJS maximalism, let's keep it clean
        console.log(...args)
      },
    },
  ],
})

/**
 * Innovative Feature #1: Performance Regression Monitor
 * Powered by unstorage + ohash + consola
 */
export async function monitorPerformance(command, currentDuration) {
  if (isCI) return // Skip in CI to avoid noise

  const cmdHash = hash(command)
  const key = `baseline:${cmdHash}`

  const history = (await performanceStorage.getItem(key)) || []

  if (history.length > 3) {
    const avg = history.reduce((a, b) => a + b, 0) / history.length
    const threshold = avg * 1.5 // 50% slower than average

    if (currentDuration > threshold && currentDuration > 500) {
      consola.warn(`🚀 Performance Regression Detected!`)
      consola.log(`   Command:  ${command}`)
      consola.log(`   Current:  ${currentDuration}ms`)
      consola.log(`   Baseline: ${Math.round(avg)}ms (avg of ${history.length} runs)`)
      consola.log(`   Slowdown: +${Math.round(((currentDuration - avg) / avg) * 100)}%`)
    }
  }

  // Update history (keep last 10 runs)
  const updatedHistory = [...history, currentDuration].slice(-10)
  await performanceStorage.setItem(key, updatedHistory)
}
