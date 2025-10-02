# citty-test-utils

> **v1.0.0** - Unified testing framework for CLI applications with auto-detecting execution modes and vitest config integration

[![npm version](https://img.shields.io/npm/v/citty-test-utils.svg)](https://www.npmjs.com/package/citty-test-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/citty-test-utils.svg)](https://nodejs.org)

## ✨ Features

- 🎯 **Unified API** - Single `runCitty()` function for local and cleanroom modes
- ⚙️ **Config-First** - Configure once in `vitest.config.js`, use everywhere
- 🔄 **Auto-Detection** - Automatically selects local vs Docker based on config
- 📝 **Simplified DSL** - `.step(name, args)` - no more `.run()` calls
- 🐳 **Auto Cleanroom** - Automatic Docker setup/teardown (no manual lifecycle)
- 🧪 **Fluent Assertions** - Chainable test assertions
- 📸 **Snapshot Testing** - Built-in snapshot support
- 🔍 **CLI Coverage** - Analyze command coverage

## 📦 Installation

```bash
npm install --save-dev citty-test-utils vitest
```

**Requirements:**
- Node.js 18+
- Vitest 1.0+
- Docker (optional, for cleanroom mode)

## 🚀 Quick Start

### 1. Configure vitest.config.js

```javascript
// vitest.config.js
export default {
  test: {
    citty: {
      cliPath: './src/cli.mjs',  // Your CLI entry point
      cleanroom: {
        enabled: false  // Set true for Docker isolation
      }
    }
  }
}
```

### 2. Write Tests

```javascript
import { describe, it } from 'vitest'
import { runCitty, scenario } from 'citty-test-utils'

describe('CLI Tests', () => {
  it('shows help', async () => {
    // Config comes from vitest.config.js automatically!
    const result = await runCitty(['--help'])

    result
      .expectSuccess()
      .expectOutput(/USAGE/)
  })

  it('multi-step workflow', async () => {
    await scenario('Build process')
      .step('Check version', '--version').expectSuccess()
      .step('Build prod', ['build', '--prod']).expectSuccess()
      .execute()  // Auto-detects local vs cleanroom
  })
})
```

### 3. Run Tests

```bash
npm test
```

## 🎯 Core API

### runCitty(args, options?)

Unified runner that auto-detects local vs cleanroom mode.

```javascript
import { runCitty } from 'citty-test-utils'

// Basic usage (uses vitest.config.js settings)
const result = await runCitty(['--help'])

// Override config
const result = await runCitty(['test'], {
  cliPath: './custom-cli.js',
  timeout: 60000,
  env: { NODE_ENV: 'production' }
})

// Force cleanroom mode
const result = await runCitty(['build'], {
  cleanroom: { enabled: true }
})
```

**Options:**
- `cliPath` - Path to CLI entry point (defaults from config)
- `cwd` - Working directory (defaults to process.cwd())
- `env` - Environment variables
- `timeout` - Execution timeout in ms
- `cleanroom.enabled` - Force cleanroom mode
- `cleanroom.image` - Docker image (default: 'node:20-alpine')

**Config Hierarchy:**
1. `options` parameter (highest priority)
2. `vitest.config.js` test.citty section
3. Environment variables
4. Smart defaults

### scenario(name)

Simplified scenario DSL for multi-step tests.

```javascript
import { scenario } from 'citty-test-utils'

await scenario('User workflow')
  // v1.0.0 API: args combined with step
  .step('Show help', '--help')
  .expectSuccess()
  .expectOutput(/USAGE/)

  .step('Build project', ['build', '--prod'])
  .expectSuccess()
  .expectOutput('Build complete')

  .step('Run tests', ['test', '--coverage'])
  .expectSuccess()

  .execute()  // Auto-detects mode from config
```

**Methods:**
- `.step(name, args, options?)` - Define test step with args
- `.expectSuccess()` - Assert exit code 0
- `.expectFailure()` - Assert non-zero exit code
- `.expectExit(code)` - Assert specific exit code
- `.expectOutput(pattern)` - Assert stdout matches pattern
- `.expectError(pattern)` - Assert stderr matches pattern
- `.concurrent()` - Run steps in parallel
- `.execute()` - Run scenario (auto-detects mode)

### Fluent Assertions

All results include chainable assertions:

```javascript
result
  .expectSuccess()           // Exit code 0
  .expectFailure()           // Exit code != 0
  .expectExit(1)            // Specific exit code
  .expectOutput(/pattern/)   // Stdout matches
  .expectStderr(/error/)     // Stderr matches
  .expectOutputLength(10)    // Min output length
```

## 📖 Usage Examples

### Example 1: Basic CLI Testing

```javascript
import { describe, it } from 'vitest'
import { runCitty } from 'citty-test-utils'

describe('CLI Basic Tests', () => {
  it('displays version', async () => {
    const result = await runCitty(['--version'])

    result
      .expectSuccess()
      .expectOutput(/\d+\.\d+\.\d+/)
  })

  it('shows help text', async () => {
    const result = await runCitty(['--help'])

    result
      .expectSuccess()
      .expectOutput(/USAGE/)
      .expectOutput(/OPTIONS/)
  })
})
```

### Example 2: Multi-Step Scenarios

```javascript
import { scenario } from 'citty-test-utils'

describe('Project Workflow', () => {
  it('initializes and builds project', async () => {
    await scenario('Full workflow')
      .step('Initialize', ['init', 'my-project'])
      .expectSuccess()
      .expectOutput('Created my-project')

      .step('Install deps', ['install'], { cwd: './my-project' })
      .expectSuccess()

      .step('Build', ['build'], { cwd: './my-project' })
      .expectSuccess()
      .expectOutput('Build complete')

      .execute()
  })
})
```

### Example 3: Cleanroom (Docker) Testing

```javascript
describe('Isolated Tests', () => {
  it('runs in Docker container', async () => {
    // Override config to force cleanroom
    const result = await runCitty(['build', '--prod'], {
      cleanroom: {
        enabled: true,
        image: 'node:20-alpine',
        timeout: 60000
      }
    })

    result.expectSuccess()
  })
})
```

Or configure globally in `vitest.config.js`:

```javascript
export default {
  test: {
    citty: {
      cliPath: './src/cli.mjs',
      cleanroom: {
        enabled: true  // All tests use Docker
      }
    }
  }
}
```

### Example 4: Snapshot Testing

```javascript
import { runCitty, matchSnapshot } from 'citty-test-utils'

describe('Output Snapshots', () => {
  it('matches help output snapshot', async () => {
    const result = await runCitty(['--help'])

    result.expectSuccess()
    matchSnapshot(result.stdout, 'help-output')
  })
})
```

## ⚙️ Configuration

### vitest.config.js

```javascript
export default {
  test: {
    // citty-test-utils configuration
    citty: {
      // Required: CLI entry point
      cliPath: './src/cli.mjs',

      // Optional: working directory
      cwd: process.cwd(),

      // Optional: cleanroom settings
      cleanroom: {
        enabled: false,          // Enable Docker isolation
        image: 'node:20-alpine', // Docker image
        timeout: 30000,          // Timeout in ms
        env: {                   // Environment variables
          NODE_ENV: 'test'
        }
      }
    },

    // Standard vitest config
    globals: true,
    testTimeout: 30000
  }
}
```

### Environment Variables

```bash
# Override cliPath
export TEST_CLI_PATH=./custom-cli.js

# Override working directory
export TEST_CWD=/path/to/project
```

### Config Priority

1. Function `options` parameter (highest)
2. `vitest.config.js` test.citty section
3. Environment variables
4. Defaults (lowest)

## 🔧 Advanced Features

### Auto Cleanroom Lifecycle

No manual setup/teardown needed! Just enable in config:

```javascript
// vitest.config.js
export default {
  test: {
    citty: {
      cleanroom: { enabled: true }
    }
  }
}
```

Tests automatically run in Docker with cleanup:

```javascript
// No beforeAll/afterAll needed!
it('runs isolated', async () => {
  const result = await runCitty(['test'])
  result.expectSuccess()
})
```

### Concurrent Scenarios

```javascript
await scenario('Parallel tests')
  .concurrent()  // Enable parallel execution
  .step('Test 1', 'test-1')
  .step('Test 2', 'test-2')
  .step('Test 3', 'test-3')
  .execute()
```

### Custom Assertions

```javascript
result.expect(result => {
  if (!result.stdout.includes('custom')) {
    throw new Error('Custom check failed')
  }
})
```

## 📊 What's New in v1.0.0

### Breaking Changes ⚠️

1. **Unified API**: `runCitty()` replaces `runLocalCitty()` and cleanroom setup
2. **Scenario DSL**: `.step(name, args)` instead of `.step(name).run(args)`
3. **Config-First**: Configure in `vitest.config.js` instead of every test
4. **Auto Cleanroom**: No manual setup/teardown needed

### Migration from v0.6.x

**Old API (v0.6.x):**
```javascript
import { runLocalCitty, setupCleanroom } from 'citty-test-utils'

await runLocalCitty({
  args: ['--help'],
  cliPath: './src/cli.mjs',
  cwd: process.cwd()
})
```

**New API (v1.0.0):**
```javascript
import { runCitty } from 'citty-test-utils'

// Config from vitest.config.js
await runCitty(['--help'])
```

See [Migration Guide](./docs/v1.0.0-MIGRATION.md) for complete details.

## 🐛 Troubleshooting

### Error: "CLI path not configured"

**Solution:** Add `cliPath` to vitest.config.js:

```javascript
export default {
  test: {
    citty: {
      cliPath: './src/cli.mjs'
    }
  }
}
```

### Error: "Cannot find module"

**Solution:** Check cliPath is correct:

```javascript
const result = await runCitty(['--help'], {
  cliPath: './src/cli.mjs'  // Absolute or relative to cwd
})
```

### Cleanroom not working

**Solution:** Enable in config:

```javascript
export default {
  test: {
    citty: {
      cleanroom: { enabled: true }
    }
  }
}
```

Or per-test:

```javascript
const result = await runCitty(['test'], {
  cleanroom: { enabled: true }
})
```

## 📚 Documentation

- [Migration Guide](./docs/v1.0.0-MIGRATION.md)
- [Release Notes](./docs/v1.0.0-RELEASE.md)
- [Changelog](./CHANGELOG.md)

## 🤝 Contributing

```bash
# Clone repo
git clone https://github.com/seanchatmangpt/citty-test-utils
cd citty-test-utils

# Install deps
npm install

# Run tests
npm test

# Run specific tests
npm run test:unit
npm run test:integration
```

## 📝 License

MIT © [GitVan Team](https://github.com/seanchatmangpt)

## 🙏 Acknowledgments

Built with:
- [Citty](https://github.com/unjs/citty) - CLI framework
- [Vitest](https://vitest.dev) - Test framework
- [Testcontainers](https://node.testcontainers.org/) - Docker integration
- [Zod](https://zod.dev) - Schema validation

---

**Need help?** [Open an issue](https://github.com/seanchatmangpt/citty-test-utils/issues)

**Love citty-test-utils?** Give us a ⭐ on [GitHub](https://github.com/seanchatmangpt/citty-test-utils)!
