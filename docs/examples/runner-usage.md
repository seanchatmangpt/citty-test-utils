# Runner Command Usage Examples

## Overview

The `runner` commands in citty-test-utils provide powerful CLI execution capabilities with full error handling, fluent assertions, and support for both local and Docker cleanroom environments.

## Table of Contents

- [Local Runner](#local-runner)
- [Cleanroom Runner](#cleanroom-runner)
- [Programmatic Usage](#programmatic-usage)
- [Error Handling](#error-handling)
- [Integration with CI/CD](#integration-with-cicd)

---

## Local Runner

The local runner executes CLI commands in your current environment with full control over execution context.

### Basic Usage

```bash
# Execute help command
node src/cli.mjs runner local "--help"

# Execute version command
node src/cli.mjs runner local "--version"

# Execute complex command with arguments
node src/cli.mjs runner local "gen project my-app"
```

### With Options

```bash
# Custom timeout (milliseconds)
node src/cli.mjs runner local "--help" --timeout 30000

# Specify CLI path explicitly
node src/cli.mjs runner local "--help" --cli-path ./custom/cli.mjs

# Custom working directory
node src/cli.mjs runner local "info version" --cwd ./my-project

# JSON output format
node src/cli.mjs runner local "--version" --json
```

### JSON Output Example

```bash
node src/cli.mjs runner local "--version" --json
```

**Output:**
```json
{
  "success": true,
  "exitCode": 0,
  "stdout": "0.5.1",
  "stderr": "",
  "durationMs": 234,
  "command": ["--version"],
  "environment": "local",
  "timestamp": "2025-10-02T15:30:00.000Z"
}
```

### Verbose Mode

```bash
node src/cli.mjs runner local "--help" --verbose
```

**Output:**
```
Running command locally: --help
Running locally: --help
Exit Code: 0
Duration: 156ms

Output:
Citty Test Utils CLI - Comprehensive testing framework...
```

---

## Cleanroom Runner

The cleanroom runner executes commands in isolated Docker containers for consistent, reproducible testing.

### Basic Usage

```bash
# Execute in default Node.js container
node src/cli.mjs runner cleanroom "--help"

# Execute version check
node src/cli.mjs runner cleanroom "--version"

# Execute complex command
node src/cli.mjs runner cleanroom "analysis discover"
```

### With Docker Options

```bash
# Custom Docker image
node src/cli.mjs runner cleanroom "--help" --docker-image node:18-alpine

# Custom memory limit
node src/cli.mjs runner cleanroom "--version" --memory-limit 1g

# Custom CPU limit
node src/cli.mjs runner cleanroom "--help" --cpu-limit 2.0

# Custom root directory to mount
node src/cli.mjs runner cleanroom "--help" --root-dir ./my-project

# Extended timeout for slow commands
node src/cli.mjs runner cleanroom "analysis coverage" --timeout 60000
```

### Container Persistence

```bash
# Keep container running after execution
node src/cli.mjs runner cleanroom "--help" --no-teardown

# Container will be reused for subsequent commands
# (until manually torn down)
```

### JSON Output Example

```bash
node src/cli.mjs runner cleanroom "--version" --json
```

**Output:**
```json
{
  "success": true,
  "exitCode": 0,
  "stdout": "0.5.1",
  "stderr": "",
  "durationMs": 2145,
  "command": ["--version"],
  "environment": "cleanroom",
  "dockerImage": "node:20-alpine",
  "timestamp": "2025-10-02T15:30:00.000Z"
}
```

---

## Programmatic Usage

### Local Runner in Code

```javascript
import { runLocalCitty } from 'citty-test-utils'

// Basic execution
const result = await runLocalCitty(['--help'], {
  cwd: './my-cli-project',
  timeout: 30000,
})

// Check result
console.log('Exit code:', result.exitCode)
console.log('Output:', result.stdout)
console.log('Duration:', result.durationMs, 'ms')

// Use fluent assertions
result
  .expectSuccess()
  .expectOutput('USAGE')
  .expectNoStderr()
```

### Cleanroom Runner in Code

```javascript
import {
  setupCleanroom,
  runCitty,
  teardownCleanroom
} from 'citty-test-utils'

// Setup cleanroom once
await setupCleanroom({
  rootDir: './my-cli-project',
  nodeImage: 'node:20-alpine',
  memoryLimit: '512m',
  timeout: 60000,
})

// Execute multiple commands
const help = await runCitty(['--help'], { timeout: 10000 })
const version = await runCitty(['--version'], { timeout: 10000 })

// Use fluent assertions
help.expectSuccess().expectOutput('USAGE')
version.expectSuccess().expectOutput(/\d+\.\d+\.\d+/)

// Cleanup when done
await teardownCleanroom()
```

### In Test Suites (Vitest)

```javascript
import { describe, it, beforeAll, afterAll } from 'vitest'
import { setupCleanroom, runCitty, teardownCleanroom } from 'citty-test-utils'

describe('CLI Commands', () => {
  beforeAll(async () => {
    await setupCleanroom({ rootDir: './my-cli-project' })
  })

  afterAll(async () => {
    await teardownCleanroom()
  })

  it('should show help', async () => {
    const result = await runCitty(['--help'])
    result.expectSuccess().expectOutput('USAGE')
  })

  it('should show version', async () => {
    const result = await runCitty(['--version'])
    result.expectSuccess().expectOutput(/\d+\.\d+\.\d+/)
  })
})
```

---

## Error Handling

### Exit Code Handling

```bash
# Local runner exits with command's exit code
node src/cli.mjs runner local "invalid-command"
# Exit code: 1 (command failed)

# Cleanroom runner also preserves exit codes
node src/cli.mjs runner cleanroom "invalid-command"
# Exit code: 1 (command failed)
```

### Error Messages

**CLI Not Found:**
```bash
node src/cli.mjs runner local "--help" --cli-path ./missing.mjs
```

**Output:**
```
❌ Local execution failed: CLI file not found
💡 Tip: Verify the CLI path exists
```

**Docker Not Available:**
```bash
node src/cli.mjs runner cleanroom "--help"
```

**Output:**
```
❌ Cleanroom execution failed: Docker daemon not available

💡 Troubleshooting tips:
  - Ensure Docker is installed and running
  - Check Docker daemon status: docker info
  - Verify Docker permissions for current user
```

**Timeout Exceeded:**
```bash
node src/cli.mjs runner local "slow-command" --timeout 1000
```

**Output:**
```
❌ Local execution failed: Command timed out after 1000ms
```

### Programmatic Error Handling

```javascript
import { runLocalCitty } from 'citty-test-utils'

try {
  const result = await runLocalCitty(['--help'], {
    timeout: 30000,
  })

  if (result.exitCode !== 0) {
    console.error('Command failed:', result.stderr)
    process.exit(result.exitCode)
  }

  console.log('Success:', result.stdout)
} catch (error) {
  console.error('Execution error:', error.message)
  process.exit(1)
}
```

---

## Integration with CI/CD

### GitHub Actions

```yaml
name: CLI Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Test CLI locally
        run: |
          node src/cli.mjs runner local "--help"
          node src/cli.mjs runner local "--version"

      - name: Test CLI in cleanroom
        run: |
          node src/cli.mjs runner cleanroom "--help" --timeout 60000
          node src/cli.mjs runner cleanroom "--version" --timeout 60000

      - name: Analyze coverage
        run: |
          node src/cli.mjs analysis discover --verbose
          node src/cli.mjs analysis coverage --threshold 80
```

### GitLab CI

```yaml
test:cli:
  image: node:20-alpine
  script:
    - npm install
    - node src/cli.mjs runner local "--help"
    - node src/cli.mjs runner local "--version"
    - node src/cli.mjs runner cleanroom "--help"
    - node src/cli.mjs analysis coverage --threshold 80
  only:
    - main
    - merge_requests
```

### Docker Compose

```yaml
version: '3.8'

services:
  cli-test:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - .:/app
    command: >
      sh -c "
        npm install &&
        node src/cli.mjs runner local '--help' &&
        node src/cli.mjs runner cleanroom '--version'
      "
```

---

## Advanced Patterns

### Parallel Execution

```javascript
import { runLocalCitty } from 'citty-test-utils'

// Execute multiple commands in parallel
const results = await Promise.all([
  runLocalCitty(['--help']),
  runLocalCitty(['--version']),
  runLocalCitty(['info', 'version']),
])

// Check all succeeded
results.forEach(r => r.expectSuccess())
```

### Sequential Workflow

```javascript
import { runLocalCitty } from 'citty-test-utils'

// Setup
const init = await runLocalCitty(['gen', 'project', 'test-app'])
init.expectSuccess()

// Verify
const status = await runLocalCitty(['info', 'version'])
status.expectSuccess()

// Test
const test = await runLocalCitty(['test', 'run'])
test.expectSuccess()
```

### Custom Assertions

```javascript
import { runLocalCitty } from 'citty-test-utils'

const result = await runLocalCitty(['--help'])

// Custom validation
result
  .expectSuccess()
  .expectOutput('USAGE')
  .expectOutput(/citty-test-utils/i)
  .expectOutputLength(100, 5000)
  .expectDuration(1000)  // Max 1 second
  .expectNoStderr()
```

---

## Best Practices

### 1. Use Appropriate Runner

```javascript
// Local runner for fast unit tests
const localResult = await runLocalCitty(['--help'])

// Cleanroom for integration tests
await setupCleanroom()
const cleanroomResult = await runCitty(['--help'])
await teardownCleanroom()
```

### 2. Set Appropriate Timeouts

```javascript
// Quick commands
const help = await runLocalCitty(['--help'], { timeout: 5000 })

// Slow commands
const analysis = await runLocalCitty(['analysis', 'coverage'], {
  timeout: 60000
})
```

### 3. Handle Errors Gracefully

```javascript
try {
  const result = await runLocalCitty(['--help'])
  result.expectSuccess()
} catch (error) {
  if (error.message.includes('timeout')) {
    console.error('Command took too long')
  } else {
    throw error  // Unexpected error
  }
}
```

### 4. Clean Up Resources

```javascript
// Always cleanup cleanroom
try {
  await setupCleanroom()
  await runCitty(['--help'])
} finally {
  await teardownCleanroom()  // Even on error
}
```

---

## Return Codes

### Exit Codes

| Code | Meaning | Example |
|------|---------|---------|
| 0    | Success | `--help`, `--version` |
| 1    | General error | Invalid command, missing file |
| 2    | Usage error | Missing required arguments |
| 127  | Command not found | CLI path doesn't exist |
| 130  | Interrupted (Ctrl+C) | User cancellation |
| 137  | Killed (OOM) | Out of memory |
| 143  | Terminated (SIGTERM) | Process killed |
| 255  | Timeout | Command exceeded timeout |

### HTTP-Style Codes (JSON Output)

```json
{
  "success": false,
  "exitCode": 1,
  "errorCode": "CLI_NOT_FOUND",
  "message": "CLI file does not exist",
  "timestamp": "2025-10-02T15:30:00.000Z"
}
```

---

## Troubleshooting

### Docker Issues

**Problem:** `Cannot connect to Docker daemon`

**Solution:**
```bash
# Check Docker status
docker info

# Restart Docker Desktop
# Or start Docker daemon (Linux)
sudo systemctl start docker
```

### Timeout Issues

**Problem:** Commands timing out

**Solution:**
```bash
# Increase timeout
node src/cli.mjs runner local "slow-command" --timeout 120000

# Or in code
const result = await runLocalCitty(['slow-command'], {
  timeout: 120000  // 2 minutes
})
```

### Permission Issues

**Problem:** `EACCES: permission denied`

**Solution:**
```bash
# Make CLI executable
chmod +x src/cli.mjs

# Or run with node explicitly
node src/cli.mjs runner local "--help"
```

---

## Summary

The runner commands provide:
- ✅ **Local execution** with full environment control
- ✅ **Cleanroom execution** in isolated Docker containers
- ✅ **Fluent assertions** for easy result validation
- ✅ **Comprehensive error handling** with helpful messages
- ✅ **JSON output** for automation and CI/CD
- ✅ **Flexible configuration** via CLI flags and code

Use them for:
- Testing CLI applications
- CI/CD pipelines
- Integration tests
- Cross-platform validation
- Development and debugging
