#!/usr/bin/env node
/**
 * Automated Migration Script: runLocalCitty OLD API → NEW API
 *
 * Migrates:
 *   OLD: runLocalCitty(['args'], { options })
 *   NEW: runLocalCitty({ args: ['args'], ...options })
 *
 * Usage:
 *   node scripts/migrate-runLocalCitty.mjs [file-pattern]
 *   node scripts/migrate-runLocalCitty.mjs test/unit/local-runner.test.mjs
 *   node scripts/migrate-runLocalCitty.mjs "test/**\/*.test.mjs"
 */

import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
}

const c = (color, text) => `${colors[color]}${text}${colors.reset}`

// Get file pattern from command line or use default
const filePattern = process.argv[2] || 'test/**/*.test.mjs'

console.log(c('blue', '\n🔄 runLocalCitty Migration Script'))
console.log(c('blue', '='.repeat(50)))
console.log(`📁 Pattern: ${filePattern}\n`)

// Find all matching files
const files = glob.sync(filePattern, { ignore: 'node_modules/**' })

if (files.length === 0) {
  console.log(c('yellow', `⚠️  No files found matching: ${filePattern}`))
  process.exit(0)
}

console.log(c('blue', `📋 Found ${files.length} files to process\n`))

let totalMigrations = 0
let filesChanged = 0
const report = []

// Process each file
files.forEach(file => {
  let content = readFileSync(file, 'utf8')
  const originalContent = content
  let fileMigrations = 0

  // Pattern 1: runLocalCitty(['args'], { options })
  // Replace with: runLocalCitty({ args: ['args'], ...options })
  const pattern1Regex = /runLocalCitty\(\s*(\[[\s\S]*?\]),\s*\{([^}]*)\}\s*\)/g
  const pattern1Matches = content.match(pattern1Regex)
  if (pattern1Matches) {
    content = content.replace(pattern1Regex, (match, args, options) => {
      fileMigrations++
      const trimmedOptions = options.trim()
      return `runLocalCitty({ args: ${args.trim()}, ${trimmedOptions} })`
    })
  }

  // Pattern 2: runLocalCitty(['args']) with no options
  // Replace with: runLocalCitty({ args: ['args'] })
  const pattern2Regex = /runLocalCitty\(\s*(\[[\s\S]*?\])\s*\)(?!\s*\{)/g
  const pattern2Matches = content.match(pattern2Regex)
  if (pattern2Matches) {
    content = content.replace(pattern2Regex, (match, args) => {
      fileMigrations++
      return `runLocalCitty({ args: ${args.trim()} })`
    })
  }

  // Only write if changes were made
  if (content !== originalContent) {
    writeFileSync(file, content)
    filesChanged++
    totalMigrations += fileMigrations

    console.log(c('green', `✅ ${file}`))
    console.log(`   ${c('yellow', `→ ${fileMigrations} migration(s)`)}\n`)

    report.push({
      file,
      migrations: fileMigrations
    })
  } else {
    console.log(c('blue', `⏭️  ${file} (no changes needed)`))
  }
})

// Print summary
console.log(c('blue', '\n' + '='.repeat(50)))
console.log(c('blue', '📊 Migration Summary'))
console.log(c('blue', '='.repeat(50)))
console.log(`Files processed: ${files.length}`)
console.log(`Files changed: ${c('green', filesChanged)}`)
console.log(`Total migrations: ${c('green', totalMigrations)}`)

if (report.length > 0) {
  console.log(c('blue', '\n📋 Detailed Report:'))
  report
    .sort((a, b) => b.migrations - a.migrations)
    .forEach(({ file, migrations }) => {
      console.log(`  ${file}: ${c('green', migrations)} migration(s)`)
    })
}

console.log(c('blue', '\n🎉 Migration complete!'))
console.log(c('yellow', '\n⚠️  Next steps:'))
console.log('   1. Review changes: git diff')
console.log('   2. Run tests: npm test')
console.log('   3. Commit if all tests pass\n')

// Exit with appropriate code
process.exit(filesChanged > 0 ? 0 : 1)
