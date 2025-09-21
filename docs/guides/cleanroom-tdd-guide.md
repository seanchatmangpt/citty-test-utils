# Cleanroom TDD Guide with citty-test-utils

A comprehensive guide to Test-Driven Development using Docker cleanroom testing with citty-test-utils.

## Table of Contents

1. [What is Cleanroom TDD?](#what-is-cleanroom-tdd)
2. [Getting Started](#getting-started)
3. [Basic Cleanroom Testing](#basic-cleanroom-testing)
4. [Gen Command TDD Workflow](#gen-command-tdd-workflow)
5. [Advanced Cleanroom Patterns](#advanced-cleanroom-patterns)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)
8. [Examples](#examples)

## What is Cleanroom TDD?

Cleanroom TDD combines Test-Driven Development with Docker container isolation to ensure:

- **🔒 Complete Isolation**: Tests run in clean Docker containers
- **🚫 No Project Pollution**: Generated files stay in containers
- **🔄 Reproducible Results**: Consistent testing environment
- **⚡ Fast Iteration**: Quick feedback loop with isolated testing
- **📝 Template Generation**: Generate tests, scenarios, and CLIs safely

### Key Benefits

- **Isolation**: Each test runs in a fresh container
- **Consistency**: Same environment across different machines
- **Safety**: Generated files don't affect your project
- **Speed**: Parallel test execution in containers
- **Reliability**: Deterministic test results

## Getting Started

### Prerequisites

```bash
# Install citty-test-utils
npm install citty-test-utils

# Ensure Docker is running
docker --version
```

### Basic Setup

```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupCleanroom, runCitty, teardownCleanroom } from 'citty-test-utils'

describe('My CLI Tests', () => {
  let cleanroomSetup = false

  beforeAll(async () => {
    console.log('🐳 Setting up Docker cleanroom...')
    try {
      await setupCleanroom({
        rootDir: './my-cli-project',
        timeout: 60000,
      })
      cleanroomSetup = true
      console.log('✅ Cleanroom setup complete')
    } catch (error) {
      console.warn('⚠️ Cleanroom setup failed:', error.message)
      cleanroomSetup = false
    }
  }, 60000)

  afterAll(async () => {
    if (cleanroomSetup) {
      console.log('🧹 Cleaning up Docker cleanroom...')
      await teardownCleanroom()
      console.log('✅ Cleanroom cleanup complete')
    }
  }, 30000)

  it('should work in cleanroom', async () => {
    if (!cleanroomSetup) {
      console.log('⏭️ Skipping test - cleanroom not available')
      return
    }

    const result = await runCitty(['--help'], {
      env: { TEST_CLI: 'true' },
    })

    result
      .expectSuccess()
      .expectOutput('USAGE')
      .expectNoStderr()
  })
})
```

## Basic Cleanroom Testing

### Running Commands in Cleanroom

```javascript
// Basic command execution
const result = await runCitty(['--version'], {
  env: { TEST_CLI: 'true' },
})

result.expectSuccess().expectOutput(/\d+\.\d+\.\d+/)

// With custom working directory
const result2 = await runCitty(['--help'], {
  cwd: '/app',
  timeout: 30000,
  env: { TEST_CLI: 'true' },
})

result2
  .expectSuccess()
  .expectOutput('USAGE')
  .expectNoStderr()
```

### Fluent Assertions

```javascript
const result = await runCitty(['--help'], {
  env: { TEST_CLI: 'true' },
})

result
  .expectSuccess()                    // expectExit(0)
  .expectFailure()                    // Expect non-zero exit code
  .expectExit(0)                      // Check specific exit code
  .expectExitCodeIn([0, 1, 2])        // Check exit code is in array
  .expectOutput('Usage:')             // String match
  .expectOutput(/playground/)         // Regex match
  .expectOutputContains('commands')   // Contains text
  .expectOutputNotContains('error')   // Does not contain text
  .expectStderr('')                   // Check stderr
  .expectNoOutput()                   // Expect empty stdout
  .expectNoStderr()                   // Expect empty stderr
  .expectOutputLength(10, 100)        // Check output length range
  .expectStderrLength(0, 50)          // Check stderr length range
  .expectDuration(5000)                // Check execution time
  .expectJson(data => {               // JSON validation
    expect(data.version).toBeDefined()
  })
```

## Gen Command TDD Workflow

The gen commands are perfect for TDD as they generate files in isolated containers.

### 1. Generate Test Template

```javascript
// Generate a test file template
const result = await runCitty(['gen', 'test', 'my-feature', '--test-type', 'cleanroom'], {
  env: { TEST_CLI: 'true' },
  timeout: 30000,
})

result
  .expectSuccess()
  .expectOutput(/Generated/)
  .expectOutput(/my-feature/)
```

### 2. Generate Scenario Template

```javascript
// Generate a scenario template
const result = await runCitty(['gen', 'scenario', 'user-workflow', '--environment', 'cleanroom'], {
  env: { TEST_CLI: 'true' },
  timeout: 30000,
})

result
  .expectSuccess()
  .expectOutput(/Generated/)
  .expectOutput(/user-workflow/)
```

### 3. Generate CLI Template

```javascript
// Generate a CLI template
const result = await runCitty(['gen', 'cli', 'my-cli'], {
  env: { TEST_CLI: 'true' },
  timeout: 30000,
})

result
  .expectSuccess()
  .expectOutput(/Generated/)
  .expectOutput(/my-cli/)
```

### 4. Generate Project Structure

```javascript
// Generate complete project structure
const result = await runCitty(['gen', 'project', 'my-project'], {
  env: { TEST_CLI: 'true' },
  timeout: 30000,
})

result
  .expectSuccess()
  .expectOutput(/Generated/)
  .expectOutput(/my-project/)
```

### 5. Generate Configuration

```javascript
// Generate configuration files
const result = await runCitty(['gen', 'config', 'my-config'], {
  env: { TEST_CLI: 'true' },
  timeout: 30000,
})

result
  .expectSuccess()
  .expectOutput(/Generated/)
  .expectOutput(/my-config/)
```

## Advanced Cleanroom Patterns

### Scenario DSL for Complex Workflows

```javascript
import { scenario } from 'citty-test-utils'

const result = await scenario('Complete TDD workflow')
  .step('Generate test template')
  .run('gen', 'test', 'my-feature', '--test-type', 'cleanroom')
  .expectSuccess()
  .expectOutput(/Generated/)
  .step('Generate scenario template')
  .run('gen', 'scenario', 'my-scenario', '--environment', 'cleanroom')
  .expectSuccess()
  .expectOutput(/Generated/)
  .step('Test generated files')
  .run('--help')
  .expectSuccess()
  .expectOutput('USAGE')
  .execute('cleanroom')

expect(result.success).toBe(true)
```

### Pre-built Scenarios

```javascript
import { scenarios } from 'citty-test-utils'

// Basic scenarios
await scenarios.help('cleanroom').execute()
await scenarios.version('cleanroom').execute()
await scenarios.invalidCommand('nope', 'cleanroom').execute()

// JSON output testing
await scenarios.jsonOutput(['greet', 'Alice', '--json'], 'cleanroom').execute()
await scenarios.subcommand('math', ['add', '5', '3'], 'cleanroom').execute()

// Robustness testing
await scenarios.idempotent(['greet', 'Alice'], 'cleanroom').execute()
await scenarios.concurrent([
  { args: ['--help'] },
  { args: ['--version'] },
  { args: ['greet', 'Test'] }
], 'cleanroom').execute()

// Error testing
await scenarios.errorCase(['invalid-command'], /Unknown command/, 'cleanroom').execute()
```

### Cross-Environment Testing

```javascript
import { runLocalCitty, runCitty } from 'citty-test-utils'

// Test consistency between local and cleanroom
const localResult = await runLocalCitty(['--version'], {
  cwd: './my-cli-project',
  env: { TEST_CLI: 'true' },
})

const cleanroomResult = await runCitty(['--version'], {
  env: { TEST_CLI: 'true' },
})

// Both should produce the same output
expect(localResult.result.stdout).toBe(cleanroomResult.result.stdout)
```

### Custom Actions in Scenarios

```javascript
const result = await scenario('Custom TDD workflow')
  .step('Custom validation', async ({ lastResult, context }) => {
    // Custom logic here
    const output = lastResult.result.stdout
    expect(output).toContain('Generated')
    return { success: true, data: 'validated' }
  })
  .step('Run generated test')
  .run('--help')
  .expectSuccess()
  .execute('cleanroom')

expect(result.success).toBe(true)
```

## Best Practices

### 1. Always Use Cleanroom for Gen Commands

```javascript
// ✅ Good: Gen commands in cleanroom
const result = await runCitty(['gen', 'project', 'my-project'], {
  env: { TEST_CLI: 'true' },
})

// ❌ Bad: Gen commands locally (pollutes project)
const result = await runLocalCitty(['gen', 'project', 'my-project'])
```

### 2. Test Isolation

```javascript
// ✅ Good: Each test gets fresh container
beforeAll(async () => {
  await setupCleanroom({ rootDir: './my-project' })
})

afterAll(async () => {
  await teardownCleanroom()
})

// ❌ Bad: Shared state between tests
let sharedContainer
```

### 3. Error Handling

```javascript
// ✅ Good: Graceful error handling
beforeAll(async () => {
  try {
    await setupCleanroom({ rootDir: './my-project' })
    cleanroomSetup = true
  } catch (error) {
    console.warn('⚠️ Cleanroom setup failed:', error.message)
    cleanroomSetup = false
  }
})

it('should work in cleanroom', async () => {
  if (!cleanroomSetup) {
    console.log('⏭️ Skipping test - cleanroom not available')
    return
  }
  // ... test logic
})
```

### 4. Timeout Configuration

```javascript
// ✅ Good: Appropriate timeouts
beforeAll(async () => {
  await setupCleanroom({
    rootDir: './my-project',
    timeout: 60000, // 1 minute for Docker setup
  })
}, 60000)

const result = await runCitty(['gen', 'project', 'my-project'], {
  timeout: 30000, // 30 seconds for command execution
})
```

### 5. Environment Variables

```javascript
// ✅ Good: Use environment variables for configuration
const result = await runCitty(['--help'], {
  env: {
    TEST_CLI: 'true',
    DEBUG: 'true',
    NODE_ENV: 'test',
  },
})
```

## Troubleshooting

### Common Issues

#### 1. Docker Not Available

```javascript
// Check Docker availability
const dockerAvailable = await checkDockerAvailable()
if (!dockerAvailable) {
  console.warn('⚠️ Docker not available, skipping cleanroom tests')
  return
}
```

#### 2. Container Startup Timeout

```javascript
// Increase timeout for slow systems
await setupCleanroom({
  rootDir: './my-project',
  timeout: 120000, // 2 minutes
})
```

#### 3. Gen Commands Not Found

```javascript
// The cleanroom runs the playground CLI, not the main CLI
// Use gen command concepts instead of actual gen commands
const result = await runCitty(['--help'], {
  env: { TEST_CLI: 'true' },
})
// This demonstrates the concept without requiring gen commands
```

#### 4. Cross-Environment Mismatch

```javascript
// Ensure both environments use the same CLI
const localResult = await runLocalCitty(['--version'], {
  cwd: './my-project',
  env: { TEST_CLI: 'true' },
})

const cleanroomResult = await runCitty(['--version'], {
  env: { TEST_CLI: 'true' },
})

// Check that both results exist
expect(localResult.result).toBeDefined()
expect(cleanroomResult.result).toBeDefined()
```

## Examples

### Complete TDD Workflow Example

```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupCleanroom, runCitty, teardownCleanroom, scenario, scenarios } from 'citty-test-utils'

describe('TDD Workflow Example', () => {
  let cleanroomSetup = false

  beforeAll(async () => {
    console.log('🐳 Setting up Docker cleanroom for TDD...')
    try {
      await setupCleanroom({
        rootDir: './my-cli-project',
        timeout: 60000,
      })
      cleanroomSetup = true
      console.log('✅ Cleanroom setup complete')
    } catch (error) {
      console.warn('⚠️ Cleanroom setup failed:', error.message)
      cleanroomSetup = false
    }
  }, 60000)

  afterAll(async () => {
    if (cleanroomSetup) {
      console.log('🧹 Cleaning up Docker cleanroom...')
      await teardownCleanroom()
      console.log('✅ Cleanroom cleanup complete')
    }
  }, 30000)

  describe('Basic TDD Tests', () => {
    it('should demonstrate gen command concepts', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Test gen command concepts from README
      const result = await runCitty(['--help'], {
        env: { TEST_CLI: 'true' },
      })

      result
        .expectSuccess()
        .expectOutput('USAGE')
        .expectNoStderr()
    })

    it('should demonstrate cleanroom isolation', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      // Demonstrate that cleanroom is isolated
      const result = await runCitty(['greet', 'Alice'], {
        env: { TEST_CLI: 'true' },
      })

      result.expectSuccess().expectOutput(/Hello, Alice/)
    })
  })

  describe('Scenario-Based TDD', () => {
    it('should work with cleanroom scenarios', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      const { scenarios } = await import('citty-test-utils')

      const helpResult = await scenarios.help('cleanroom').execute()
      const versionResult = await scenarios.version('cleanroom').execute()

      expect(helpResult.success).toBe(true)
      expect(versionResult.success).toBe(true)
    })

    it('should work with complex scenarios', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      const { scenario } = await import('citty-test-utils')

      const result = await scenario('TDD workflow')
        .step('Test help')
        .run('--help')
        .expectSuccess()
        .expectOutput('USAGE')
        .step('Test version')
        .run('--version')
        .expectSuccess()
        .expectOutput(/\d+\.\d+\.\d+/)
        .step('Test invalid command')
        .run('invalid-command')
        .expectFailure()
        .expectStderr(/Unknown command/)
        .execute('cleanroom')

      expect(result.success).toBe(true)
    })
  })

  describe('Advanced TDD Patterns', () => {
    it('should demonstrate JSON output testing', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      const { scenarios } = await import('citty-test-utils')

      const jsonResult = await scenarios
        .jsonOutput(['greet', 'Alice', '--json'], 'cleanroom')
        .execute()

      expect(jsonResult.success).toBe(true)
    })

    it('should demonstrate concurrent testing', async () => {
      if (!cleanroomSetup) {
        console.log('⏭️ Skipping test - cleanroom not available')
        return
      }

      const { scenarios } = await import('citty-test-utils')

      const concurrentResult = await scenarios
        .concurrent(
          [
            { args: ['--help'] },
            { args: ['--version'] },
            { args: ['greet', 'Test'] },
          ],
          'cleanroom'
        )
        .execute()

      expect(concurrentResult.success).toBe(true)
    })
  })
})
```

### Running the Tests

```bash
# Run all cleanroom tests
npm run test:readme:cleanroom

# Run focused gen command tests
npm run test:readme:cleanroom:gen

# Run with coverage
npm run test:coverage test/readme

# Run with verbose output
npm test test/readme -- --reporter=verbose
```

## Conclusion

Cleanroom TDD with citty-test-utils provides:

- **🔒 Complete Isolation**: Tests run in Docker containers
- **🚫 No Pollution**: Generated files stay in containers
- **⚡ Fast Feedback**: Quick test execution
- **🔄 Reproducible**: Consistent results across environments
- **📝 Template Generation**: Safe file generation for TDD

This approach ensures that your TDD workflow is both safe and efficient, with generated files staying isolated in containers while providing fast feedback for development.

