import { createConsola } from 'consola'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import { hash } from 'ohash'
import { isTest, isCI } from 'std-env'

// Persistent storage for test performance tracking
const performanceStorage = createStorage({
  driver: fsDriver({ base: '.ctu/cache/performance' })
})

export const consola = createConsola({
  reporters: [
    {
      log: (logObj) => {
        const args = Array.isArray(logObj.args) ? logObj.args : [logObj.args]
        // In test mode, keep it clean
        if (isTest && !process.env.VERBOSE) {
           console.log(...args)
           return
        }
        console.log(...args)
      }
    }
  ]
})

/**
 * Innovative Feature #1: Performance Regression Monitor
 * Powered by unstorage + ohash + consola
 */
export async function monitorPerformance(command, currentDuration) {
  if (isCI) return // Skip in CI to avoid noise

  const cmdHash = hash(command)
  const key = `baseline:${cmdHash}`
  
  const history = await performanceStorage.getItem(key) || []
  
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
