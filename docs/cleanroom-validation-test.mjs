#!/usr/bin/env node
/**
 * README Cleanroom Example Validation Test
 * Tests Docker cleanroom examples from README (Lines 59-68)
 */

import { setupCleanroom, runCitty, teardownCleanroom } from '../index.js'

console.log('=== Testing README Cleanroom Examples ===\n')

console.log('Test: Docker Cleanroom Setup and Execution (Lines 59-68)')
try {
  console.log('Setting up cleanroom...')
  await setupCleanroom({ rootDir: './playground' })

  console.log('Running command in cleanroom...')
  const info = await runCitty(['--help'])

  info.expectSuccess().expectOutput('USAGE')
  const firstLine = info.result.stdout.split('\n')[0]
  console.log(`✓ First line: ${firstLine}`)

  console.log('Tearing down cleanroom...')
  await teardownCleanroom()

  console.log('✓ Cleanroom example works correctly')
} catch (error) {
  console.error(`✗ FAILED: ${error.message}`)
  try {
    await teardownCleanroom()
  } catch (e) {
    // Cleanup failed, continue
  }
}

console.log('\n=== Cleanroom Validation Complete ===')
