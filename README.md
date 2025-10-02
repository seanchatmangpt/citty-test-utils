# citty-test-utils

> A comprehensive testing framework for CLI applications built with Citty - featuring local & Docker cleanroom execution, fluent assertions, scenario DSL, and fail-fast validation.

[![npm version](https://badge.fury.io/js/citty-test-utils.svg)](https://www.npmjs.com/package/citty-test-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/citty-test-utils.svg)](https://nodejs.org/)

---

## ✨ Features

- 🚀 **Local Runner** - Execute any CLI locally with Zod validation
- 🐳 **Cleanroom Testing** - Isolated Docker environments with testcontainers
- 🎭 **Scenario DSL** - Build complex multi-step test workflows
- ✅ **Fluent Assertions** - Chainable, expressive test assertions
- 📸 **Snapshot Testing** - Capture and compare CLI output
- 🔍 **AST Analysis** - Intelligent CLI command discovery
- ⚡ **Fail-Fast** - Clear errors with actionable suggestions
- 🔄 **Backward Compatible** - Supports v0.5.1 and v0.6.0 APIs

---

## 📦 Installation

```bash
npm install citty-test-utils --save-dev
```

**Requirements:**
- Node.js ≥ 18.0.0
- Docker (required for cleanroom testing only)

---

## 🚀 Quick Start

### 1. Test Your CLI Locally

```javascript
import { runLocalCitty } from 'citty-test-utils'

// v0.6.0 API - Single options object
const result = await runLocalCitty({
  args: ['--help'],
  cliPath: './src/cli.mjs',
  cwd: './my-project'
})

// Fluent assertions
result
  .expectSuccess()
  .expectOutput(/USAGE/)
  .expectDuration(1000)

console.log('Output:', result.result.stdout)
```

### 2. Build Multi-Step Scenarios

```javascript
import { scenario } from 'citty-test-utils'

await scenario('User workflow')
  .step('Show help')
  .run({ args: ['--help'], cliPath: './src/cli.mjs' })
  .expectSuccess()
  .expectOutput('USAGE')

  .step('Initialize project')
  .run({ args: ['init', 'my-app'], cliPath: './src/cli.mjs' })
  .expectSuccess()
  .expectOutput('initialized')

  .execute('local')
```

### 3. Test in Cleanroom (Docker)

```javascript
import { setupCleanroom, runCitty, teardownCleanroom } from 'citty-test-utils'

// Setup isolated environment
await setupCleanroom({ rootDir: '.' })

// Run in Docker container
const result = await runCitty(['--version'])
result.expectSuccess()

// Cleanup
await teardownCleanroom()
```

---

## 📚 Core Concepts

### Local Runner

Execute any CLI file locally with full validation:

```javascript
const result = await runLocalCitty({
  args: ['test', '--verbose'],      // CLI arguments
  cliPath: './bin/cli.js',          // Path to CLI file (REQUIRED)
  cwd: './my-project',              // Working directory
  env: { DEBUG: 'true' },           // Environment variables
  timeout: 30000                     // Timeout in ms (default: 30000)
})
```

**Key Points:**
- `cliPath` is **required** in v0.6.0
- Uses Zod validation for fail-fast errors
- Returns wrapped result with fluent assertions
- Supports relative or absolute paths

### Scenario DSL

Build complex test workflows with the scenario DSL:

```javascript
await scenario('Complete workflow')
  // String signature (simplest)
  .step('Help')
  .run('--help')
  .expectSuccess()

  // Array + options (v0.5.1 backward compatible)
  .step('Version')
  .run(['--version'], { cwd: './project' })
  .expectSuccess()

  // Object (v0.6.0 full control)
  .step('Build')
  .run({
    args: ['build'],
    cliPath: './bin/cli.js',
    cwd: './project',
    env: { NODE_ENV: 'production' }
  })
  .expectSuccess()
  .expectOutput('Build complete')

  .execute('local')
```

**3 Signature Types Supported:**
1. **String**: `.run('--help')` - Auto-splits arguments
2. **Array + Options**: `.run(['--help'], { cwd: './path' })` - v0.5.1 style
3. **Object**: `.run({ args: ['--help'], cliPath: 'cli.js' })` - v0.6.0 full control

### Fluent Assertions

Chain assertions for expressive tests:

```javascript
result
  .expectSuccess()              // Exit code 0
  .expectFailure()              // Exit code non-zero
  .expectExit(1)                // Specific exit code
  .expectOutput('text')         // stdout contains text
  .expectOutput(/regex/)        // stdout matches regex
  .expectStderr('error')        // stderr contains text
  .expectDuration(1000)         // Duration <= 1000ms
  .expectJson(json => {         // Parse and validate JSON
    expect(json.status).toBe('ok')
  })
```

---

## 🎯 API Reference

### runLocalCitty(options)

Execute CLI locally with validation.

**Options:**
```typescript
{
  args: string[]           // CLI arguments (REQUIRED)
  cliPath: string         // Path to CLI file (REQUIRED)
  cwd?: string            // Working directory (default: process.cwd())
  env?: Record<string, string>  // Environment variables
  timeout?: number        // Timeout in ms (default: 30000)
}
```

**Returns:** `AssertionResult` with fluent methods

**Example:**
```javascript
const result = await runLocalCitty({
  args: ['build', '--prod'],
  cliPath: './dist/cli.js',
  cwd: '/absolute/path/to/project',
  env: { NODE_ENV: 'production' },
  timeout: 60000
})
```

### runLocalCittySafe(options)

Same as `runLocalCitty` but catches errors and returns result object instead of throwing.

**Use when:** You expect the command might fail and want to handle it gracefully.

```javascript
const result = await runLocalCittySafe({
  args: ['might-fail'],
  cliPath: './cli.js'
})

if (result.success) {
  console.log('Success:', result.stdout)
} else {
  console.log('Failed:', result.stderr)
}
```

### scenario(name)

Create a multi-step test scenario.

**Methods:**
- `.step(description)` - Add a step
- `.run(args, options?)` - Execute command (3 signatures)
- `.expect(fn)` - Custom assertion
- `.expectSuccess()` - Expect exit code 0
- `.expectFailure()` - Expect non-zero exit code
- `.expectOutput(pattern)` - Expect stdout matches
- `.expectStderr(pattern)` - Expect stderr matches
- `.execute(runner)` - Run scenario ('local' or 'cleanroom')
- `.concurrent()` - Run steps in parallel
- `.sequential()` - Run steps in sequence (default)

**Example:**
```javascript
await scenario('E2E Test')
  .step('Setup')
  .run({ args: ['init'], cliPath: './cli.js' })
  .expectSuccess()

  .step('Build')
  .run({ args: ['build'], cliPath: './cli.js' })
  .expectSuccess()
  .expectOutput('✓ Build complete')

  .step('Test')
  .run({ args: ['test'], cliPath: './cli.js' })
  .expectSuccess()

  .execute('local')
```

### setupCleanroom(options)

Create isolated Docker environment for testing.

**Options:**
```typescript
{
  rootDir?: string        // Directory to copy (default: '.')
  nodeImage?: string      // Docker image (default: 'node:20-alpine')
  memoryLimit?: string    // Memory limit (default: '512m')
  cpuLimit?: string       // CPU limit (default: '1.0')
  timeout?: number        // Startup timeout (default: 60000)
}
```

**Example:**
```javascript
await setupCleanroom({
  rootDir: './my-app',
  nodeImage: 'node:20-alpine',
  memoryLimit: '1g'
})
```

### runCitty(args, options)

Execute CLI in cleanroom container.

**Example:**
```javascript
const result = await runCitty(
  ['build', '--prod'],
  {
    cwd: '/app',
    env: { NODE_ENV: 'production' },
    timeout: 30000
  }
)
```

### teardownCleanroom()

Stop and remove cleanroom container.

```javascript
await teardownCleanroom()
```

---

## 🔧 Advanced Features

### Snapshot Testing

Capture and compare CLI output:

```javascript
import { scenario } from 'citty-test-utils'

await scenario('Snapshot test')
  .step('Capture help output')
  .run({ args: ['--help'], cliPath: './cli.js' })
  .expectSuccess()
  .expectSnapshotStdout('help-output')
  .execute('local')
```

**Snapshot Methods:**
- `.expectSnapshot(name)` - Full result snapshot
- `.expectSnapshotStdout(name)` - stdout only
- `.expectSnapshotStderr(name)` - stderr only
- `.expectSnapshotJson(name)` - JSON output
- `.expectSnapshotFull(name)` - Complete result

### Concurrent Execution

Run steps in parallel for faster tests:

```javascript
await scenario('Parallel tests')
  .concurrent()  // Enable parallel mode

  .step('Test 1').run({ args: ['test1'], cliPath: './cli.js' })
  .step('Test 2').run({ args: ['test2'], cliPath: './cli.js' })
  .step('Test 3').run({ args: ['test3'], cliPath: './cli.js' })

  .execute('local')
```

### Custom Assertions

Add your own assertion logic:

```javascript
await scenario('Custom validation')
  .step('Check output')
  .run({ args: ['status'], cliPath: './cli.js' })
  .expect(result => {
    const lines = result.stdout.split('\n')
    if (lines.length < 5) {
      throw new Error('Expected at least 5 lines of output')
    }
  })
  .execute('local')
```

### Pre-built Scenario Templates

Use ready-made scenarios for common patterns:

```javascript
import { scenarioTemplates } from 'citty-test-utils'

// Help command test
await scenarioTemplates.help({ cliPath: './cli.js' }).execute('local')

// Version check
await scenarioTemplates.version({ cliPath: './cli.js' }).execute('local')

// Invalid command handling
await scenarioTemplates.invalidCommand({ cliPath: './cli.js' }).execute('local')
```

---

## 🎨 Usage Examples

### Example 1: Basic CLI Testing

```javascript
import { runLocalCitty } from 'citty-test-utils'

describe('CLI Tests', () => {
  test('shows help', async () => {
    const result = await runLocalCitty({
      args: ['--help'],
      cliPath: './bin/my-cli.js'
    })

    result
      .expectSuccess()
      .expectOutput('Usage:')
      .expectOutput('Commands:')
  })

  test('handles errors', async () => {
    const result = await runLocalCittySafe({
      args: ['invalid-command'],
      cliPath: './bin/my-cli.js'
    })

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('Unknown command')
  })
})
```

### Example 2: E2E Workflow

```javascript
import { scenario } from 'citty-test-utils'

test('complete user workflow', async () => {
  const result = await scenario('User creates and builds project')
    .step('Initialize project')
    .run({
      args: ['init', 'my-app'],
      cliPath: './bin/cli.js',
      cwd: '/tmp/test'
    })
    .expectSuccess()
    .expectOutput('Project initialized')

    .step('Install dependencies')
    .run({
      args: ['install'],
      cliPath: './bin/cli.js',
      cwd: '/tmp/test/my-app'
    })
    .expectSuccess()

    .step('Build project')
    .run({
      args: ['build', '--prod'],
      cliPath: './bin/cli.js',
      cwd: '/tmp/test/my-app'
    })
    .expectSuccess()
    .expectOutput('Build complete')
    .expectDuration(10000)

    .execute('local')

  expect(result.success).toBe(true)
})
```

### Example 3: Cleanroom Testing

```javascript
import { setupCleanroom, runCitty, teardownCleanroom } from 'citty-test-utils'

describe('Cleanroom Tests', () => {
  beforeAll(async () => {
    await setupCleanroom({ rootDir: '.' })
  })

  afterAll(async () => {
    await teardownCleanroom()
  })

  test('builds in clean environment', async () => {
    const result = await runCitty(['build'])

    result
      .expectSuccess()
      .expectOutput('Build successful')
  })

  test('tests pass in isolation', async () => {
    const result = await runCitty(['test'])

    result
      .expectSuccess()
      .expectOutput(/\d+ passing/)
  })
})
```

### Example 4: Monorepo Testing

```javascript
import { runLocalCitty } from 'citty-test-utils'

// Test CLI in packages/cli
const cliResult = await runLocalCitty({
  args: ['build'],
  cliPath: './packages/cli/bin/cli.js',
  cwd: './packages/app'
})

// Test different package
const adminResult = await runLocalCitty({
  args: ['deploy'],
  cliPath: './packages/admin/bin/admin-cli.js',
  cwd: './packages/admin'
})
```

---

## 🔄 Migration Guide

### From v0.5.1 to v0.6.0/v0.6.1

**Key Changes:**
1. API signature changed to single options object
2. `cliPath` is now required (with defaults)
3. Scenario DSL supports 3 signature types for backward compatibility

**Old API (v0.5.1):**
```javascript
// ❌ No longer works
await runLocalCitty(['--help'], {
  cwd: './project'
})
```

**New API (v0.6.0+):**
```javascript
// ✅ Required in v0.6.0
await runLocalCitty({
  args: ['--help'],
  cliPath: './src/cli.mjs',  // Now required
  cwd: './project'
})
```

**Scenario DSL - Still Works!**
```javascript
// ✅ Old v0.5.1 style still supported
await scenario('Test')
  .step('Help')
  .run(['--help'], { cwd: './project' })
  .execute('local')

// ✅ New v0.6.0 style also works
await scenario('Test')
  .step('Help')
  .run({
    args: ['--help'],
    cliPath: './cli.js',
    cwd: './project'
  })
  .execute('local')
```

**Auto-Configuration:**

v0.6.0+ auto-adds missing parameters:
- `cliPath`: Uses `process.env.TEST_CLI_PATH` or `'./src/cli.mjs'`
- `cwd`: Defaults to `process.cwd()`
- `env.TEST_CLI`: Auto-set to `'true'` for local runner

**Set Defaults:**
```bash
# In your environment or package.json
export TEST_CLI_PATH="./bin/my-cli.js"
```

See full [Migration Guide](./docs/MIGRATION-v0.5.1-to-v0.6.0.md) for details.

---

## 🐛 Troubleshooting

### Error: "CLI file not found"

**Problem:** `cliPath` is incorrect or file doesn't exist

**Solution:**
```javascript
// ✅ Use absolute path
await runLocalCitty({
  args: ['--help'],
  cliPath: '/absolute/path/to/cli.js'
})

// ✅ Or verify relative path
await runLocalCitty({
  args: ['--help'],
  cliPath: './src/cli.mjs',
  cwd: '/absolute/path/to/project'
})
```

### Error: "Invalid input: expected object, received array"

**Problem:** Using old v0.5.1 API with runLocalCitty

**Solution:**
```javascript
// ❌ Old API (v0.5.1)
await runLocalCitty(['--help'], { cwd: './path' })

// ✅ New API (v0.6.0+)
await runLocalCitty({
  args: ['--help'],
  cliPath: './cli.js',
  cwd: './path'
})
```

### Error: "does not provide an export named 'runCitty'"

**Problem:** Using v0.6.0 (fixed in v0.6.1)

**Solution:**
```bash
# Upgrade to v0.6.1
npm install citty-test-utils@0.6.1
```

### Docker Issues

**Problem:** Cleanroom tests fail with Docker errors

**Solution:**
```bash
# Check Docker is running
docker info

# Verify Docker daemon
docker ps

# Check Docker version
docker --version
```

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone repository
git clone https://github.com/seanchatmangpt/citty-test-utils.git
cd citty-test-utils

# Install dependencies
npm install

# Run tests
npm test

# Run specific tests
npm run test:unit
npm run test:integration
npm run test:cleanroom
```

---

## 📖 Documentation

- [API Documentation](./docs/api/README.md)
- [Migration Guide](./docs/MIGRATION-v0.5.1-to-v0.6.0.md)
- [Best Practices](./docs/guides/best-practices.md)
- [Troubleshooting](./docs/guides/troubleshooting.md)
- [Examples](./docs/examples/README.md)
- [Changelog](./CHANGELOG.md)

---

## 📄 License

MIT © [GitVan Team](https://github.com/seanchatmangpt)

---

## 🙏 Acknowledgments

- Built with [Citty](https://github.com/unjs/citty) - Modern CLI framework
- Powered by [testcontainers](https://github.com/testcontainers/testcontainers-node) - Docker testing
- Validated with [Zod](https://github.com/colinhacks/zod) - TypeScript-first schema validation

---

## ⭐ Support

If you find this package helpful, please consider:

- ⭐ Starring the [GitHub repository](https://github.com/seanchatmangpt/citty-test-utils)
- 🐛 [Reporting issues](https://github.com/seanchatmangpt/citty-test-utils/issues)
- 📝 [Contributing improvements](https://github.com/seanchatmangpt/citty-test-utils/pulls)
- 📢 Sharing with the community

---

<div align="center">

**[Documentation](./docs/README.md)** • **[Examples](./docs/examples/README.md)** • **[API Reference](./docs/api/README.md)** • **[Changelog](./CHANGELOG.md)**

Made with ❤️ by the GitVan Team

</div>
