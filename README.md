# citty-test-utils

A comprehensive testing framework for CLI applications built with Citty, featuring Docker cleanroom support, fluent assertions, advanced scenario DSL, and intelligent AST-based analysis.

[![npm version](https://badge.fury.io/js/citty-test-utils.svg)](https://badge.fury.io/js/citty-test-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/citty-test-utils.svg)](https://nodejs.org/)

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
  .run('--help', { cwd: './my-cli-project' })
  .expectSuccess()
  .expectOutput('USAGE')
  .step('Get version')
  .run('--version', { cwd: './my-cli-project' })
  .expectSuccess()
  .expectOutput(/\d+\.\d+\.\d+/)
  .step('Test invalid command')
  .run('invalid-command', { cwd: './my-cli-project' })
  .expectFailure()
  .expectStderr(/Unknown command/)
  .execute('local')  // or 'cleanroom'
```

### **🎯 Pre-built Scenarios**
Ready-to-use testing patterns for common CLI scenarios.

```javascript
import { scenarios } from 'citty-test-utils'

// Basic scenarios (requires explicit cwd for playground)
const helpScenario = scenarios.help('local')
helpScenario.execute = async function() {
  const r = await runLocalCitty(['--help'], { cwd: './my-cli-project', env: { TEST_CLI: 'true' } })
  r.expectSuccess().expectOutput(/USAGE|COMMANDS/i)
  return { success: true, result: r.result }
}
await helpScenario.execute()

// JSON output testing
const jsonScenario = scenarios.jsonOutput(['greet', 'Alice', '--json'], 'local')
jsonScenario.execute = async function() {
  const r = await runLocalCitty(['greet', 'Alice', '--json'], { cwd: './my-cli-project', env: { TEST_CLI: 'true' } })
  r.expectSuccess().expectJson(data => expect(data.message).toBeDefined())
  return { success: true, result: r.result }
}
await jsonScenario.execute()

// Robustness testing
const idempotentScenario = scenarios.idempotent(['greet', 'Alice'], 'local')
idempotentScenario.execute = async function() {
  const r1 = await runLocalCitty(['greet', 'Alice'], { cwd: './my-cli-project', env: { TEST_CLI: 'true' } })
  const r2 = await runLocalCitty(['greet', 'Alice'], { cwd: './my-cli-project', env: { TEST_CLI: 'true' } })
  r1.expectSuccess()
  r2.expectSuccess()
  expect(r1.result.stdout).toBe(r2.result.stdout)
  return { success: true, result: r1.result }
}
await idempotentScenario.execute()
```

## 🚀 **What's New in v0.5.0**

- **🧠 AST-Based Analysis**: Revolutionary AST-first CLI coverage analysis
- **🎯 Smart Recommendations**: AI-powered test improvement suggestions
- **📊 Multi-Dimensional Coverage**: Commands, subcommands, flags, and options
- **⚡ Performance Optimization**: Parallel processing and AST caching
- **🔍 CLI Discovery**: Automatic CLI structure discovery via AST parsing
- **📈 Coverage Trends**: Historical coverage tracking and analysis
- **🔧 Enhanced Documentation**: Testing-first documentation architecture
- **✅ Functional Examples**: All examples verified and working

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
# AST-based CLI analysis
npx citty-test-utils analysis discover --cli-path src/cli.mjs
npx citty-test-utils analysis coverage --test-dir test --threshold 80
npx citty-test-utils analysis recommend --priority high

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
  .expectOutput(/my-cli/)              // Regex match
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
    .run('--help', { cwd: './my-cli-project' })
    .expectSuccess()
    .expectOutput('USAGE')
    .step('Get version')
    .run('--version', { cwd: './my-cli-project' })
    .expectSuccess()
    .expectOutput(/\d+\.\d+\.\d+/)
    .step('Test invalid command')
    .run('invalid-command', { cwd: './my-cli-project' })
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
      .run('--help', { cwd: './my-cli-project' })
      .expectSuccess()
      .expectOutput('USAGE')
      .step('Get version')
      .run('--version', { cwd: './my-cli-project' })
      .expectSuccess()
      .expectOutput(/\d+\.\d+\.\d+/)
      .step('Test invalid command')
      .run('invalid-command', { cwd: './my-cli-project' })
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

The included playground project (`./playground/`) serves as a complete example and testing environment:

- **Full Citty CLI**: Demonstrates commands, subcommands, and options
- **Comprehensive Tests**: Unit, integration, and scenario tests
- **All Features**: Shows every aspect of `citty-test-utils`
- **Best Practices**: Demonstrates proper usage patterns
- **Ready-to-Test**: All examples in this README work with `cwd: './playground'`

```bash
# Run playground tests
cd playground
npm install
npm test

# Run playground CLI
npm start

# Test examples from this README
cd ..
node -e "
import { runLocalCitty } from './index.js';
const result = await runLocalCitty(['--help'], { cwd: './playground', env: { TEST_CLI: 'true' } });
result.expectSuccess().expectOutput('USAGE');
console.log('✅ Playground example works!');
"
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