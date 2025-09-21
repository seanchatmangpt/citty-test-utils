#!/usr/bin/env node
// Simple cleanroom test to check if basic functionality works

import { setupCleanroom, runCitty, teardownCleanroom } from './src/core/runners/cleanroom-runner.js'

async function testCleanroom() {
  console.log('🧪 Testing basic cleanroom functionality...')

  try {
    console.log('📦 Setting up cleanroom...')
    await setupCleanroom({ rootDir: '.', timeout: 30000 })
    console.log('✅ Cleanroom setup successful')

    console.log('🚀 Running test command in cleanroom...')
    const result = await runCitty(['--help'], {
      env: { TEST_CLI: 'true' },
      timeout: 10000,
    })

    console.log('📊 Result:', {
      exitCode: result.exitCode,
      stdout: result.stdout.substring(0, 100) + '...',
      stderr: result.stderr,
    })

    if (result.exitCode === 0) {
      console.log('✅ Cleanroom test successful!')
    } else {
      console.log('❌ Cleanroom test failed with exit code:', result.exitCode)
    }
  } catch (error) {
    console.error('❌ Cleanroom test failed:', error.message)
  } finally {
    console.log('🧹 Cleaning up cleanroom...')
    await teardownCleanroom()
    console.log('✅ Cleanup complete')
  }
}

testCleanroom()
