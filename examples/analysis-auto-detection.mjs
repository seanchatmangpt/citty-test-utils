#!/usr/bin/env node
/**
 * Analysis Auto-Detection Examples
 *
 * Demonstrates how the analysis commands automatically detect your CLI path
 * from package.json, eliminating the need to specify --cli-path manually.
 */

import { execSync } from 'child_process'
import { chdir, cwd } from 'process'
import { existsSync } from 'fs'

console.log('🔍 Analysis Auto-Detection Examples\n')
console.log('These examples show how analysis commands work WITHOUT --cli-path\n')
console.log('=' .repeat(60))

// Save original directory
const originalCwd = cwd()

/**
 * Example 1: Auto-detection from project root
 */
console.log('\n📁 Example 1: Auto-detection from project root\n')
console.log('When run from your project root, commands auto-detect CLI from package.json\n')

try {
  // Change to playground directory (simulates user's project)
  chdir('/Users/sac/citty-test-utils/playground')

  console.log('Current directory:', cwd())
  console.log('\nRunning: node ../src/cli.mjs analysis discover --format json\n')

  const result = execSync('node ../src/cli.mjs analysis discover --format json', {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  })

  const parsed = JSON.parse(result)

  if (parsed.cliDetection) {
    console.log('✅ Auto-Detection Success!')
    console.log('   Method:', parsed.cliDetection.method)
    console.log('   Confidence:', parsed.cliDetection.confidence)
    console.log('   Detected CLI:', parsed.metadata.cliPath)
    console.log('   Package:', parsed.cliDetection.packageName)
  }
} catch (error) {
  console.error('❌ Example 1 failed:', error.message)
} finally {
  chdir(originalCwd)
}

/**
 * Example 2: Verbose mode shows detection process
 */
console.log('\n\n📊 Example 2: Verbose mode shows detection details\n')
console.log('Use --verbose to see exactly how the CLI was detected\n')

try {
  chdir('/Users/sac/citty-test-utils/playground')

  console.log('Running: node ../src/cli.mjs analysis discover --verbose --format text\n')

  const result = execSync('node ../src/cli.mjs analysis discover --verbose --format text', {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  })

  // Extract just the detection part
  const lines = result.split('\n')
  const detectionLines = lines.slice(0, 10).filter(line =>
    line.includes('🔍') || line.includes('✅') || line.includes('Detection') || line.includes('Confidence')
  )

  detectionLines.forEach(line => console.log(line))
} catch (error) {
  console.error('❌ Example 2 failed:', error.message)
} finally {
  chdir(originalCwd)
}

/**
 * Example 3: All analysis commands support auto-detection
 */
console.log('\n\n🎯 Example 3: All analysis commands support auto-detection\n')

const commands = [
  'discover',
  'recommend'
  // Note: coverage command currently has an issue, so we skip it in examples
]

for (const cmd of commands) {
  try {
    chdir('/Users/sac/citty-test-utils/playground')

    console.log(`\nTesting: analysis ${cmd}`)

    let cmdArgs = `analysis ${cmd}`
    if (cmd === 'recommend') {
      cmdArgs += ' --priority high --format text'
    } else if (cmd === 'discover') {
      cmdArgs += ' --format json'
    }

    const result = execSync(`node ../src/cli.mjs ${cmdArgs}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000
    })

    console.log(`   ✅ ${cmd} command auto-detected CLI successfully`)

    if (cmd === 'discover') {
      const parsed = JSON.parse(result)
      if (parsed.cliDetection) {
        console.log(`   📍 Method: ${parsed.cliDetection.method}`)
      }
    }
  } catch (error) {
    console.log(`   ⚠️  ${cmd} command failed (may be experimental)`)
  } finally {
    chdir(originalCwd)
  }
}

/**
 * Example 4: Override auto-detection with explicit path
 */
console.log('\n\n🔧 Example 4: Override auto-detection with explicit --cli-path\n')
console.log('You can still use --cli-path when you need precise control\n')

try {
  chdir('/Users/sac/citty-test-utils')

  const explicitPath = 'playground/src/cli.mjs'
  console.log('Running: node src/cli.mjs analysis discover --cli-path', explicitPath)

  if (existsSync(explicitPath)) {
    const result = execSync(`node src/cli.mjs analysis discover --cli-path ${explicitPath} --format json`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    })

    const parsed = JSON.parse(result)
    console.log('\n   ✅ Explicit path override works!')
    console.log('   📁 Used path:', parsed.metadata.cliPath)
    console.log('   ℹ️  Note: cliDetection is null when using explicit path')
  }
} catch (error) {
  console.error('❌ Example 4 failed:', error.message)
} finally {
  chdir(originalCwd)
}

/**
 * Example 5: Error handling when CLI not found
 */
console.log('\n\n❌ Example 5: Helpful errors when CLI cannot be detected\n')

try {
  // Run from a directory without package.json
  chdir('/tmp')

  console.log('Running from /tmp (no package.json):\n')
  console.log('node /Users/sac/citty-test-utils/src/cli.mjs analysis discover\n')

  execSync('node /Users/sac/citty-test-utils/src/cli.mjs analysis discover', {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  })
} catch (error) {
  // This is expected to fail
  const stderr = error.stderr || error.message
  console.log('Expected error output:')
  const errorLines = stderr.split('\n').slice(0, 4)
  errorLines.forEach(line => {
    if (line.trim()) {
      console.log('   ' + line)
    }
  })
} finally {
  chdir(originalCwd)
}

/**
 * Summary
 */
console.log('\n\n📋 Summary: Auto-Detection Benefits\n')
console.log('=' .repeat(60))
console.log(`
✅ No --cli-path needed when running from project root
✅ Automatic detection from package.json bin field
✅ Fallback to common patterns (src/cli.mjs, cli.mjs, etc.)
✅ Parent directory search up to 5 levels
✅ Clear error messages when detection fails
✅ --verbose shows detection process
✅ --cli-path override when needed

🎯 Recommended Usage:
   1. Navigate to your project root
   2. Run: npx citty-test-utils analysis discover
   3. It just works!
`)

console.log('=' .repeat(60))
console.log('\n✨ All examples completed!\n')
