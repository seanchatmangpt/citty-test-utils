# Vitest Config Integration - Implementation Guide
## Practical Code Patterns for citty-test-utils v1.0.0

**Date:** 2025-10-02
**Status:** Ready to Implement

---

## Quick Reference

### Three Ways to Configure citty-test-utils

| Method | User Experience | Vitest Version | Performance |
|--------|----------------|----------------|-------------|
| **Extended Test** | Best (auto-inject) | 3.0+ | ⚡ Fast (fixtures) |
| **Provide/Inject** | Good (manual inject) | Any | ⚡ Fast (serialized) |
| **Auto-Discovery** | Transparent | Any | 🐌 Slower (dynamic import) |

---

## Pattern 1: Extended Test with Fixtures ⭐ RECOMMENDED

### Implementation

**File: `src/vitest/citty-test.js`**

```javascript
/**
 * Extended test with citty-specific fixtures
 * @module citty-test-utils/vitest
 */

import { test as base } from 'vitest'
import { runLocalCitty } from '../core/runners/local-runner.js'

/**
 * Citty-enhanced test with automatic configuration
 *
 * @example
 * // vitest.config.js
 * export default defineConfig({
 *   test: {
 *     provide: {
 *       cliPath: './dist/cli.js',
 *       timeout: 60000
 *     }
 *   }
 * })
 *
 * // test.js
 * import { test } from 'citty-test-utils/vitest'
 *
 * test('my test', async ({ cittyRunner }) => {
 *   const result = await cittyRunner.run(['--help'])
 *   result.expectSuccess()
 * })
 */
export const test = base.extend({
  /**
   * CLI path fixture
   * Can be overridden in vitest.config.js via provide.cliPath
   */
  cliPath: [
    async ({}, use) => {
      const path =
        process.env.TEST_CLI_PATH ||
        process.env.CLI_PATH ||
        './src/cli.mjs'
      await use(path)
    },
    { injected: true },
  ],

  /**
   * Timeout fixture
   * Can be overridden in vitest.config.js via provide.timeout
   */
  timeout: [30000, { injected: true }],

  /**
   * Working directory fixture
   * Can be overridden in vitest.config.js via provide.cwd
   */
  cwd: [
    async ({}, use) => {
      const workingDir = process.env.TEST_CWD || process.cwd()
      await use(workingDir)
    },
    { injected: true },
  ],

  /**
   * Environment variables fixture
   * Can be overridden in vitest.config.js via provide.testEnv
   */
  testEnv: [
    {
      TEST_CLI: 'true',
      NODE_ENV: 'test',
    },
    { injected: true },
  ],

  /**
   * Pre-configured runner fixture
   * Uses other fixtures to create a ready-to-use runner
   */
  cittyRunner: async ({ cliPath, timeout, cwd, testEnv }, use) => {
    const runner = {
      /**
       * Run CLI with automatic config
       * @param {string[]} args - CLI arguments
       * @param {object} options - Override options
       */
      run: async (args, options = {}) => {
        return runLocalCitty({
          args,
          cliPath: options.cliPath || cliPath,
          timeout: options.timeout || timeout,
          cwd: options.cwd || cwd,
          env: { ...testEnv, ...options.env },
        })
      },

      /**
       * Run CLI and expect success
       */
      runSuccess: async (args, options = {}) => {
        const result = await runner.run(args, options)
        return result.expectSuccess()
      },

      /**
       * Run CLI and expect failure
       */
      runFailure: async (args, expectedCode, options = {}) => {
        const result = await runner.run(args, options)
        return expectedCode
          ? result.expectExit(expectedCode)
          : result.expectFailure()
      },
    }

    await use(runner)
  },

  /**
   * Scenario builder fixture
   * Pre-configured with fixtures
   */
  cittyScenario: async ({ cliPath, timeout, cwd, testEnv }, use) => {
    const { scenario } = await import('../core/scenarios/scenario-dsl.js')

    const builder = (name) => {
      const s = scenario(name)

      // Override run to use fixtures
      const originalRun = s.run.bind(s)
      s.run = function (args, options = {}) {
        const mergedOptions = {
          cliPath: options.cliPath || cliPath,
          timeout: options.timeout || timeout,
          cwd: options.cwd || cwd,
          env: { ...testEnv, ...options.env },
        }

        // Support multiple signatures
        if (typeof args === 'string') {
          return originalRun(args.split(' '), mergedOptions)
        }
        if (Array.isArray(args)) {
          return originalRun(args, mergedOptions)
        }
        if (typeof args === 'object') {
          return originalRun({ ...mergedOptions, ...args })
        }

        return originalRun(args, mergedOptions)
      }

      return s
    }

    await use(builder)
  },
})

// Re-export expect for convenience
export { expect } from 'vitest'
```

### User Configuration

**File: `vitest.config.js` (User's project)**

```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Provide custom values for citty fixtures
    provide: {
      // Override CLI path
      cliPath: './dist/cli.js',

      // Override timeout
      timeout: 60000,

      // Override working directory
      cwd: '/absolute/path/to/project',

      // Override environment variables
      testEnv: {
        TEST_CLI: 'true',
        NODE_ENV: 'test',
        DEBUG: 'citty:*',
      },
    },
  },
})
```

### Usage Examples

**Example 1: Basic Test**

```javascript
import { test, expect } from 'citty-test-utils/vitest'

test('should show help', async ({ cittyRunner }) => {
  const result = await cittyRunner.run(['--help'])

  result
    .expectSuccess()
    .expectOutput(/USAGE/)
    .expectOutput(/Commands:/)
})

test('shows configured CLI path', async ({ cliPath }) => {
  console.log('Testing CLI at:', cliPath)
  expect(cliPath).toBe('./dist/cli.js') // from config
})
```

**Example 2: Per-Test Override**

```javascript
import { test } from 'citty-test-utils/vitest'

test('override CLI path', async ({ cittyRunner }) => {
  // Use different CLI for this test
  const result = await cittyRunner.run(['--version'], {
    cliPath: './custom/cli.js',
    timeout: 5000,
  })

  result.expectSuccess()
})
```

**Example 3: Using All Fixtures**

```javascript
import { test } from 'citty-test-utils/vitest'

test('full fixture access', async ({
  cittyRunner,
  cliPath,
  timeout,
  cwd,
  testEnv,
}) => {
  console.log('Config:', { cliPath, timeout, cwd, testEnv })

  const result = await cittyRunner.run(['build'], {
    env: { ...testEnv, BUILD_MODE: 'production' },
  })

  result.expectSuccess()
})
```

**Example 4: Scenario with Fixtures**

```javascript
import { test } from 'citty-test-utils/vitest'

test('scenario workflow', async ({ cittyScenario }) => {
  const result = await cittyScenario('E2E Workflow')
    .step('Show help')
    .run(['--help'])
    .expectSuccess()

    .step('Initialize project')
    .run(['init', 'my-app'])
    .expectSuccess()
    .expectOutput('initialized')

    .execute('local')

  expect(result.success).toBe(true)
})
```

---

## Pattern 2: Provide/Inject (Backward Compatible)

### Implementation

**No code changes needed in citty-test-utils!**
This is a built-in Vitest feature.

### User Configuration

**File: `vitest.config.js`**

```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    provide: {
      // Option 1: Flat structure
      cliPath: './dist/cli.js',
      cittyTimeout: 60000,

      // Option 2: Nested object
      citty: {
        cliPath: './dist/cli.js',
        timeout: 60000,
        env: {
          TEST_CLI: 'true',
        },
      },
    },
  },
})
```

### Usage

**Example: Manual Inject**

```javascript
import { test, expect, inject } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'

test('using inject', async () => {
  // Option 1: Flat inject
  const cliPath = inject('cliPath')
  const timeout = inject('cittyTimeout')

  // Option 2: Nested inject
  const cittyConfig = inject('citty')

  const result = await runLocalCitty({
    args: ['--help'],
    cliPath: cittyConfig.cliPath,
    timeout: cittyConfig.timeout,
  })

  result.expectSuccess()
})
```

**Example: Helper Wrapper**

```javascript
// test/helpers/citty-helpers.js
import { inject } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'

export function getCittyConfig() {
  try {
    return inject('citty')
  } catch {
    return {
      cliPath: './src/cli.mjs',
      timeout: 30000,
      env: { TEST_CLI: 'true' },
    }
  }
}

export async function runCLI(args, options = {}) {
  const config = getCittyConfig()
  return runLocalCitty({
    args,
    ...config,
    ...options,
  })
}

// test/example.test.js
import { test } from 'vitest'
import { runCLI } from './helpers/citty-helpers.js'

test('simplified API', async () => {
  const result = await runCLI(['--help'])
  result.expectSuccess()
})
```

### TypeScript Support

**File: `test/vitest.d.ts`**

```typescript
declare module 'vitest' {
  export interface ProvidedContext {
    // Flat structure
    cliPath?: string
    cittyTimeout?: number

    // Nested structure
    citty?: {
      cliPath: string
      timeout: number
      env: Record<string, string>
    }
  }
}

export {}
```

---

## Pattern 3: Auto-Discovery (Transparent)

### Implementation

**File: `src/vitest/config-resolver.js`**

```javascript
/**
 * Vitest config resolution for citty-test-utils
 * @module citty-test-utils/vitest/config-resolver
 */

import { pathToFileURL } from 'node:url'
import { resolve, parse } from 'node:path'
import { existsSync } from 'node:fs'

// Config file search order
const CONFIG_FILES = [
  'vitest.config.js',
  'vitest.config.mjs',
  'vitest.config.ts',
  'vitest.config.mts',
  'vite.config.js',
  'vite.config.mjs',
  'vite.config.ts',
  'vite.config.mts',
]

// Cache loaded configs
const configCache = new Map()

/**
 * Try to load config from a specific directory
 */
async function tryLoadConfig(dir) {
  for (const configFile of CONFIG_FILES) {
    const configPath = resolve(dir, configFile)

    if (existsSync(configPath)) {
      try {
        // Handle TypeScript configs
        if (configPath.endsWith('.ts') || configPath.endsWith('.mts')) {
          // Try to use vite-node or tsx if available
          try {
            const { loadConfigFromFile } = await import('vite')
            const loaded = await loadConfigFromFile(
              { command: 'serve', mode: 'test' },
              configPath
            )
            if (loaded) return { config: loaded.config, path: configPath }
          } catch {
            // Fallback: skip TS configs if vite not available
            continue
          }
        }

        // Dynamic import for JS/MJS
        const configUrl = pathToFileURL(configPath).href
        const module = await import(configUrl)
        const config = module.default

        // Handle function configs
        const resolved =
          typeof config === 'function'
            ? await config({ mode: 'test', command: 'serve' })
            : config

        return { config: resolved, path: configPath }
      } catch (error) {
        console.warn(`Failed to load ${configFile}:`, error.message)
      }
    }
  }

  return null
}

/**
 * Extract citty config from vitest config
 */
function extractCittyConfig(config) {
  // Check multiple possible locations
  return (
    config?.test?.citty || // Custom citty section
    config?.test?.provide?.citty || // Via provide.citty
    {} // Empty fallback
  )
}

/**
 * Load vitest config from project root (with upward search)
 *
 * @param {string} startPath - Starting directory
 * @returns {Promise<{config: object|null, path: string|null, citty: object}>}
 */
export async function loadVitestConfig(startPath = process.cwd()) {
  // Check cache first
  if (configCache.has(startPath)) {
    return configCache.get(startPath)
  }

  let currentPath = startPath
  const root = parse(currentPath).root

  // Search upward until root
  while (currentPath !== root) {
    const loaded = await tryLoadConfig(currentPath)

    if (loaded) {
      const result = {
        config: loaded.config,
        path: loaded.path,
        citty: extractCittyConfig(loaded.config),
      }

      // Cache result
      configCache.set(startPath, result)
      return result
    }

    // Move up one directory
    currentPath = resolve(currentPath, '..')
  }

  // No config found
  const result = { config: null, path: null, citty: {} }
  configCache.set(startPath, result)
  return result
}

/**
 * Get citty-specific config with defaults
 *
 * @param {string} cwd - Working directory
 * @returns {Promise<CittyConfig>}
 */
export async function getCittyConfig(cwd = process.cwd()) {
  const { citty } = await loadVitestConfig(cwd)

  // Merge with environment variables and defaults
  return {
    cliPath:
      citty.cliPath || process.env.TEST_CLI_PATH || './src/cli.mjs',
    timeout: citty.timeout || Number(process.env.TEST_TIMEOUT) || 30000,
    cwd: citty.cwd || cwd,
    env: {
      TEST_CLI: 'true',
      ...citty.env,
    },
    // Pass through any other custom config
    ...citty,
  }
}

/**
 * Clear config cache (useful for testing)
 */
export function clearConfigCache() {
  configCache.clear()
}

/**
 * @typedef {Object} CittyConfig
 * @property {string} cliPath - Path to CLI entry point
 * @property {number} timeout - Test timeout in ms
 * @property {string} cwd - Working directory
 * @property {Record<string, string>} env - Environment variables
 */
```

### Integration with Runners

**File: `src/core/runners/local-runner.js` (Enhanced)**

```javascript
import { getCittyConfig } from '../vitest/config-resolver.js'
import { validateRunOptions } from '../utils/input-validator.js'
// ... existing imports

/**
 * Run Citty CLI locally with auto-config
 *
 * @param {object} options - Run options
 * @param {string[]} options.args - CLI arguments (REQUIRED)
 * @param {string} [options.cliPath] - Path to CLI (auto-detected if omitted)
 * @param {string} [options.cwd] - Working directory
 * @param {number} [options.timeout] - Timeout in ms
 * @param {object} [options.env] - Environment variables
 * @returns {Promise<AssertionResult>}
 */
export async function runLocalCitty(options) {
  // Load config from vitest.config.js if needed
  let finalOptions = { ...options }

  // Only auto-load if critical fields missing
  if (!options.cliPath || !options.cwd) {
    const autoConfig = await getCittyConfig(options.cwd)

    finalOptions = {
      ...autoConfig, // Defaults from config
      ...options, // User options override
    }
  }

  // Validate merged options
  validateRunOptions(finalOptions)

  // Execute CLI
  return executeLocalCli(finalOptions)
}

// ... rest of implementation
```

### User Configuration

**File: `vitest.config.js`**

```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Option 1: Use custom citty section
    citty: {
      cliPath: './dist/cli.js',
      timeout: 60000,
      env: {
        TEST_CLI: 'true',
        DEBUG: 'citty:*',
      },
    },

    // Option 2: Use provide section
    provide: {
      citty: {
        cliPath: './dist/cli.js',
        timeout: 60000,
      },
    },
  },
})
```

### Usage

**Example: Zero-Config**

```javascript
import { test } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'

test('auto-configured test', async () => {
  // Config automatically loaded from vitest.config.js
  const result = await runLocalCitty({
    args: ['--help'],
    // cliPath, timeout, cwd auto-detected!
  })

  result.expectSuccess()
})
```

**Example: Partial Config**

```javascript
import { test } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'

test('override specific options', async () => {
  const result = await runLocalCitty({
    args: ['build'],
    // cliPath and cwd from config
    timeout: 120000, // Override just timeout
  })

  result.expectSuccess()
})
```

---

## Comparison Matrix

| Feature | Extended Test | Provide/Inject | Auto-Discovery |
|---------|---------------|----------------|----------------|
| **Auto-injection** | ✅ Yes | ❌ No | ✅ Yes |
| **Type-safe** | ✅ Full | ⚠️ Partial | ⚠️ Partial |
| **Performance** | ⚡ Fast | ⚡ Fast | 🐌 Slower |
| **Setup complexity** | Medium | Low | Low |
| **Vitest version** | 3.0+ | Any | Any |
| **Import change** | ✅ Yes | ❌ No | ❌ No |
| **Fixture composition** | ✅ Yes | ❌ No | ❌ No |
| **Per-test override** | ✅ Easy | ⚠️ Manual | ⚠️ Manual |

---

## Migration Examples

### From v0.6.1 to v1.0.0

**Old Code (v0.6.1):**

```javascript
import { test } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'

test('help', async () => {
  const result = await runLocalCitty({
    args: ['--help'],
    cliPath: './src/cli.mjs', // Had to specify every time
    cwd: process.cwd(),
    timeout: 30000,
  })

  result.expectSuccess()
})
```

**New Code (v1.0.0) - Option 1: Extended Test**

```javascript
// vitest.config.js
export default defineConfig({
  test: {
    provide: {
      cliPath: './src/cli.mjs',
    },
  },
})

// test file
import { test } from 'citty-test-utils/vitest'

test('help', async ({ cittyRunner }) => {
  const result = await cittyRunner.run(['--help'])
  result.expectSuccess()
})
```

**New Code (v1.0.0) - Option 2: Auto-Discovery**

```javascript
// vitest.config.js
export default defineConfig({
  test: {
    citty: {
      cliPath: './src/cli.mjs',
    },
  },
})

// test file (no changes!)
import { test } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'

test('help', async () => {
  const result = await runLocalCitty({
    args: ['--help'],
    // Config auto-loaded! ✨
  })

  result.expectSuccess()
})
```

---

## Performance Benchmarks

### Config Loading Time

```javascript
import { performance } from 'node:perf_hooks'
import { getCittyConfig, clearConfigCache } from 'citty-test-utils/vitest'

async function benchmark() {
  // Cold load
  clearConfigCache()
  const start1 = performance.now()
  await getCittyConfig()
  const end1 = performance.now()
  console.log(`Cold load: ${end1 - start1}ms`)

  // Cached load
  const start2 = performance.now()
  await getCittyConfig()
  const end2 = performance.now()
  console.log(`Cached load: ${end2 - start2}ms`)
}

// Expected results:
// Cold load: 10-20ms
// Cached load: 0.1-1ms
```

---

## Best Practices

### 1. Use Extended Test for New Projects

```javascript
// ✅ Recommended
import { test } from 'citty-test-utils/vitest'

test('my test', async ({ cittyRunner }) => {
  const result = await cittyRunner.run(['--help'])
  result.expectSuccess()
})
```

### 2. Use Auto-Discovery for Legacy Projects

```javascript
// ✅ Good for backward compatibility
import { test } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'

test('my test', async () => {
  const result = await runLocalCitty({ args: ['--help'] })
  result.expectSuccess()
})
```

### 3. Always Support Explicit Config

```javascript
// ✅ Always allow explicit override
import { test } from 'citty-test-utils/vitest'

test('explicit config', async ({ cittyRunner }) => {
  const result = await cittyRunner.run(['--help'], {
    cliPath: '/absolute/path/to/cli.js',
    timeout: 5000,
  })
  result.expectSuccess()
})
```

### 4. Use Environment Variables for CI/CD

```bash
# .env.test
TEST_CLI_PATH=./dist/cli.js
TEST_TIMEOUT=60000
TEST_CWD=/app
```

```javascript
// Automatically picked up by config resolver
const config = await getCittyConfig()
console.log(config.cliPath) // './dist/cli.js'
```

---

## Troubleshooting

### Issue: Config Not Loading

**Problem:** `runLocalCitty` doesn't find config

**Solution:**
```javascript
import { loadVitestConfig } from 'citty-test-utils/vitest'

// Debug config loading
const { config, path, citty } = await loadVitestConfig()
console.log('Config path:', path)
console.log('Citty config:', citty)
```

### Issue: TypeScript Errors

**Problem:** Fixtures not typed

**Solution:**
```typescript
// test/vitest.d.ts
import 'citty-test-utils/vitest'

declare module 'vitest' {
  export interface ProvidedContext {
    cliPath: string
    timeout: number
  }
}
```

### Issue: Performance Slow

**Problem:** Config loading in every test

**Solution:**
```javascript
// Use fixtures (cached) instead of getCittyConfig() (dynamic)
import { test } from 'citty-test-utils/vitest'

// ✅ Fast (fixtures cached)
test('fast', async ({ cittyRunner }) => {
  await cittyRunner.run(['--help'])
})

// ❌ Slow (config loaded each time)
import { getCittyConfig } from 'citty-test-utils/vitest'
test('slow', async () => {
  const config = await getCittyConfig()
  await runLocalCitty({ args: ['--help'], ...config })
})
```

---

**End of Implementation Guide**
