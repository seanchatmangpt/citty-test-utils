# citty-test-utils

A comprehensive testing framework for CLI applications built with Citty, featuring Docker cleanroom support, fluent assertions, advanced scenario DSL, and intelligent AST-based analysis.

[![npm version](https://badge.fury.io/js/citty-test-utils.svg)](https://badge.fury.io/js/citty-test-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/citty-test-utils.svg)](https://nodejs.org/)

> **Tested environment**: macOS with Node.js v22.12 and Docker Desktop 28.0.4. All quick-start commands were executed from the repository root.

## ⚡ Quick Start

### Requirements
- Node.js ≥ 18.0.0
- Docker (required for cleanroom testing)

### Install
```bash
npm install citty-test-utils
```

## 💡 Philosophy

### Fail-Fast Behavior
Citty Test Utils follows a strict fail-fast philosophy for reliable testing:

- **No Silent Failures**: Errors are never hidden or suppressed
- **Clear Error Messages**: Every failure includes actionable suggestions
- **Immediate Exit**: Commands exit with code 1 on any error
- **Full Context**: Verbose mode shows complete stack traces and debugging info
- **No Graceful Degradation**: If something fails, you know immediately

**Example Error:**
```bash
$ ctu analysis discover --entry-file ./missing.js
❌ CLI entry file not found: /path/to/missing.js

💡 Tip: Use --entry-file with a valid path:
  $ ctu analyze --entry-file ./path/to/your/cli.js
```

### Flexible CLI Testing
Test **ANY** file as your CLI entry point - no restrictions on file location:

```bash
# Auto-detection (from package.json or common paths)
ctu analysis discover

# Explicit file selection - works with ANY structure
ctu analysis discover --entry-file ./my-cli.js
ctu analysis discover --entry-file ./packages/cli/src/index.mjs
ctu analysis discover --entry-file ./bin/custom-cli.mjs
ctu analysis discover --entry-file ./dist/compiled-cli.js
```

**Supported Entry Points:**
- Any JavaScript file: `.js`, `.mjs`, `.cjs`
- TypeScript files: `.ts`, `.mts`, `.cts`
- Relative or absolute paths
- Anywhere in your project structure
- Monorepo support

**Auto-Detection Strategies:**
1. **package.json bin field** (high confidence)
2. **Common patterns**: `src/cli.mjs`, `cli.mjs`, `bin/cli.mjs`
3. **Parent directory search** (up to 5 levels)
4. **Validated fallback** to `src/cli.mjs`

### Inspect the toolkit CLI
```bash
node src/cli.mjs --show-help
```
Lists nouns such as `test`, `gen`, `runner`, `info`, and `analysis`.

### Drive the bundled playground locally
```javascript
import { runLocalCitty } from 'citty-test-utils'

const help = await runLocalCitty(['--help'], {
  cwd: './playground',
  env: { TEST_CLI: 'true' },
})

help.expectSuccess().expectOutput('USAGE')
console.log(help.result.stdout.split('
')[0])
```
Expected first line: `Test CLI for citty-test-utils (test-cli v1.0.0)`.

### Build a multi-step scenario
```javascript
import { scenario } from 'citty-test-utils'

await scenario('Playground smoke test')
  .step('Show help')
  .run('--help', { cwd: './playground', env: { TEST_CLI: 'true' } })
  .expectSuccess()
  .expectOutput('USAGE')
  .step('Reject invalid command')
  .run('invalid-command', { cwd: './playground', env: { TEST_CLI: 'true' } })
  .expectFailure()
  .execute('local')
```

### Run inside Docker cleanroom
```javascript
import { setupCleanroom, runCitty, teardownCleanroom } from 'citty-test-utils'

await setupCleanroom({ rootDir: './playground' })
const info = await runCitty(['--help'])
info.expectSuccess().expectOutput('USAGE')
console.log(info.result.stdout.split('
')[0])
await teardownCleanroom()
```
CLI shortcut (auto-starts the cleanroom):
```bash
node src/cli.mjs test run --environment cleanroom
```

### Generator commands
```bash
node src/cli.mjs gen project demo-project
node src/cli.mjs gen test help-check
```
Generated files are written to a managed temporary directory (e.g. `~/.cache/tmp/...`). Copy what you need before the cleanup job runs.

### Fast unit-test subset
```bash
npx vitest run test/unit/local-runner.test.mjs test/unit/scenario-dsl.test.mjs --reporter=verbose
```
`npm test` executes the full suite (integration, Docker, snapshot, analysis) and may require snapshot updates and additional resources.

### Analysis commands (✅ Working with --entry-file)
```bash
# Auto-detection (recommended)
node src/cli.mjs analysis discover --verbose
node src/cli.mjs analysis coverage --test-dir test
node src/cli.mjs analysis recommend --priority high

# Explicit file selection (for flexibility)
node src/cli.mjs analysis discover --entry-file ./custom/cli.js
node src/cli.mjs analysis coverage --entry-file ./packages/cli/src/index.mjs
node src/cli.mjs analysis recommend --entry-file ./bin/my-cli.mjs
```
All analysis commands support both auto-detection and explicit `--entry-file` flag.

### Runner commands (✅ Working)
```bash
# Local runner - executes CLI commands locally
node src/cli.mjs runner local "--help"
node src/cli.mjs runner local "gen project test-app"

# Cleanroom runner - executes in Docker container
node src/cli.mjs runner cleanroom "--version"
node src/cli.mjs runner cleanroom "info version"
```
Runner commands now fully implemented with fluent assertions and error handling.

### CLI Auto-Detection with --entry-file

All analysis commands support flexible CLI entry point selection:

```bash
# Auto-detection (recommended) - just run from your project root
npx citty-test-utils analysis discover
npx citty-test-utils analysis coverage
npx citty-test-utils analysis recommend

# Explicit file selection with --entry-file (for custom structures)
npx citty-test-utils analysis discover --entry-file ./my-cli.js
npx citty-test-utils analysis discover --entry-file ./packages/cli/src/index.mjs
npx citty-test-utils analysis discover --entry-file ./bin/custom-cli.mjs

# Legacy --cli-path also supported
npx citty-test-utils analysis discover --cli-path custom/path/cli.mjs
```

**Why Use --entry-file?**
- **Monorepo Support**: Analyze CLIs in packages subdirectory
- **Custom Structure**: Works with any project organization
- **Multiple CLIs**: Test different entry points in same project
- **Dist Files**: Analyze compiled/bundled CLI files

**Detection Strategies (tried in order):**

1. **Explicit --entry-file flag** (Highest priority)
   - Direct path to any CLI file in your project
   - Validates file exists and is JavaScript/TypeScript
   - Works with relative or absolute paths

2. **package.json bin field** (High confidence)
   - Reads your package.json and finds the bin entry
   - Most reliable method for published CLIs

3. **Common file patterns** (Medium confidence)
   - Searches for: `src/cli.mjs`, `cli.mjs`, `bin/cli.mjs`, `index.mjs`
   - Also checks `.js` extensions

4. **Parent directory search** (Medium confidence)
   - Traverses up to 5 parent directories looking for package.json
   - Useful when running from subdirectories

5. **Default with validation** (Low confidence)
   - Falls back to `src/cli.mjs` but validates it exists
   - Shows helpful error message if detection fails

**Verbose Mode:**
```bash
# See the full detection process
npx citty-test-utils analysis discover --verbose
# Output:
# 🔍 Resolving explicit CLI entry: src/cli.mjs
# ✅ Resolved CLI entry: /path/to/src/cli.mjs
# 🔍 Starting CLI structure discovery...
```

**Error Handling (Fail-Fast):**
If file not found, you'll see a clear error with suggestions:
```
❌ CLI entry file not found: /path/to/missing.js

Suggestion: Use --entry-file with a valid path:
  $ ctu analyze --entry-file ./path/to/your/cli.js
```

---

## 🏗️ **Architecture**

citty-test-utils follows a clean, modular architecture with clear separation of concerns:

### Core Components

```
src/
├── core/                    # Core functionality (business logic)
│   ├── runners/             # Test execution engines
│   │   ├── local-runner.js      # Local CLI execution
│   │   └── cleanroom-runner.js  # Docker container execution
│   ├── coverage/            # Coverage analysis tools
│   │   ├── ast-cli-analyzer.js      # AST-based analysis
│   │   ├── cli-coverage-analyzer.js # Coverage computation
│   │   └── discovery/               # Command & test discovery
│   ├── scenarios/           # Test scenario library
│   │   ├── scenario-dsl.js          # Scenario DSL builder
│   │   └── scenarios.js             # Pre-built scenarios
│   ├── assertions/          # Fluent assertion API
│   │   ├── assertions.js            # Assertion methods
│   │   └── snapshot.js              # Snapshot testing
│   ├── utils/               # Shared utilities
│   │   ├── smart-cli-detector.js    # Auto CLI detection
│   │   ├── analysis-report-utils.js # Report generation
│   │   └── context-manager.js       # Execution context
│   └── cache/               # Performance caching
│       └── ast-cache.js             # AST result caching
│
└── commands/                # CLI command layer (thin wrappers)
    ├── runner/              # Runner command wrappers
    │   ├── local.js             # Wraps core/runners/local-runner
    │   └── cleanroom.js         # Wraps core/runners/cleanroom-runner
    ├── analysis/            # Analysis command wrappers
    │   ├── discover.js          # CLI structure discovery
    │   ├── coverage.js          # Coverage analysis
    │   └── recommend.js         # Test recommendations
    ├── test/                # Test execution commands
    ├── gen/                 # Template generation commands
    └── info/                # Information commands
```

### Design Principles

1. **Core vs Commands Separation**
   - `core/`: Pure business logic, testable, reusable
   - `commands/`: Thin CLI wrappers that call core functionality

2. **Shared Utilities**
   - Eliminate code duplication across commands
   - Centralized error handling and validation
   - Consistent reporting and output formatting

3. **Modular Architecture**
   - Each component has a single responsibility
   - Easy to test, maintain, and extend
   - Clear dependencies and interfaces

4. **Performance Optimization**
   - AST caching for faster analysis
   - Lazy loading of heavy dependencies
   - Efficient command detection strategies

---

## 🧪 **Core Testing Framework**

citty-test-utils provides a complete testing ecosystem for CLI applications with three powerful execution environments:

### **🏃 Local Runner**
Execute CLI commands locally with full control over environment and working directory.

```javascript
import { runLocalCitty } from 'citty-test-utils'

const result = await runLocalCitty(['--help'], {
  cwd: './my-cli-project',
  env: { DEBUG: 'true' },
  timeout: 30000
})

result
  .expectSuccess()
  .expectOutput('USAGE')
  .expectNoStderr()
```

### **🐳 Cleanroom Runner** 
Execute commands in isolated Docker containers for consistent, reproducible testing.

```javascript
import { setupCleanroom, runCitty, teardownCleanroom } from 'citty-test-utils'

await setupCleanroom({ rootDir: './my-cli-project' })

const result = await runCitty(['--version'])
result.expectSuccess().expectOutput(/\d+\.\d+\.\d+/)

await teardownCleanroom()
```

### **🔗 Fluent Assertions**
Chainable expectation API with detailed error messages and comprehensive validation.

```javascript
result
  .expectSuccess()                    // expectExit(0)
  .expectFailure()                   // Expect non-zero exit code
  .expectExit(0)                     // Check specific exit code
  .expectOutput('Usage:')            // String match
  .expectOutput(/playground/)        // Regex match
  .expectOutputContains('commands')  // Contains text
  .expectNoStderr()                  // Expect empty stderr
  .expectOutputLength(10, 100)      // Check output length range
  .expectJson(data => {              // JSON validation
    expect(data.version).toBeDefined()
  })
```

### **📋 Scenario DSL**
Build complex multi-step test workflows with step-by-step execution and custom actions.

```javascript
import { scenario } from 'citty-test-utils'

const result = await scenario('Complete workflow')
  .step('Get help')
  .run('--help')
  .expectSuccess()
  .expectOutput('USAGE')
  .step('Get version')
  .run('--version')
  .expectSuccess()
  .expectOutput(/\d+\.\d+\.\d+/)
  .step('Test invalid command')
  .run('invalid-command')
  .expectFailure()
  .expectStderr(/Unknown command/)
  .execute('local')  // or 'cleanroom'
```

### **🎯 Pre-built Scenarios**
Ready-to-use testing patterns for common CLI scenarios.

```javascript
import { scenarios } from 'citty-test-utils'

// Basic scenarios
await scenarios.help('local').execute()
await scenarios.version('cleanroom').execute()
await scenarios.invalidCommand('nope', 'local').execute()

// JSON output testing
await scenarios.jsonOutput(['greet', 'Alice', '--json'], 'local').execute()

// Robustness testing
await scenarios.idempotent(['greet', 'Alice'], 'local').execute()
await scenarios.concurrent([
  { args: ['--help'] },
  { args: ['--version'] },
  { args: ['greet', 'Test'] }
], 'cleanroom').execute()
```

## 🚀 **What's New in v0.6.0**

### Major Feature Additions
- **🎯 Flexible CLI Entry**: New `--entry-file` flag for testing ANY CLI file in your project
- **⚡ Fail-Fast Philosophy**: Strict error handling with clear, actionable messages
- **🧪 Scenario Testing**: CLI commands for executing pre-built test scenarios
- **❌ Error Testing**: CLI commands for validating error handling and edge cases
- **🔧 Top-Level Error Handlers**: Graceful handling of unhandled rejections and exceptions

### Enhanced Analysis
- **📁 Multi-Entry Support**: Analyze any CLI file with `--entry-file ./path/to/cli.js`
- **🔍 Smart Detection**: Auto-detects CLI from package.json or common patterns
- **🎨 Flexible Paths**: Support for monorepos, custom structures, and any file location
- **📊 Improved Validation**: Better error messages and fail-fast on invalid paths

### Previous Features (v0.5.1)
- **✅ Working Runner Commands**: Full implementation of `runner local` and `runner cleanroom` commands
- **🏗️ Modular Architecture**: Clean separation between core runners and CLI commands
- **🧠 AST-Based Analysis**: Revolutionary AST-first CLI coverage analysis
- **🎯 Smart Recommendations**: AI-powered test improvement suggestions
- **⚡ Performance Optimization**: Parallel processing and AST caching

## 🚀 **Quick Start**

### **Installation**
```bash
npm install citty-test-utils
```

### **Basic Testing**
```javascript
import { runLocalCitty } from 'citty-test-utils'

// Test your CLI locally
const result = await runLocalCitty(['--help'], {
  cwd: './my-cli-project'
})

result
  .expectSuccess()
  .expectOutput('USAGE')
  .expectNoStderr()
```

### **Cross-Environment Testing**
```javascript
import { setupCleanroom, runCitty, teardownCleanroom } from 'citty-test-utils'

// Test in isolated Docker environment
await setupCleanroom({ rootDir: './my-cli-project' })

const localResult = await runLocalCitty(['--version'])
const cleanroomResult = await runCitty(['--version'])

// Verify consistency across environments
expect(localResult.result.stdout).toBe(cleanroomResult.result.stdout)

await teardownCleanroom()
```

### **Complex Workflows**
```javascript
import { scenario } from 'citty-test-utils'

const result = await scenario('User Registration Flow')
  .step('Initialize project')
  .run('init', 'my-project')
  .expectSuccess()
  .step('Verify status')
  .run('status')
  .expectSuccess()
  .expectOutput(/project.*initialized/)
  .step('Test error handling')
  .run('invalid-command')
  .expectFailure()
  .execute('local')
```

## 🛠️ **Built-in CLI Tools**

The framework includes powerful CLI tools for analysis and generation (secondary to the core testing utilities):

```bash
# AST-based CLI analysis (Auto-detection or --entry-file)
npx citty-test-utils analysis discover
npx citty-test-utils analysis discover --entry-file src/cli.mjs
npx citty-test-utils analysis coverage --test-dir test --threshold 80
npx citty-test-utils analysis recommend --priority high --entry-file ./my-cli.js

# Runner commands (Fully implemented)
npx citty-test-utils runner local "--help"
npx citty-test-utils runner cleanroom "--version"
npx citty-test-utils runner execute --command "node --version"

# Template generation
npx citty-test-utils gen project my-cli
npx citty-test-utils gen test my-feature --test-type cleanroom

# Test execution
npx citty-test-utils test run --environment local
npx citty-test-utils test scenario --name "user-workflow"
```

## 🎯 **Core Features**

### **Testing Framework**
- **🏃 Local Runner**: Execute CLI commands locally with timeout and environment support
- **🐳 Docker Cleanroom**: Isolated testing in Docker containers using testcontainers
- **🔗 Fluent Assertions**: Chainable expectation API with detailed error messages
- **📋 Scenario DSL**: Complex multi-step test workflows with retry mechanisms
- **🛠️ Test Utilities**: Wait conditions, retry logic, temporary files, and more
- **📦 Pre-built Scenarios**: Ready-to-use test templates for common workflows
- **🎯 Scenarios Pack**: Common CLI testing patterns with simple API
- **⚡ TypeScript Support**: Complete type definitions for all APIs
- **🔄 Cross-Environment**: Test consistency between local and cleanroom environments

### **Analysis & Intelligence**
- **🧠 AST-Based Analysis**: Revolutionary AST-first CLI coverage analysis
- **🎯 Smart Recommendations**: AI-powered test improvement suggestions
- **📊 Multi-Dimensional Coverage**: Commands, subcommands, flags, and options
- **🔍 CLI Discovery**: Automatic CLI structure discovery via AST parsing
- **📈 Coverage Trends**: Historical coverage tracking and analysis
- **⚡ Performance Optimization**: Parallel processing and AST caching

### **Developer Tools**
- **🎯 Noun-Verb CLI**: Complete CLI with `ctu <noun> <verb>` structure
- **📝 Template Generation**: Generate tests, scenarios, CLIs, and projects
- **🔧 Custom Runner**: Execute external commands with isolation
- **📊 Info System**: Get version, features, and configuration info
- **🧪 Test Commands**: Run scenarios and test CLI functionality
- **🎮 Playground Project**: Complete example implementation with comprehensive tests
- **📸 Snapshot Testing**: Comprehensive snapshot coverage for all CLI outputs

## 📚 **Testing API Reference**

### **Local Runner**
Execute CLI commands locally with full environment control.

```javascript
import { runLocalCitty } from 'citty-test-utils'

const result = await runLocalCitty(['--help'], {
  cwd: './my-cli-project',    // Working directory for CLI execution
  json: false,                // Parse stdout as JSON
  timeout: 30000,             // Timeout in milliseconds
  env: {                      // Environment variables
    DEBUG: 'true',
    NODE_ENV: 'test'
  }
})

// Fluent assertions
result
  .expectSuccess()                    // Shorthand for expectExit(0)
  .expectOutput('USAGE')              // String match
  .expectOutput(/my-cli/i)             // Regex match (case-insensitive)
  .expectNoStderr()                    // Expect empty stderr
  .expectOutputLength(100, 5000)       // Length range validation
```

### **Cleanroom Runner**
Execute commands in isolated Docker containers for consistent testing.

```javascript
import { setupCleanroom, runCitty, teardownCleanroom } from 'citty-test-utils'

// Setup (run once per test suite)
await setupCleanroom({ 
  rootDir: './my-cli-project',        // Directory to copy into container
  nodeImage: 'node:20-alpine',        // Docker image to use
  timeout: 60000                      // Container startup timeout
})

// Run commands in cleanroom
const result = await runCitty(['--help'], {
  json: false,    // Parse stdout as JSON
  cwd: '/app',    // Working directory in container
  timeout: 30000, // Timeout in milliseconds
  env: {          // Environment variables
    DEBUG: 'true'
  }
})

// Cleanup (run once per test suite)
await teardownCleanroom()
```

### **Fluent Assertions**
Comprehensive chainable expectation API with detailed error messages and context.

```javascript
const result = await runLocalCitty(['--help'])

result
  .expectSuccess()                    // expectExit(0)
  .expectFailure()                   // Expect non-zero exit code
  .expectExit(0)                     // Check specific exit code
  .expectExitCodeIn([0, 1, 2])       // Check exit code is in array
  .expectOutput('Usage:')            // String match
  .expectOutput(/my-cli/)            // Regex match
  .expectOutputContains('commands')  // Contains text
  .expectOutputNotContains('error')  // Does not contain text
  .expectStderr('')                  // Check stderr
  .expectNoOutput()                  // Expect empty stdout
  .expectNoStderr()                  // Expect empty stderr
  .expectOutputLength(10, 100)       // Check output length range
  .expectStderrLength(0, 50)         // Check stderr length range
  .expectDuration(5000)              // Check execution time
  .expectJson(data => {              // JSON validation
    expect(data.version).toBeDefined()
    expect(data.commands).toBeArray()
  })
```

### **Scenario DSL**
Build complex multi-step test workflows with step-by-step execution and custom actions.

```javascript
import { scenario, scenarios, cleanroomScenario, localScenario } from 'citty-test-utils'

// Basic scenario with multiple steps
const result = await scenario('Complete workflow')
  .step('Get help')
  .run('--help')
  .expectSuccess()
  .expectOutput('USAGE')
  .step('Get version')
  .run(['--version'])
  .expectSuccess()
  .expectOutput(/\d+\.\d+\.\d+/)
  .step('Test invalid command')
  .run('invalid-command')
  .expectFailure()
  .expectStderr(/Unknown command/)
  .execute('local')  // or 'cleanroom'

// Pre-built scenarios
await scenarios.help('local').execute()
await scenarios.version('local').execute()
await scenarios.invalidCommand('nonexistent', 'local').execute()
await scenarios.jsonOutput(['greet', 'Alice', '--json'], 'local').execute()
await scenarios.subcommand('math', ['add', '5', '3'], 'local').execute()

// Environment-specific scenarios
await cleanroomScenario('Cleanroom test')
  .step('Test help')
  .run('--help')
  .expectSuccess()
  .execute()

await localScenario('Local test')
  .step('Test greet command')
  .run(['greet', 'Alice'], { env: { DEBUG: 'true' } })
  .expectSuccess()
  .execute()
```

### **Test Utilities**
Utility functions for common testing patterns, edge cases, and advanced scenarios.

```javascript
import { testUtils } from 'citty-test-utils'

// Wait for conditions with timeout
await testUtils.waitFor(
  () => checkCondition(), 
  5000,    // timeout
  100      // interval
)

// Retry with exponential backoff
await testUtils.retry(
  () => flakyOperation(), 
  3,       // max attempts
  1000     // delay between attempts
)

// Temporary files for testing
const tempFile = await testUtils.createTempFile('test content', '.txt')
await testUtils.cleanupTempFiles([tempFile])

// Snapshot testing
import { matchSnapshot } from 'citty-test-utils'
const result = await runLocalCitty(['--help'])
await matchSnapshot(result.stdout, 'help-output')
```

## 🧪 **Testing Patterns**

### **Unit Tests**
```javascript
import { describe, it } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'

describe('CLI Commands', () => {
  it('should show help', async () => {
    const result = await runLocalCitty(['--help'])
    result.expectSuccess().expectOutput('USAGE')
  })
})
```

### **Integration Tests**
```javascript
import { scenario } from 'citty-test-utils'

const result = await scenario('Integration Test')
  .step('Setup')
  .run('init', 'test-project')
  .expectSuccess()
  .step('Verify')
  .run('status')
  .expectSuccess()
  .execute('local')
```

### **E2E Tests**
```javascript
import { setupCleanroom, runCitty, teardownCleanroom } from 'citty-test-utils'

await setupCleanroom({ rootDir: '.' })

const result = await runCitty(['--help'])
result.expectSuccess().expectOutput('USAGE')

await teardownCleanroom()
```

## 🛠️ **CLI Analysis Tools**

The framework includes powerful CLI tools for analysis and generation (secondary to the core testing utilities):

### **AST-Based Analysis**
```bash
# Discover CLI structure using AST parsing
npx citty-test-utils analysis discover --cli-path src/cli.mjs --format json

# Analyze test coverage with AST-based accuracy
npx citty-test-utils analysis coverage --test-dir test --threshold 80

# Get smart recommendations for improving test coverage
npx citty-test-utils analysis recommend --priority high --actionable
```

### **Template Generation**
```bash
# Generate complete project structure
npx citty-test-utils gen project my-cli --description "My CLI"

# Generate test file templates
npx citty-test-utils gen test my-feature --test-type cleanroom

# Generate scenario templates
npx citty-test-utils gen scenario user-workflow --environment local
```

### **Test Execution**
```bash
# Run test scenarios
npx citty-test-utils test run --environment local

# Execute custom scenarios
npx citty-test-utils test scenario --name "user-workflow"

# Test specific CLI functionality
npx citty-test-utils test help --environment cleanroom
```

## 📚 **Complete Example**

Here's a comprehensive example showing the full testing framework in action:

```javascript
import { 
  runLocalCitty, 
  setupCleanroom, 
  runCitty, 
  teardownCleanroom,
  scenario,
  scenarios,
  testUtils
} from 'citty-test-utils'

async function testMyCLI() {
  // Test local runner
  const localResult = await runLocalCitty(['--help'], {
    cwd: './my-cli-project',
    env: { DEBUG: 'true' }
  })
  localResult
    .expectSuccess()
    .expectOutput('USAGE')
    .expectOutput(/my-cli/)
    .expectNoStderr()

  // Test scenario
  const scenarioResult = await scenario('Complete workflow')
    .step('Get help')
    .run('--help')
    .expectSuccess()
    .expectOutput('USAGE')
    .step('Get version')
    .run('--version')
    .expectSuccess()
    .expectOutput(/\d+\.\d+\.\d+/)
    .step('Test invalid command')
    .run('invalid-command')
    .expectFailure()
    .expectStderr(/Unknown command/)
    .execute('local')
  
  console.log('Scenario success:', scenarioResult.success)

  // Test pre-built scenarios
  const helpResult = await scenarios.help('local').execute()
  const versionResult = await scenarios.version('local').execute()
  
  console.log('Help success:', helpResult.success)
  console.log('Version success:', versionResult.success)

  // Test flaky operations with retry
  await testUtils.retry(async () => {
    const result = await runLocalCitty(['--help'], {
      cwd: './my-cli-project',
      env: { DEBUG: 'true' }
    })
    result.expectSuccess()
  }, 3, 1000)
}

// For Vitest users
import { describe, it, beforeAll, afterAll } from 'vitest'

describe('My CLI Tests', () => {
  beforeAll(async () => {
    await setupCleanroom({ rootDir: './my-cli-project' })
  })

  afterAll(async () => {
    await teardownCleanroom()
  })

  it('should work locally', async () => {
    const result = await runLocalCitty(['--help'], {
      cwd: './my-cli-project',
      env: { DEBUG: 'true' }
    })
    result
      .expectSuccess()
      .expectOutput('USAGE')
      .expectOutput(/my-cli/)
      .expectNoStderr()
  })

  it('should work in cleanroom', async () => {
    const result = await runCitty(['--help'], {
      env: { DEBUG: 'true' }
    })
    result
      .expectSuccess()
      .expectOutput('USAGE')
      .expectOutput(/my-cli/)
      .expectNoStderr()
  })

  it('should handle complex workflow', async () => {
    const result = await scenario('Complete workflow')
      .step('Get help')
      .run('--help')
      .expectSuccess()
      .expectOutput('USAGE')
      .step('Get version')
      .run('--version')
      .expectSuccess()
      .expectOutput(/\d+\.\d+\.\d+/)
      .step('Test invalid command')
      .run('invalid-command')
      .expectFailure()
      .expectStderr(/Unknown command/)
      .execute('local')
    
    expect(result.success).toBe(true)
  })

  it('should use pre-built scenarios', async () => {
    const helpResult = await scenarios.help('local').execute()
    const versionResult = await scenarios.version('local').execute()
    
    expect(helpResult.success).toBe(true)
    expect(versionResult.success).toBe(true)
  })

  it('should handle flaky operations', async () => {
    await testUtils.retry(async () => {
      const result = await runLocalCitty(['--help'], {
        cwd: './my-cli-project',
        env: { DEBUG: 'true' }
      })
      result.expectSuccess()
    }, 3, 1000)
  })
})
```

## 🔧 **Advanced Testing Features**

### **Cross-Environment Testing**
Test consistency between local and cleanroom environments:

```javascript
const localResult = await runLocalCitty(['--version'], {
  cwd: './my-cli-project',
  env: { DEBUG: 'true' }
})
const cleanroomResult = await runCitty(['--version'], {
  env: { DEBUG: 'true' }
})

expect(localResult.result.stdout).toBe(cleanroomResult.result.stdout)
```

### **Custom Actions in Scenarios**
Execute custom logic within scenarios:

```javascript
const result = await scenario('Custom workflow')
  .step('Custom action', async ({ lastResult, context }) => {
    // Custom logic here
    return { success: true, data: 'processed' }
  })
  .step('Run command')
  .run('--help')
  .expectSuccess()
  .execute()
```

### **Environment-Specific Configuration**
```javascript
// Local development with custom environment
const result = await runLocalCitty(['greet', 'Alice'], {
  cwd: './my-cli-project',
  env: {
    DEBUG: 'true',
    NODE_ENV: 'test'
  },
  timeout: 60000
})

// Cleanroom with specific Docker image
await setupCleanroom({ 
  rootDir: './my-cli-project',
  nodeImage: 'node:18-alpine'
})
```

### **Error Handling**
The framework provides detailed error messages with full context:

```
Expected exit code 0, got 1
Command: node src/cli.mjs --help
Working directory: /app
Stdout: 
Stderr: Error: Command not found
```

## 📋 **Requirements**

- **Node.js**: >= 18.0.0
- **Docker**: Required for cleanroom testing
- **Citty Project**: Required for CLI testing

## 🚀 **Project Setup**

To use `citty-test-utils` with your CLI project:

1. **Install citty-test-utils**: `npm install citty-test-utils`
2. **Create test files**: Use the testing framework in your test suite
3. **Run tests**: Execute your tests with the framework

```bash
# Example project structure
my-citty-project/
├── src/
│   └── cli.mjs          # Citty CLI
├── package.json         # Contains citty dependency
└── tests/
    └── my-tests.mjs     # Your tests using citty-test-utils
```

## 🎮 **Playground Project**

The included playground project (`./playground/`) serves as a complete example:

- **Full Citty CLI**: Demonstrates commands, subcommands, and options
- **Comprehensive Tests**: Unit, integration, and scenario tests
- **All Features**: Shows every aspect of `citty-test-utils`
- **Best Practices**: Demonstrates proper usage patterns

```bash
# Run playground tests
cd playground
npm install
npm test

# Run playground CLI
npm start
```

## 📚 **Documentation**

- **[Getting Started Guide](docs/guides/getting-started.md)** - Quick start and basic usage
- **[API Reference](docs/api/README.md)** - Complete API documentation
- **[Cleanroom TDD Guide](docs/guides/cleanroom-tdd-guide.md)** - Advanced testing patterns
- **[Best Practices](docs/guides/best-practices.md)** - Recommended testing patterns
- **[Troubleshooting](docs/guides/troubleshooting.md)** - Common issues and solutions

## ⚡ **TypeScript Support**

Full TypeScript definitions are included:

```typescript
import type { 
  CliResult, 
  CliExpectation, 
  RunOptions, 
  ScenarioBuilder,
  ScenarioResult 
} from 'citty-test-utils'

const result: CliResult = await runLocalCitty(['--help'])
const expectation: CliExpectation = result.expectExit(0)
const scenario: ScenarioBuilder = scenario('My Test')
```

## 🧪 **Testing Configuration**

The package includes comprehensive test configuration with Vitest:

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:bdd

# Run with coverage
npm run test:coverage

# Interactive UI
npm run test:ui
```

## 🤝 **Contributing**

Contributions are welcome! Please see the project repository for contribution guidelines.

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

## 📝 **Changelog**

See [CHANGELOG.md](CHANGELOG.md) for version history and changes.