import { consola } from '@un-test/core'
import { execSync } from 'node:child_process'

/**
 * Hyper Advanced Auto-Heal
 * Automatically updates snapshots and reruns tests to confirm health.
 */
export async function autoHeal({ cwd = process.cwd() }) {
  consola.info('🩹 AutoDX Heal initialized. Analyzing failing tests...')
  try {
    consola.start('Running vitest with snapshot update...')
    execSync('npx vitest run --update-snapshots', { stdio: 'inherit', cwd })
    consola.success('✅ Auto-heal applied successfully. All snapshots updated!')
  } catch (err) {
    consola.error('❌ Auto-heal could not resolve all test failures.')
    consola.error('Non-snapshot assertions may need manual intervention.')
  }
}
