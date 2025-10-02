#!/usr/bin/env node
/**
 * Fluent Assertions API Reference Validation Test
 * Tests examples from Lines 135-147 and 365-387
 */

import { runLocalCitty } from '../index.js'

console.log('=== Testing Fluent Assertions Examples ===\n')

console.log('Test 1: Basic Fluent Assertions (Lines 135-147)')
try {
  const result = await runLocalCitty(['--help'], {
    cwd: './playground',
    env: { TEST_CLI: 'true' }
  })

  result
    .expectSuccess()                    // expectExit(0)
    .expectOutput('USAGE')              // String match
    .expectOutput(/test-cli/)           // Regex match
    .expectOutputContains('commands')   // Contains text
    .expectNoStderr()                   // Expect empty stderr

  console.log('✓ Basic fluent assertions work')
} catch (error) {
  console.error(`✗ FAILED: ${error.message}`)
}

console.log('\nTest 2: Advanced Fluent Assertions (Lines 365-387)')
try {
  const result = await runLocalCitty(['--help'], {
    cwd: './playground',
    env: { TEST_CLI: 'true' }
  })

  result
    .expectSuccess()                    // expectExit(0)
    .expectExit(0)                      // Check specific exit code
    .expectOutput('USAGE')              // String match
    .expectOutput(/test-cli/)           // Regex match
    .expectOutputContains('commands')   // Contains text
    .expectNoStderr()                   // Expect empty stderr

  console.log('✓ Advanced fluent assertions work')
} catch (error) {
  console.error(`✗ FAILED: ${error.message}`)
}

console.log('\nTest 3: Failure Expectations')
try {
  const result = await runLocalCitty(['invalid-command'], {
    cwd: './playground',
    env: { TEST_CLI: 'true' }
  })

  result.expectFailure()  // Expect non-zero exit code

  console.log('✓ Failure expectation works')
} catch (error) {
  console.error(`✗ FAILED: ${error.message}`)
}

console.log('\nTest 4: Version with Regex Pattern')
try {
  const result = await runLocalCitty(['--version'], {
    cwd: './playground',
    env: { TEST_CLI: 'true' }
  })

  result
    .expectSuccess()
    .expectOutput(/\d+\.\d+\.\d+/)  // Regex for version pattern

  console.log('✓ Regex pattern matching works')
} catch (error) {
  console.error(`✗ FAILED: ${error.message}`)
}

console.log('\n=== Fluent Assertions Validation Complete ===')
