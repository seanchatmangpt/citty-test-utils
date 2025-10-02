# Unified Runner Usage Examples

Quick reference guide for common `runCitty()` usage patterns.

## Basic Usage

### Simple Help Command
```javascript
import { runCitty } from 'citty-test-utils'

const result = await runCitty(['--help'])
console.log(result.stdout)
```

### With Fluent Assertions
```javascript
const result = await runCitty(['--help'])
result
  .expectSuccess()
  .expectOutput('Usage:')
  .expectExit(0)
```

## Configuration Examples

### Override CLI Path
```javascript
const result = await runCitty(['test'], {
  cliPath: './dist/cli.js'
})
```

### Set Working Directory
```javascript
const result = await runCitty(['build'], {
  cwd: './packages/my-app'
})
```

### Add Environment Variables
```javascript
const result = await runCitty(['deploy'], {
  env: {
    NODE_ENV: 'production',
    DEBUG: '1'
  }
})
```

### Set Timeout
```javascript
const result = await runCitty(['long-running-task'], {
  timeout: 60000 // 60 seconds
})
```

## Mode Detection

### Force Local Mode
```javascript
const result = await runCitty(['test'], {
  mode: 'local'
})
```

### Force Cleanroom Mode
```javascript
const result = await runCitty(['test'], {
  cleanroom: { enabled: true }
})
```

### Auto-Detect from Config
```javascript
// Uses vitest.config citty settings
const result = await runCitty(['test'])
```

## Cleanroom Configuration

### Basic Cleanroom
```javascript
const result = await runCitty(['test'], {
  cleanroom: {
    enabled: true
  }
})
```

### Custom Docker Image
```javascript
const result = await runCitty(['test'], {
  cleanroom: {
    enabled: true,
    nodeImage: 'node:18-alpine'
  }
})
```

### Resource Limits
```javascript
const result = await runCitty(['test'], {
  cleanroom: {
    enabled: true,
    memoryLimit: '1g',
    cpuLimit: '2.0'
  }
})
```

### Custom Root Directory
```javascript
const result = await runCitty(['test'], {
  cleanroom: {
    enabled: true,
    rootDir: './my-project'
  }
})
```

## Assertions

### Exit Code
```javascript
const result = await runCitty(['test'])
result.expectExit(0)
```

### Success/Failure
```javascript
// Success
result.expectSuccess()

// Failure
result.expectFailure()
```

### Output Matching
```javascript
// String contains
result.expectOutput('test passed')

// Regex match
result.expectOutput(/tests?: \d+ passed/)
```

### Stderr Checking
```javascript
result.expectStderr('warning:')
```

### Performance
```javascript
result.expectDuration(1000) // Max 1 second
```

### JSON Output
```javascript
const result = await runCitty(['status', '--json'])
result.expectJson(json => {
  expect(json.status).toBe('ready')
})
```

### Chaining
```javascript
result
  .expectSuccess()
  .expectOutput('Build completed')
  .expectDuration(5000)
```

## Error Handling

### Safe Execution
```javascript
const result = await runCittySafe(['invalid-command'])
if (result.exitCode !== 0) {
  console.log('Command failed:', result.stderr)
}
```

### Error Assertions
```javascript
const result = await runCittySafe(['invalid'])
result
  .expectFailure()
  .expectStderr('Unknown command')
  .expectExit(1)
```

## Configuration Debugging

### Inspect Config
```javascript
import { getCittyConfig } from 'citty-test-utils'

const config = await getCittyConfig()
console.log('CLI Path:', config.cliPath)
console.log('Mode:', config.detectedMode)
console.log('Cleanroom:', config.cleanroom)
```

### Override and Inspect
```javascript
const config = await getCittyConfig({
  cliPath: './custom-cli.js',
  timeout: 5000
})
console.log('Final config:', config)
```

## Test Patterns

### Simple Test
```javascript
import { describe, it } from 'vitest'
import { runCitty } from 'citty-test-utils'

describe('CLI', () => {
  it('should show help', async () => {
    const result = await runCitty(['--help'])
    result.expectSuccess().expectOutput('Usage:')
  })
})
```

### Error Case Test
```javascript
it('should handle invalid command', async () => {
  const result = await runCittySafe(['invalid'])
  result
    .expectFailure()
    .expectStderr('Unknown command: invalid')
})
```

### Multiple Commands
```javascript
it('should run multiple commands', async () => {
  const help = await runCitty(['--help'])
  const version = await runCitty(['--version'])

  help.expectSuccess()
  version.expectSuccess()
})
```

### With Setup/Teardown
```javascript
import { afterAll } from 'vitest'
import { teardownCleanroom } from 'citty-test-utils'

afterAll(async () => {
  await teardownCleanroom()
})

it('should run in cleanroom', async () => {
  const result = await runCitty(['test'], {
    cleanroom: { enabled: true }
  })
  result.expectSuccess()
})
```

## Vitest Config Integration

### Basic Config
```javascript
// vitest.config.js
export default defineConfig({
  test: {
    env: {
      TEST_CLI_PATH: './src/cli.mjs',
      TEST_CWD: process.cwd()
    }
  }
})
```

### With Citty Section
```javascript
// vitest.config.js
export default defineConfig({
  test: {
    env: {
      TEST_CLI_PATH: './src/cli.mjs'
    }
  },
  citty: {
    cliPath: './src/cli.mjs',
    timeout: 10000,
    cleanroom: {
      enabled: false,
      nodeImage: 'node:20-alpine'
    }
  }
})
```

### Override in Test
```javascript
// Config sets local mode, but test can override
const result = await runCitty(['test'], {
  cleanroom: { enabled: true } // Override config
})
```

## Advanced Patterns

### Conditional Mode
```javascript
const isCI = process.env.CI === 'true'
const result = await runCitty(['test'], {
  cleanroom: { enabled: isCI }
})
```

### Dynamic CLI Path
```javascript
const cliPath = process.env.CLI_PATH || './src/cli.mjs'
const result = await runCitty(['test'], { cliPath })
```

### Result Inspection
```javascript
const result = await runCitty(['status'])

console.log('Exit code:', result.exitCode)
console.log('Output:', result.stdout)
console.log('Errors:', result.stderr)
console.log('Duration:', result.durationMs, 'ms')
console.log('Mode:', result.mode)
console.log('Command:', result.command)
```

### JSON Parsing
```javascript
const result = await runCitty(['status', '--json'], {
  json: true
})

if (result.json) {
  console.log('Parsed JSON:', result.json)
}
```

## Migration Examples

### From runLocalCitty()
```javascript
// Before
import { runLocalCitty } from 'citty-test-utils'
const result = runLocalCitty({
  cliPath: './cli.js',
  args: ['test'],
  timeout: 5000
})

// After
import { runCitty } from 'citty-test-utils'
const result = await runCitty(['test'], {
  cliPath: './cli.js',
  timeout: 5000
})
```

### From Cleanroom Runner
```javascript
// Before
import { setupCleanroom, runCitty } from 'citty-test-utils/cleanroom'
await setupCleanroom({ rootDir: '.' })
const result = await runCitty(['test'])

// After
import { runCitty } from 'citty-test-utils'
const result = await runCitty(['test'], {
  cleanroom: { enabled: true, rootDir: '.' }
})
```

## Common Recipes

### Fast Tests (Local Mode)
```javascript
describe('Fast tests', () => {
  it('should run quickly', async () => {
    const result = await runCitty(['quick-test'], {
      mode: 'local' // Fast execution
    })
    result.expectSuccess()
  })
})
```

### Isolated Tests (Cleanroom Mode)
```javascript
describe('Isolated tests', () => {
  it('should run in isolation', async () => {
    const result = await runCitty(['test'], {
      cleanroom: {
        enabled: true,
        nodeImage: 'node:20-alpine'
      }
    })
    result.expectSuccess()
  })
})
```

### Performance Testing
```javascript
it('should complete within time limit', async () => {
  const result = await runCitty(['build'])
  result
    .expectSuccess()
    .expectDuration(10000) // Max 10 seconds
})
```

### Multi-Environment Testing
```javascript
const environments = ['development', 'staging', 'production']

for (const env of environments) {
  it(`should work in ${env}`, async () => {
    const result = await runCitty(['deploy'], {
      env: { NODE_ENV: env }
    })
    result.expectSuccess()
  })
}
```

## Tips & Best Practices

### 1. Use Local Mode for Speed
Local mode is 10-20x faster than cleanroom for development:
```javascript
const result = await runCitty(['test'], { mode: 'local' })
```

### 2. Use Cleanroom for CI/Reproducibility
Cleanroom provides isolation and reproducibility:
```javascript
const isCI = process.env.CI === 'true'
const result = await runCitty(['test'], {
  cleanroom: { enabled: isCI }
})
```

### 3. Configure in vitest.config
Set defaults in config, override in tests:
```javascript
// vitest.config.js
citty: { cliPath: './src/cli.mjs' }

// test.mjs
const result = await runCitty(['test']) // Uses config
```

### 4. Chain Assertions
Make tests readable with chaining:
```javascript
result
  .expectSuccess()
  .expectOutput('Build completed')
  .expectDuration(5000)
```

### 5. Use runCittySafe() for Error Tests
Avoid try-catch with safe wrapper:
```javascript
const result = await runCittySafe(['invalid'])
result.expectFailure()
```

### 6. Inspect Config When Debugging
Use `getCittyConfig()` to debug configuration:
```javascript
const config = await getCittyConfig()
console.log('Resolved config:', config)
```
