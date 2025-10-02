#!/usr/bin/env node
/**
 * README Example Validation Test
 * Tests all critical examples from README to ensure documentation accuracy
 */

import { runLocalCitty, scenario } from '../index.js'

console.log('=== Testing README Quick Start Examples ===\n')

// Test 1: Drive the bundled playground locally (Lines 29-41)
console.log('Test 1: Local Runner with Playground')
try {
  const help = await runLocalCitty(['--help'], {
    cwd: './playground',
    env: { TEST_CLI: 'true' },
  })

  help.expectSuccess().expectOutput('USAGE')
  const firstLine = help.result.stdout.split('\n')[0]
  console.log(`✓ First line: ${firstLine}`)

  if (!firstLine.includes('Test CLI') || !firstLine.includes('test-cli')) {
    console.warn('⚠ Warning: Expected first line format changed')
  }
} catch (error) {
  console.error(`✗ FAILED: ${error.message}`)
}

console.log('\nTest 2: Multi-step Scenario (Lines 44-56)')
try {
  const result = await scenario('Playground smoke test')
    .step('Show help')
    .run('--help', { cwd: './playground', env: { TEST_CLI: 'true' } })
    .expectSuccess()
    .expectOutput('USAGE')
    .step('Reject invalid command')
    .run('invalid-command', { cwd: './playground', env: { TEST_CLI: 'true' } })
    .expectFailure()
    .execute('local')

  console.log(`✓ Scenario completed: ${result.success ? 'SUCCESS' : 'FAILED'}`)
} catch (error) {
  console.error(`✗ FAILED: ${error.message}`)
}

console.log('\nTest 3: API Reference - Local Runner (Lines 315-333)')
try {
  const result = await runLocalCitty(['--help'], {
    cwd: './playground',
    json: false,
    timeout: 30000,
    env: {
      DEBUG: 'true',
      NODE_ENV: 'test'
    }
  })

  result
    .expectSuccess()
    .expectOutput('USAGE')
    .expectOutput(/test-cli/)
    .expectNoStderr()

  console.log('✓ API Reference example works correctly')
} catch (error) {
  console.error(`✗ FAILED: ${error.message}`)
}

console.log('\nTest 4: Scenario DSL with Pre-built Scenarios (Lines 393-430)')
try {
  const result = await scenario('Complete workflow')
    .step('Get help')
    .run('--help', { cwd: './playground', env: { TEST_CLI: 'true' } })
    .expectSuccess()
    .expectOutput('USAGE')
    .step('Get version')
    .run(['--version'], { cwd: './playground', env: { TEST_CLI: 'true' } })
    .expectSuccess()
    .expectOutput(/\d+\.\d+\.\d+/)
    .step('Test invalid command')
    .run('invalid-command', { cwd: './playground', env: { TEST_CLI: 'true' } })
    .expectFailure()
    .execute('local')

  console.log(`✓ Scenario DSL example works: ${result.success ? 'SUCCESS' : 'FAILED'}`)
} catch (error) {
  console.error(`✗ FAILED: ${error.message}`)
}

console.log('\n=== README Validation Complete ===')
