# Getting Started with citty-test-utils

A comprehensive guide to getting started with the `citty-test-utils` testing framework.

## Table of Contents

- [Installation](#installation)
- [Project Setup](#project-setup)
- [First Test](#first-test)
- [Understanding the Testing Framework](#understanding-the-testing-framework)
- [Next Steps](#next-steps)

## Installation

### Prerequisites

Before installing `citty-test-utils`, ensure you have:

- **Node.js** >= 18.0.0
- **Citty Project** - A project with Citty CLI installed
- **Docker** (optional) - For cleanroom testing

### Install the Package

```bash
npm install citty-test-utils
```

### Verify Installation

Create a simple test to verify the installation:

```javascript
// test-installation.mjs
import { runLocalCitty } from 'citty-test-utils'

async function testInstallation() {
  try {
    const result = await runLocalCitty(['--help'], {
      cwd: './my-cli-project'  // Point to your CLI project
    })
    console.log('✅ Installation successful!')
    console.log('Exit code:', result.result.exitCode)
    console.log('Output length:', result.result.stdout.length)
  } catch (error) {
    console.error('❌ Installation failed:', error.message)
  }
}

testInstallation()
```

Run the test:

```bash
node test-installation.mjs
```

## Project Setup

### Citty Project Structure

`citty-test-utils` works with any Citty-based CLI project that has this structure:

```
my-citty-project/
├── src/
│   └── cli.mjs          # Citty CLI entry point
├── package.json         # Contains citty dependency
├── tests/               # Your test files
│   └── cli-tests.mjs
└── node_modules/
    └── citty-test-utils/
```

### Verify Your CLI

Ensure your Citty CLI is working:

```bash
node src/cli.mjs --help
```

You should see output like:

```
My CLI - Description of your CLI (my-cli v1.0.0)

USAGE my-cli <command> [options]
...
```

### Package.json Configuration

Your `package.json` should contain:

```json
{
  "name": "my-cli",
  "type": "module",
  "scripts": {
    "test": "vitest",
    "test:cli": "vitest tests/cli-tests.mjs"
  },
  "dependencies": {
    "citty": "^1.0.0"
  },
  "devDependencies": {
    "citty-test-utils": "^0.5.0",
    "vitest": "^1.0.0"
  }
}
```

## First Test

### Basic Local Test

Create your first test file:

```javascript
// tests/first-test.mjs
import { runLocalCitty } from 'citty-test-utils'

async function testHelpCommand() {
  console.log('🧪 Testing help command...')
  
  const result = await runLocalCitty(['--help'], {
    cwd: './my-cli-project'  // Point to your CLI project
  })
  
  // Use fluent assertions
  result
    .expectSuccess()           // Expect exit code 0
    .expectOutput('USAGE')    // Expect 'USAGE' in output
    .expectNoStderr()         // Expect no error output
  
  console.log('✅ Help command test passed!')
}

testHelpCommand().catch(console.error)
```

Run the test:

```bash
node tests/first-test.mjs
```

### Using Vitest

For a more structured testing approach, use Vitest:

```javascript
// tests/cli-tests.mjs
import { describe, it } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'

describe('My CLI Tests', () => {
  it('should show help', async () => {
    const result = await runLocalCitty(['--help'], {
      cwd: './my-cli-project'
    })
    
    result
      .expectSuccess()
      .expectOutput('USAGE')
      .expectNoStderr()
  })
  
  it('should show version', async () => {
    const result = await runLocalCitty(['--version'], {
      cwd: './my-cli-project'
    })
    
    result
      .expectSuccess()
      .expectOutput(/\d+\.\d+\.\d+/)  // Regex for version pattern
  })
})
```

Run with Vitest:

```bash
npm run test:cli
```

## Understanding the Testing Framework

### How Local Runner Works

The local runner (`runLocalCitty`) provides:

1. **Flexible Execution**: Run CLI commands with full environment control
2. **Working Directory Control**: Specify custom working directories
3. **Environment Variables**: Pass custom environment variables
4. **Timeout Management**: Configure execution timeouts
5. **Fluent Assertions**: Chainable expectation API

### Fluent Assertions

The fluent assertion API allows chaining expectations:

```javascript
const result = await runLocalCitty(['--help'], {
  cwd: './my-cli-project'
})

result
  .expectSuccess()                    // Exit code 0
  .expectOutput('USAGE')              // String match
  .expectOutput(/my-cli/)             // Regex match
  .expectNoStderr()                   // Empty stderr
  .expectOutputLength(100, 5000)      // Length range
```

### Error Messages

When assertions fail, you get detailed error messages:

```
Expected stdout to match USAGE, got: 
Command: node src/cli.mjs --help
Working directory: /path/to/project
Stdout: 
Stderr: Error: Command not found
```

### Working Directory Control

You can specify custom working directories:

```javascript
const result = await runLocalCitty(['--help'], {
  cwd: '/custom/path/to/cli-project'
})
```

### Environment Variables

Test with custom environment:

```javascript
const result = await runLocalCitty(['dev'], {
  cwd: './my-cli-project',
  env: {
    NODE_ENV: 'development',
    DEBUG: 'true'
  },
  timeout: 60000  // 60 second timeout
})
```

## Next Steps

### 1. Explore More Assertions

Try different assertion methods:

```javascript
const result = await runLocalCitty(['--version'], {
  cwd: './my-cli-project'
})

result
  .expectSuccess()
  .expectOutput(/\d+\.\d+\.\d+/)      // Version pattern
  .expectOutputLength(1, 20)          // Short output
  .expectDuration(1000)               // Fast execution
```

### 2. Test Error Cases

Test how your CLI handles invalid commands:

```javascript
const result = await runLocalCitty(['invalid-command'], {
  cwd: './my-cli-project'
})

result
  .expectFailure()                    // Non-zero exit code
  .expectStderr(/Unknown command/)     // Error message
  .expectNoOutput()                   // No stdout
```

### 3. Use Environment Variables

Test with custom environment:

```javascript
const result = await runLocalCitty(['dev'], {
  cwd: './my-cli-project',
  env: {
    NODE_ENV: 'development',
    DEBUG: 'true'
  },
  timeout: 60000  // 60 second timeout
})
```

### 4. Try Cleanroom Testing

Test in isolated Docker containers:

```javascript
import { setupCleanroom, runCitty, teardownCleanroom } from 'citty-test-utils'

// Setup (run once per test suite)
await setupCleanroom({ rootDir: './my-cli-project' })

// Run tests in cleanroom
const result = await runCitty(['--help'])
result.expectSuccess().expectOutput('USAGE')

// Cleanup
await teardownCleanroom()
```

### 5. Explore Scenarios

Use the scenario DSL for complex workflows:

```javascript
import { scenario } from 'citty-test-utils'

const result = await scenario('Help and Version')
  .step('Get help')
  .run('--help', { cwd: './my-cli-project' })
  .expectSuccess()
  .expectOutput('USAGE')
  .step('Get version')
  .run('--version', { cwd: './my-cli-project' })
  .expectSuccess()
  .expectOutput(/\d+\.\d+\.\d+/)
  .execute('local')
```

### 6. Use Pre-built Scenarios

Leverage ready-to-use testing patterns (requires explicit cwd):

```javascript
import { scenarios, runLocalCitty } from 'citty-test-utils'

// Basic scenarios with explicit cwd
const helpScenario = scenarios.help('local')
helpScenario.execute = async function() {
  const r = await runLocalCitty(['--help'], { cwd: './my-cli-project', env: { TEST_CLI: 'true' } })
  r.expectSuccess().expectOutput(/USAGE|COMMANDS/i)
  return { success: true, result: r.result }
}
await helpScenario.execute()

// Version scenario
const versionScenario = scenarios.version('local')
versionScenario.execute = async function() {
  const r = await runLocalCitty(['--version'], { cwd: './my-cli-project', env: { TEST_CLI: 'true' } })
  r.expectSuccess().expectOutput(/\d+\.\d+\.\d+/)
  return { success: true, result: r.result }
}
await versionScenario.execute()

// Invalid command scenario
const invalidScenario = scenarios.invalidCommand('nope', 'local')
invalidScenario.execute = async function() {
  const r = await runLocalCitty(['nope'], { cwd: './my-cli-project', env: { TEST_CLI: 'true' } })
  if (r.result.exitCode === 0) throw new Error('Expected failure but command succeeded')
  const out = r.result.stdout + r.result.stderr
  if (!/unknown|invalid|not found|error/i.test(out)) throw new Error(`Unexpected error text: ${out}`)
  return { success: true }
}
await invalidScenario.execute()
```

## Common Issues

### CLI Not Found

**Error:** `CLI not found at /path/to/src/cli.mjs`

**Solution:** Ensure you're pointing to the correct CLI project directory with `cwd` option

### Project Detection Failed

**Error:** Runner can't find CLI project

**Solution:** Check that you're specifying the correct `cwd` path to your CLI project

### Docker Not Available

**Error:** `Docker is not available`

**Solution:** Install Docker and ensure it's running for cleanroom tests

### Command Timeout

**Error:** `Command timed out after 30000ms`

**Solution:** Increase timeout or optimize your command:

```javascript
const result = await runLocalCitty(['long-running-command'], {
  cwd: './my-cli-project',
  timeout: 120000  // 2 minutes
})
```

### Working Directory Issues

**Error:** Command fails with path-related errors

**Solution:** Ensure the `cwd` points to your CLI project root:

```javascript
const result = await runLocalCitty(['--help'], {
  cwd: './my-cli-project'  // Should contain src/cli.mjs
})
```

## What's Next?

- [API Reference](../api/README.md) - Complete API documentation
- [Cookbooks](../cookbooks/README.md) - Common use case patterns
- [Advanced Examples](../examples/README.md) - Complex testing scenarios
- [Troubleshooting Guide](../guides/troubleshooting.md) - Common issues and solutions
