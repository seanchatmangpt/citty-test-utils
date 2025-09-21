# citty-test-utils

**The Universal CLI Testing Framework** - Test any CLI application in any language with the same intuitive `ctu <noun> <verb>` pattern and universal contract. Also includes Citty-specific utilities for GitVan projects.

[![npm version](https://badge.fury.io/js/citty-test-utils.svg)](https://badge.fury.io/js/citty-test-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/citty-test-utils.svg)](https://nodejs.org/)

## 🌟 Dual Architecture: Universal + Citty-Specific

**citty-test-utils** provides both **universal CLI testing** for any framework and **Citty-specific utilities** for GitVan projects:

### **Universal Contract Architecture**

**citty-test-utils** features a **universal contract** that separates framework-agnostic testing logic from language-specific adapters:

### **Contract (Framework-Agnostic)**
- **Process runners**: Local, Docker, Podman, SSH, Deno, WASI
- **I/O modes**: stdio, **PTY** (interactive), file pipes
- **Determinism**: TZ=UTC, LANG=C, fixed HOME/TMP, network policy
- **Artifacts**: stdout, stderr, exitCode, duration, env, cwd, fs diff
- **Assertions**: exit, output, JSON, duration, files, side-effects
- **Scenarios**: steps, hooks, retries, concurrency, matrices
- **Reporters**: JSON, JUnit, HTML, TAP

### **Adapters (Framework-Specific)**
- **Node.js**: Commander, Yargs, Oclif, Citty
- **Python**: Click, Typer, argparse
- **Go**: Cobra, CLI, flag
- **Rust**: Clap, structopt
- **Deno**: Built-in CLI
- **Java**: Picocli, JCommander
- **C#**: System.CommandLine
- **PHP**: Symfony Console, Laravel Artisan
- **Ruby**: Thor, OptionParser
- **Shell**: Bash, Zsh, PowerShell

### **Citty-Specific Utilities (GitVan Projects)**

For GitVan projects using Citty, **citty-test-utils** provides specialized utilities:

- **Smart Project Detection**: Automatically finds GitVan project root from any directory
- **Local Runner**: Execute CLI commands locally with timeout and environment support
- **Docker Cleanroom**: Isolated testing in Docker containers using testcontainers
- **Fluent Assertions**: Chainable expectation API with detailed error messages
- **Scenario DSL**: Complex multi-step test workflows with retry mechanisms
- **Pre-built Scenarios**: Ready-to-use test templates for common workflows
- **Snapshot Testing**: Capture and compare CLI output for regression testing
- **Cross-Environment**: Test consistency between local and cleanroom environments

## 🎯 The Noun-Verb Pattern

**citty-test-utils** introduces a revolutionary approach to CLI testing with the **noun-verb pattern**:

```bash
ctu <noun> <verb> [options]
```

This intuitive structure makes CLI testing as natural as speaking:

- **`ctu test run`** - Run your test scenarios
- **`ctu gen project`** - Generate a new CLI project
- **`ctu runner execute`** - Execute external commands
- **`ctu info version`** - Get version information

## 🚀 Quick Start

### Installation

```bash
npm install citty-test-utils
```

### Universal CLI Testing (Any Framework)

```javascript
import { 
  LocalRunner, 
  DockerRunner, 
  nodeAdapter, 
  pythonAdapter, 
  goAdapter,
  createUniversalRunner,
  expect,
  scenario
} from 'citty-test-utils'

// Test any Node.js CLI
const nodeRunner = createUniversalRunner(nodeAdapter('src/cli.mjs'), new LocalRunner())
const result = await nodeRunner.run(['--help'])
expect(result).expectSuccess().expectOutput(/usage/i).assert()

// Test any Python CLI
const pythonRunner = createUniversalRunner(pythonAdapter('cli'), new DockerRunner())
await pythonRunner.run(['--version'])

// Test any Go CLI
const goRunner = createUniversalRunner(goAdapter('./dist/app'), new LocalRunner())
await goRunner.run(['--help'])
```

### Citty-Specific Testing (GitVan Projects)

```javascript
import { 
  runLocalCitty, 
  setupCleanroom, 
  runCitty, 
  teardownCleanroom,
  scenario,
  scenarios
} from 'citty-test-utils'

// Local testing with automatic project detection
const result = await runLocalCitty(['--help'])
result.expectSuccess().expectOutput('USAGE').expectNoStderr()

// Docker cleanroom testing
await setupCleanroom({ rootDir: '.' })
const cleanResult = await runCitty(['--version'])
cleanResult.expectSuccess().expectOutput(/\d+\.\d+\.\d+/)
await teardownCleanroom()

// Scenario DSL for complex workflows
const scenarioResult = await scenario('Complete workflow')
  .step('Get help')
  .run('--help')
  .expectSuccess()
  .expectOutput('USAGE')
  .step('Get version')
  .run('--version')
  .expectSuccess()
  .expectOutput(/\d+\.\d+\.\d+/)
  .execute('local')

// Pre-built scenarios
await scenarios.help().execute('local')
await scenarios.version().execute('local')
await scenarios.invalidCommand().execute('local')
```

### The Noun-Verb Commands

```bash
# Test your CLI applications
ctu test run                    # Run all test scenarios
ctu test run --scenario help    # Run specific scenario
ctu test help                   # Get test help
ctu test version                # Test version command

# Generate templates and projects
ctu gen project my-cli          # Generate complete CLI project
ctu gen test my-test            # Generate test file
ctu gen scenario my-scenario    # Generate scenario file
ctu gen cli my-cli              # Generate CLI file
ctu gen config my-config        # Generate config file

# Execute external commands
ctu runner execute "node --version"           # Execute locally
ctu runner execute "npm test" --environment cleanroom  # Execute in Docker

# Get information
ctu info version               # Show version
ctu info features              # List features
ctu info config                # Show configuration
ctu info all                   # Show everything
```

## 🏗️ Universal Contract Examples

### **Cross-Language CLI Testing**

```javascript
import { 
  LocalRunner, 
  nodeAdapter, 
  pythonAdapter, 
  goAdapter,
  createUniversalRunner,
  expect
} from 'citty-test-utils'

// Test Node.js CLI
const nodeRunner = createUniversalRunner(nodeAdapter('src/cli.mjs'), new LocalRunner())
await nodeRunner.run(['--help'])

// Test Python CLI  
const pythonRunner = createUniversalRunner(pythonAdapter('cli'), new LocalRunner())
await pythonRunner.run(['--version'])

// Test Go CLI
const goRunner = createUniversalRunner(goAdapter('./dist/app'), new LocalRunner())
await goRunner.run(['--json'])
```

### **Docker Cleanroom Testing**

```javascript
import { DockerRunner, nodeAdapter, createUniversalRunner } from 'citty-test-utils'

const runner = new DockerRunner({
  image: 'node:20-alpine',
  networkPolicy: 'none', // No network access
  mounts: [{ source: process.cwd(), target: '/app' }]
})

await runner.setup()
const universalRunner = createUniversalRunner(nodeAdapter('src/cli.mjs'), runner)

const result = await universalRunner.run(['--help'])
expect(result).expectSuccess().expectNoStderr().assert()

await runner.teardown()
```

### **PTY Interactive Testing**

```javascript
import { LocalRunner, nodeAdapter, createUniversalRunner } from 'citty-test-utils'

const runner = new LocalRunner()
const universalRunner = createUniversalRunner(nodeAdapter('src/cli.mjs'), runner)

// Interactive login scenario
const script = 'username\npassword\n'
const result = await universalRunner.runPty(['login'], script)
expect(result).expectSuccess().expectOutput(/welcome/i).assert()
```

### **Matrix Testing**

```javascript
import { matrix, DockerRunner, goAdapter, createUniversalRunner } from 'citty-test-utils'

const axes = {
  goVersion: ['1.19', '1.20', '1.21'],
  os: ['linux', 'alpine']
}

const results = await matrix(axes, async (context) => {
  const runner = new DockerRunner({
    image: `golang:${context.goVersion}-${context.os}`
  })
  
  await runner.setup()
  const universalRunner = createUniversalRunner(goAdapter('./dist/app'), runner)
  
  const result = await universalRunner.run(['--version'])
  expect(result).expectSuccess().assert()
  
  await runner.teardown()
  return { context, success: true }
})
```

### **Scenario Packs**

```javascript
import { 
  LocalRunner, 
  nodeAdapter, 
  createUniversalRunner,
  helpScenario,
  versionScenario,
  jsonModeScenario
} from 'citty-test-utils'

const runner = new LocalRunner()
const universalRunner = createUniversalRunner(nodeAdapter('src/cli.mjs'), runner)

// Use pre-built scenarios
await helpScenario().execute(universalRunner.getRunner())
await versionScenario().execute(universalRunner.getRunner())
await jsonModeScenario().execute(universalRunner.getRunner())
```

### **Custom Scenarios**

```javascript
import { scenario, LocalRunner, nodeAdapter, createUniversalRunner } from 'citty-test-utils'

const runner = new LocalRunner()
const universalRunner = createUniversalRunner(nodeAdapter('src/cli.mjs'), runner)

const customScenario = scenario('Complete Workflow')
  .step('Initialize', async (runner) => {
    return await runner.exec(['init', '--force'])
  })
  .step('Configure', async (runner) => {
    return await runner.exec(['config', 'set', 'key', 'value'])
  })
  .step('Verify', async (runner) => {
    const result = await runner.exec(['config', 'get', 'key'])
    expect(result).expectSuccess().expectOutput('value').assert()
    return result
  })
  .retries(3)
  .timeout(30000)

const result = await customScenario.execute(universalRunner.getRunner())
console.log('Scenario success:', result.success)
```

### **Report Generation**

```javascript
import { createReporter, TestReport } from 'citty-test-utils'

const report = new TestReport({
  suites: [{
    name: 'CLI Tests',
    tests: [
      { name: 'Help Command', passed: true, durationMs: 150 },
      { name: 'Version Command', passed: true, durationMs: 120 }
    ],
    stats: { pass: 2, fail: 0, skip: 0 }
  }],
  stats: { pass: 2, fail: 0, skip: 0, durationMs: 270 }
})

// Generate reports in multiple formats
const jsonReporter = createReporter('json')
const htmlReporter = createReporter('html')
const junitReporter = createReporter('junit')

await jsonReporter.write(report, 'test-results.json')
await htmlReporter.write(report, 'test-results.html')
await junitReporter.write(report, 'test-results.xml')
```

## 🌟 Why Universal Contract?

### **Framework Agnostic**
Test any CLI in any language with the same API:
- **Node.js**: `nodeAdapter('src/cli.mjs')`
- **Python**: `pythonAdapter('cli')`
- **Go**: `goAdapter('./dist/app')`
- **Rust**: `rustAdapter('./target/release/app')`

### **Environment Agnostic**
Run tests in any environment:
- **Local**: Direct process execution
- **Docker**: Isolated container testing
- **SSH**: Remote environment testing
- **Podman**: Alternative container runtime

### **Deterministic**
Consistent results across all environments:
- Fixed timezone (UTC)
- Fixed locale (C)
- Network policies
- File system isolation

### **Comprehensive**
Full artifact tracking:
- Process output (stdout, stderr)
- File system changes
- Environment variables
- Execution duration
- Exit codes

## 🎮 Programmatic Usage

While the noun-verb CLI is the star, you can also use the framework programmatically:

```javascript
import { 
  LocalRunner, 
  DockerRunner, 
  nodeAdapter, 
  pythonAdapter,
  createUniversalRunner,
  expect,
  scenario,
  matrix,
  createReporter
} from 'citty-test-utils'

// Cross-language testing
const languages = [
  { name: 'Node.js', adapter: nodeAdapter('src/cli.mjs') },
  { name: 'Python', adapter: pythonAdapter('cli') }
]

const runner = new LocalRunner()

for (const lang of languages) {
  const universalRunner = createUniversalRunner(lang.adapter, runner)
  
  const result = await universalRunner.run(['--help'])
  expect(result).expectSuccess().assert()
  
  console.log(`✅ ${lang.name} CLI test passed`)
}

await runner.teardown()
```

## 🔧 Advanced Features

### **Network Policies**
```javascript
const runner = new DockerRunner({
  networkPolicy: 'none' // No network access
})

// Or
const runner = new DockerRunner({
  networkPolicy: 'offline' // Fail if network used
})
```

### **File System Tracking**
```javascript
const result = await universalRunner.run(['generate', 'file.txt'])
expect(result)
  .expectSuccess()
  .expectFileExists('file.txt')
  .expectFileModified('config.json')
  .assert()
```

### **PTY Interactive Mode**
```javascript
const script = `
username
password
y
`
const result = await universalRunner.runPty(['login'], script)
expect(result).expectSuccess().expectOutput(/welcome/i).assert()
```

### **Matrix Testing**
```javascript
const axes = {
  nodeVersion: ['18', '20'],
  os: ['linux', 'macos', 'windows']
}

const results = await matrix(axes, async (context) => {
  // Test with specific Node version and OS
  const runner = new DockerRunner({
    image: `node:${context.nodeVersion}-${context.os}`
  })
  
  await runner.setup()
  const universalRunner = createUniversalRunner(nodeAdapter('src/cli.mjs'), runner)
  
  const result = await universalRunner.run(['--version'])
  expect(result).expectSuccess().assert()
  
  await runner.teardown()
  return { context, success: true }
})
```

## 📦 Installation & Setup

### **Global Installation**
```bash
npm install -g citty-test-utils
ctu info version
```

### **Local Installation**
```bash
npm install citty-test-utils
npx ctu info version
```

### **In Your Project**
```bash
npm install citty-test-utils
# Add to package.json scripts:
"test:cli": "ctu test run"
"test:matrix": "ctu test run --matrix"
"gen:project": "ctu gen project"
```

## 🎯 Use Cases

### **Multi-Language CLI Testing**
```javascript
// Test CLI in multiple languages
const adapters = {
  node: nodeAdapter('src/cli.mjs'),
  python: pythonAdapter('cli'),
  go: goAdapter('./dist/app')
}

for (const [lang, adapter] of Object.entries(adapters)) {
  const runner = createUniversalRunner(adapter, new LocalRunner())
  await runner.run(['--help'])
  console.log(`✅ ${lang} CLI tested`)
}
```

### **Cross-Platform Testing**
```javascript
// Test across different operating systems
const osImages = ['node:20-alpine', 'node:20-bullseye', 'node:20-slim']
for (const image of osImages) {
  const runner = new DockerRunner({ image })
  await runner.setup()
  // Run tests...
  await runner.teardown()
}
```

### **Performance Benchmarking**
```javascript
// Benchmark CLI performance
const iterations = 100
const results = []

for (let i = 0; i < iterations; i++) {
  const start = Date.now()
  await universalRunner.run(['--help'])
  results.push(Date.now() - start)
}

const avgDuration = results.reduce((a, b) => a + b, 0) / results.length
console.log(`Average duration: ${avgDuration}ms`)
```

### **CI/CD Integration**
```javascript
// Generate reports for CI
const report = new TestReport({
  suites: testResults,
  stats: { pass: 10, fail: 2, skip: 1, durationMs: 5000 }
})

const junitReporter = createReporter('junit')
await junitReporter.write(report, 'test-results.xml')
```

## 🏆 Benefits

- **🌍 Universal**: Test any CLI in any language
- **🎯 Intuitive**: Natural language commands
- **🔄 Consistent**: Same pattern everywhere
- **🚀 Fast**: Optimized for speed
- **🐳 Isolated**: Docker cleanroom support
- **📝 Generative**: Template-based file generation
- **🧪 Testable**: Built-in testing framework
- **📊 Informative**: Rich information commands
- **🔒 Deterministic**: Consistent results across environments
- **📈 Scalable**: Matrix testing and parallel execution

## 📚 Documentation

- [Universal Contract Guide](docs/guides/universal-contract.md)
- [Adapter Development](docs/guides/adapters.md)
- [Matrix Testing](docs/guides/matrix-testing.md)
- [PTY Interactive Testing](docs/guides/pty-testing.md)
- [Report Generation](docs/guides/reporting.md)
- [API Reference](docs/api/README.md)
- [Examples](docs/examples/README.md)

## 🤝 Contributing

Contributions are welcome! Please see the [GitVan repository](https://github.com/seanchatmangpt/gitvan) for contribution guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Ready to revolutionize your CLI testing?** Install `citty-test-utils` and experience the power of universal CLI testing!

```bash
npm install citty-test-utils
ctu info version
```

## 🚀 Quick Start

### Installation

```bash
npm install citty-test-utils
```

### The Noun-Verb Commands

```bash
# Test your CLI applications
ctu test run                    # Run all test scenarios
ctu test run --scenario help    # Run specific scenario
ctu test help                   # Get test help
ctu test version                # Test version command

# Generate templates and projects
ctu gen project my-cli          # Generate complete CLI project
ctu gen test my-test            # Generate test file
ctu gen scenario my-scenario    # Generate scenario file
ctu gen cli my-cli              # Generate CLI file
ctu gen config my-config        # Generate config file

# Execute external commands
ctu runner execute "node --version"           # Execute locally
ctu runner execute "npm test" --environment cleanroom  # Execute in Docker

# Get information
ctu info version               # Show version
ctu info features              # List features
ctu info config                # Show configuration
ctu info all                   # Show everything
```

## 🏗️ The Four Nouns

### 1. **`test`** - Testing & Validation
Test your CLI applications with comprehensive scenarios:

```bash
ctu test run                    # Run all scenarios
ctu test run --scenario help    # Run specific scenario
ctu test help                   # Show test help
ctu test version                # Test version command
ctu test error timeout          # Test error scenarios
```

### 2. **`gen`** - Template Generation
Generate files and projects from templates:

```bash
ctu gen project my-cli          # Complete CLI project
ctu gen test my-test            # Test file template
ctu gen scenario my-scenario    # Scenario template
ctu gen cli my-cli              # CLI file template
ctu gen config my-config        # Config file template
```

### 3. **`runner`** - Command Execution
Execute external commands with isolation:

```bash
ctu runner execute "node --version"                    # Local execution
ctu runner execute "npm test" --environment cleanroom  # Docker execution
ctu runner execute "ls -la" --timeout 5000             # Custom timeout
```

### 4. **`info`** - Information & Discovery
Get information about the CLI and environment:

```bash
ctu info version               # Version information
ctu info features              # Available features
ctu info config                # Configuration details
ctu info all                   # Complete information
```

## 🎮 Programmatic Usage

While the noun-verb CLI is the star, you can also use the framework programmatically:

```javascript
import { runLocalCitty, setupCleanroom, runCitty, teardownCleanroom } from 'citty-test-utils'

// Local testing
const result = await runLocalCitty(['--help'], { 
  cwd: './playground',
  env: { TEST_CLI: 'true' }
})
result.expectSuccess().expectOutput('USAGE').expectNoStderr()

// Docker cleanroom testing
await setupCleanroom({ rootDir: './playground' })
const cleanResult = await runCitty(['--version'], {
  env: { TEST_CLI: 'true' }
})
cleanResult.expectSuccess().expectOutput(/\d+\.\d+\.\d+/)
await teardownCleanroom()
```

## 🌟 Why Noun-Verb?

### **Intuitive & Memorable**
```bash
# Instead of complex flags and options:
citty-test-utils --run-tests --scenario=help --environment=local

# Use natural language:
ctu test run --scenario help
```

### **Consistent & Predictable**
Every command follows the same pattern:
- **Noun**: What you want to do (`test`, `gen`, `runner`, `info`)
- **Verb**: How you want to do it (`run`, `project`, `execute`, `version`)

### **Extensible & Discoverable**
```bash
ctu <noun> --help    # Discover verbs for any noun
ctu test --help      # See all test verbs
ctu gen --help       # See all generation verbs
```

## 🔧 Advanced Features

### **Docker Cleanroom Testing**
```bash
# Test in isolated Docker containers
ctu runner execute "npm test" --environment cleanroom
ctu gen project my-cli --environment cleanroom  # Files stay in container
```

### **Template Generation**
```bash
# Generate complete projects
ctu gen project my-cli
# Creates: package.json, src/cli.mjs, tests/, templates/, etc.

# Generate individual files
ctu gen test my-test
ctu gen scenario my-scenario
ctu gen cli my-cli
```

### **Fluent Assertions**
```javascript
const result = await runLocalCitty(['--help'])
result
  .expectSuccess()                    // expectExit(0)
  .expectOutput('USAGE')              // String match
  .expectOutput(/gitvan/)             // Regex match
  .expectNoStderr()                   // Expect empty stderr
  .expectOutputLength(100, 5000)      // Length range validation
```

### **Scenario DSL**
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
  .execute('local')
```

## 📦 Installation & Setup

### **Global Installation**
```bash
npm install -g citty-test-utils
ctu info version
```

### **Local Installation**
```bash
npm install citty-test-utils
npx ctu info version
```

### **In Your Project**
```bash
npm install citty-test-utils
# Add to package.json scripts:
"test:cli": "ctu test run"
"gen:project": "ctu gen project"
```

## 🎯 Use Cases

### **CLI Development**
```bash
# Generate a new CLI project
ctu gen project my-awesome-cli

# Test your CLI
ctu test run
ctu test run --scenario help
ctu test run --scenario version
```

### **Template Generation**
```bash
# Generate test files
ctu gen test user-authentication
ctu gen test api-integration

# Generate scenarios
ctu gen scenario login-flow
ctu gen scenario data-migration
```

### **Command Execution**
```bash
# Test external commands
ctu runner execute "docker --version"
ctu runner execute "git status" --environment cleanroom

# Test with custom timeouts
ctu runner execute "npm install" --timeout 30000
```

### **Information Gathering**
```bash
# Get CLI information
ctu info version
ctu info features
ctu info config

# Debug environment
ctu info all
```

## 🔍 Examples

### **Complete CLI Project Generation**
```bash
ctu gen project my-cli
# Generates:
# ├── package.json
# ├── src/cli.mjs
# ├── tests/
# ├── templates/
# └── README.md
```

### **Test Scenario Execution**
```bash
ctu test run
# Runs all available test scenarios

ctu test run --scenario help
# Runs only the help scenario
```

### **Cross-Environment Testing**
```bash
# Local testing
ctu runner execute "node --version"

# Cleanroom testing (Docker)
ctu runner execute "node --version" --environment cleanroom
```

## 🏆 Benefits

- **🎯 Intuitive**: Natural language commands
- **🔄 Consistent**: Same pattern everywhere
- **🚀 Fast**: Optimized for speed
- **🐳 Isolated**: Docker cleanroom support
- **📝 Generative**: Template-based file generation
- **🧪 Testable**: Built-in testing framework
- **📊 Informative**: Rich information commands

## 📚 Documentation

- [Getting Started Guide](docs/guides/getting-started.md)
- [Best Practices](docs/guides/best-practices.md)
- [API Reference](docs/api/README.md)
- [Examples](docs/examples/README.md)

## 🤝 Contributing

Contributions are welcome! Please see the [GitVan repository](https://github.com/seanchatmangpt/gitvan) for contribution guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Ready to revolutionize your CLI testing?** Install `citty-test-utils` and experience the power of the noun-verb pattern!

```bash
npm install citty-test-utils
ctu info version
```