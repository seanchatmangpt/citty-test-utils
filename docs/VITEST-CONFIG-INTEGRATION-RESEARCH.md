# Vitest Configuration Integration Research
## citty-test-utils v1.0.0 Config Loading Strategy

**Research Date:** 2025-10-02
**Research Focus:** How to integrate citty-test-utils with vitest.config.js for seamless configuration access

---

## Executive Summary

### Key Findings

1. **Vitest provides THREE mechanisms for custom configuration:**
   - `test.provide` - Global config injection (serializable values only)
   - `test.extend()` with `{ injected: true }` - Fixture-based config (Vitest 3+)
   - Direct import of vitest.config.js from consumer projects

2. **Config Resolution Order:**
   - CLI `--config` flag (highest priority)
   - `vitest.config.{ts,js,mjs}` (project root)
   - `vite.config.{ts,js,mjs}` (fallback)

3. **Best Practice for Test Utilities:**
   - Use `test.extend()` with injected fixtures for maximum flexibility
   - Provide sensible defaults that can be overridden
   - Support both programmatic and config-based configuration

---

## 1. Configuration Loading Strategies

### Strategy A: `test.provide` + `inject` (RECOMMENDED for Simple Values)

**How It Works:**
- User defines config in `vitest.config.js` under `test.provide`
- Tests use `inject()` to access values
- Values must be serializable (transferred between processes)

**Example Configuration (User's vitest.config.js):**
```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    provide: {
      // Custom citty config section
      citty: {
        cliPath: './src/cli.mjs',
        timeout: 30000,
        defaultEnv: {
          TEST_CLI: 'true'
        }
      }
    }
  }
})
```

**Example Usage (In Tests):**
```javascript
import { inject, test } from 'vitest'

test('should use config from vitest.config.js', async () => {
  const cittyConfig = inject('citty')

  const result = await runLocalCitty({
    args: ['--help'],
    cliPath: cittyConfig.cliPath,
    timeout: cittyConfig.timeout
  })

  result.expectSuccess()
})
```

**Pros:**
- ✅ Simple and built-in to Vitest
- ✅ Works with all Vitest versions
- ✅ Type-safe with TypeScript declaration

**Cons:**
- ❌ Values must be serializable (no functions, classes)
- ❌ Requires manual `inject()` calls in every test

---

### Strategy B: `test.extend()` with Injected Fixtures (RECOMMENDED for v1.0.0)

**How It Works:**
- citty-test-utils provides extended test function with fixtures
- User overrides fixture defaults in `vitest.config.js`
- Fixtures are automatically available in test context

**Implementation in citty-test-utils:**

```javascript
// src/vitest/citty-test.js
import { test as base } from 'vitest'

/**
 * Extended test with citty-specific fixtures
 *
 * Usage in vitest.config.js:
 * export default defineConfig({
 *   test: {
 *     provide: {
 *       cliPath: './src/cli.mjs',
 *       timeout: 30000
 *     }
 *   }
 * })
 */
export const test = base.extend({
  // CLI path fixture with default fallback
  cliPath: [
    // Default value (from env or convention)
    async ({}, use) => {
      const path = process.env.TEST_CLI_PATH || './src/cli.mjs'
      await use(path)
    },
    { injected: true } // Allow override from config
  ],

  // Timeout fixture
  timeout: [
    30000,
    { injected: true }
  ],

  // Environment variables fixture
  testEnv: [
    { TEST_CLI: 'true' },
    { injected: true }
  ],

  // Helper fixture that uses other fixtures
  cittyRunner: async ({ cliPath, timeout, testEnv }, use) => {
    // Create a configured runner
    const runner = {
      run: (args, options = {}) => runLocalCitty({
        args,
        cliPath: options.cliPath || cliPath,
        timeout: options.timeout || timeout,
        env: { ...testEnv, ...options.env }
      })
    }
    await use(runner)
  }
})

export { expect } from 'vitest'
```

**User Configuration (vitest.config.js):**
```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    provide: {
      cliPath: './dist/cli.js',
      timeout: 60000,
      testEnv: {
        TEST_CLI: 'true',
        NODE_ENV: 'test'
      }
    }
  }
})
```

**Usage in Tests:**
```javascript
import { test, expect } from 'citty-test-utils/vitest'

// Fixtures are automatically available!
test('should use configured CLI path', async ({ cittyRunner, cliPath }) => {
  console.log('Using CLI:', cliPath) // './dist/cli.js'

  const result = await cittyRunner.run(['--help'])
  result.expectSuccess()
})

test('can override fixtures per-test', async ({ cittyRunner }) => {
  const result = await cittyRunner.run(['--version'], {
    cliPath: './custom-cli.js',
    timeout: 5000
  })
  result.expectSuccess()
})
```

**Pros:**
- ✅ Auto-injection into test context (no manual `inject()`)
- ✅ Composable fixtures (cittyRunner uses other fixtures)
- ✅ Per-test override capability
- ✅ Type-safe with TypeScript
- ✅ Clean test code

**Cons:**
- ⚠️ Requires Vitest 3+ for `{ injected: true }`
- ⚠️ Users must import from `citty-test-utils/vitest` instead of `vitest`

---

### Strategy C: Config File Discovery (ALTERNATIVE)

**How It Works:**
- citty-test-utils searches for vitest.config.js at runtime
- Dynamically imports and parses the config
- Extracts custom `test.citty` section

**Implementation:**

```javascript
// src/vitest/config-resolver.js
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

const CONFIG_FILES = [
  'vitest.config.js',
  'vitest.config.mjs',
  'vitest.config.ts',
  'vite.config.js',
  'vite.config.mjs',
  'vite.config.ts'
]

/**
 * Find and load vitest config from project root
 */
export async function loadVitestConfig(cwd = process.cwd()) {
  // Search for config file
  for (const configFile of CONFIG_FILES) {
    const configPath = resolve(cwd, configFile)

    if (existsSync(configPath)) {
      try {
        // Dynamic import of config
        const configUrl = pathToFileURL(configPath).href
        const module = await import(configUrl)
        const config = module.default

        // Handle both function and object configs
        const resolved = typeof config === 'function'
          ? config({ mode: 'test', command: 'serve' })
          : config

        return {
          config: resolved,
          path: configPath,
          citty: resolved?.test?.citty || resolved?.test?.provide?.citty || {}
        }
      } catch (error) {
        console.warn(`Failed to load ${configFile}:`, error.message)
      }
    }
  }

  return { config: null, path: null, citty: {} }
}

/**
 * Get citty-specific config with defaults
 */
export async function getCittyConfig(cwd = process.cwd()) {
  const { citty } = await loadVitestConfig(cwd)

  return {
    cliPath: citty.cliPath || process.env.TEST_CLI_PATH || './src/cli.mjs',
    timeout: citty.timeout || 30000,
    env: citty.env || { TEST_CLI: 'true' },
    cwd: citty.cwd || cwd,
    ...citty
  }
}
```

**Usage in citty-test-utils:**

```javascript
// src/core/runners/local-runner.js
import { getCittyConfig } from '../vitest/config-resolver.js'

export async function runLocalCitty(options) {
  // Load config if not fully specified
  const config = await getCittyConfig(options.cwd)

  const finalOptions = {
    cliPath: options.cliPath || config.cliPath,
    timeout: options.timeout || config.timeout,
    env: { ...config.env, ...options.env },
    cwd: options.cwd || config.cwd,
    args: options.args
  }

  // Run CLI with merged config
  return executeLocalCli(finalOptions)
}
```

**User Configuration (vitest.config.js):**
```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Option 1: Use provide section
    provide: {
      citty: {
        cliPath: './dist/cli.js',
        timeout: 60000
      }
    },

    // Option 2: Use custom citty section
    citty: {
      cliPath: './dist/cli.js',
      timeout: 60000,
      env: {
        TEST_CLI: 'true'
      }
    }
  }
})
```

**Pros:**
- ✅ Transparent to users (no special imports)
- ✅ Works with existing vitest imports
- ✅ Supports both custom sections and provide
- ✅ Graceful fallback to defaults

**Cons:**
- ❌ Requires dynamic import at runtime (performance)
- ❌ Config resolution can be tricky in monorepos
- ❌ Might not work in all environments (edge cases)

---

## 2. Recommended Implementation for v1.0.0

### Hybrid Approach (Best of All Worlds)

**Combine Strategy B (primary) + Strategy C (fallback):**

```javascript
// Export tree:
// citty-test-utils/vitest  -> Extended test (Strategy B)
// citty-test-utils         -> Regular exports with auto-config (Strategy C)
```

**File: `src/vitest/index.js`**
```javascript
// Primary export: Extended test with fixtures
export { test, expect } from './citty-test.js'
export { getCittyConfig, loadVitestConfig } from './config-resolver.js'
```

**File: `index.js`** (main entry)
```javascript
// Core functions with auto-config loading
export * from './src/core/runners/local-runner.js'
export * from './src/core/assertions/assertions.js'
export * from './src/core/scenarios/scenario-dsl.js'

// Vitest integration (optional)
export * as vitest from './src/vitest/index.js'
```

**Usage Examples:**

```javascript
// Option 1: Use extended test (recommended for Vitest 3+)
import { test, expect } from 'citty-test-utils/vitest'

test('auto-configured', async ({ cittyRunner }) => {
  const result = await cittyRunner.run(['--help'])
  result.expectSuccess()
})

// Option 2: Use with auto-config discovery (backward compatible)
import { runLocalCitty } from 'citty-test-utils'
import { test, expect } from 'vitest'

test('auto-discovers config', async () => {
  // Automatically loads from vitest.config.js
  const result = await runLocalCitty({
    args: ['--help']
    // cliPath auto-detected from config or defaults
  })
  result.expectSuccess()
})

// Option 3: Explicit config (always works)
import { runLocalCitty } from 'citty-test-utils'
import { test, expect } from 'vitest'

test('explicit config', async () => {
  const result = await runLocalCitty({
    args: ['--help'],
    cliPath: './dist/cli.js',
    timeout: 60000
  })
  result.expectSuccess()
})
```

---

## 3. TypeScript Support

**File: `src/vitest/types.d.ts`**

```typescript
import type { TestAPI } from 'vitest'

export interface CittyConfig {
  cliPath: string
  timeout: number
  env: Record<string, string>
  cwd: string
}

export interface CittyFixtures {
  cliPath: string
  timeout: number
  testEnv: Record<string, string>
  cittyRunner: {
    run: (args: string[], options?: Partial<CittyConfig>) => Promise<any>
  }
}

// Extend Vitest's ProvidedContext
declare module 'vitest' {
  export interface ProvidedContext {
    citty?: CittyConfig
    cliPath?: string
    timeout?: number
    testEnv?: Record<string, string>
  }
}

// Export extended test type
export const test: TestAPI<CittyFixtures>
```

---

## 4. Edge Cases & Considerations

### Monorepo Support

```javascript
// Config resolver must search upward
export async function loadVitestConfig(startPath = process.cwd()) {
  let currentPath = startPath
  const root = parse(currentPath).root

  while (currentPath !== root) {
    const { config, path } = await tryLoadConfig(currentPath)
    if (config) return { config, path, citty: extractCittyConfig(config) }

    currentPath = resolve(currentPath, '..')
  }

  return { config: null, path: null, citty: {} }
}
```

### Config Caching

```javascript
const configCache = new Map()

export async function getCittyConfig(cwd = process.cwd()) {
  if (configCache.has(cwd)) {
    return configCache.get(cwd)
  }

  const config = await loadVitestConfig(cwd)
  configCache.set(cwd, config)

  return config
}

// Clear cache for testing
export function clearConfigCache() {
  configCache.clear()
}
```

### ESM vs CommonJS

```javascript
// Support both import and require
export async function loadConfig(configPath) {
  const ext = extname(configPath)

  if (ext === '.ts') {
    // Use tsx or vite-node to load TS config
    const { createServer } = await import('vite')
    const server = await createServer({ configFile: configPath })
    return server.config
  }

  // Dynamic import for ESM
  const configUrl = pathToFileURL(configPath).href
  const module = await import(configUrl)
  return module.default || module
}
```

### Workspace Support (Vitest Projects)

```javascript
// User can have multiple test projects
export default defineConfig({
  test: {
    projects: [
      {
        name: 'unit',
        provide: {
          cliPath: './src/cli.mjs'
        }
      },
      {
        name: 'e2e',
        provide: {
          cliPath: './dist/cli.js'
        }
      }
    ]
  }
})
```

---

## 5. Implementation Checklist

### Phase 1: Core Config Resolution (Week 1)
- [ ] Implement `config-resolver.js` with dynamic import
- [ ] Support all config file formats (js, mjs, ts)
- [ ] Add config caching layer
- [ ] Test monorepo resolution
- [ ] Handle ESM/CommonJS edge cases

### Phase 2: Vitest Integration (Week 2)
- [ ] Create `citty-test.js` with extended test
- [ ] Implement injected fixtures pattern
- [ ] Add TypeScript declarations
- [ ] Create examples for all usage patterns
- [ ] Write migration guide from v0.6.1

### Phase 3: Backward Compatibility (Week 3)
- [ ] Auto-config loading in `runLocalCitty`
- [ ] Maintain explicit config support
- [ ] Add deprecation warnings if needed
- [ ] Update all existing tests
- [ ] Document breaking changes

### Phase 4: Documentation & Testing (Week 4)
- [ ] Write comprehensive config guide
- [ ] Add examples for each strategy
- [ ] Create troubleshooting section
- [ ] Test with real-world projects
- [ ] Performance benchmarks

---

## 6. Code Examples

### Example 1: Simple Test with Config

```javascript
// vitest.config.js
export default defineConfig({
  test: {
    provide: {
      cliPath: './dist/cli.js'
    }
  }
})

// test/cli.test.js
import { test, expect, inject } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'

test('uses config', async () => {
  const result = await runLocalCitty({
    args: ['--help'],
    cliPath: inject('cliPath')
  })
  result.expectSuccess()
})
```

### Example 2: Extended Test Pattern

```javascript
// test/cli.test.js
import { test, expect } from 'citty-test-utils/vitest'

test('auto-configured', async ({ cittyRunner, cliPath }) => {
  console.log('Testing CLI:', cliPath)

  const result = await cittyRunner.run(['--help'])
  result.expectSuccess()
})
```

### Example 3: Scenario DSL with Config

```javascript
import { scenario } from 'citty-test-utils'
import { getCittyConfig } from 'citty-test-utils/vitest'

test('workflow', async () => {
  const config = await getCittyConfig()

  await scenario('User workflow')
    .step('Help')
    .run({ args: ['--help'], ...config })
    .expectSuccess()

    .step('Version')
    .run({ args: ['--version'], ...config })
    .expectSuccess()

    .execute('local')
})
```

---

## 7. Performance Considerations

### Config Loading Time

**Measurement:**
```javascript
import { performance } from 'node:perf_hooks'

async function benchmarkConfigLoad() {
  const start = performance.now()
  const config = await getCittyConfig()
  const end = performance.now()

  console.log(`Config loaded in ${end - start}ms`)
}
```

**Expected Results:**
- Cold load: ~10-20ms
- Cached load: ~0.1-1ms

**Optimization:**
```javascript
// Lazy load config only when needed
let configPromise = null

export function getCittyConfig(cwd = process.cwd()) {
  if (!configPromise) {
    configPromise = loadVitestConfig(cwd)
  }
  return configPromise
}
```

---

## 8. References

### Vitest Documentation
- [Configuration](https://vitest.dev/config/)
- [Test Context](https://vitest.dev/guide/test-context)
- [Extending Test](https://vitest.dev/api/#test-extend)
- [Plugin API](https://vitest.dev/advanced/api/plugin)

### Node.js APIs
- [import()](https://nodejs.org/api/esm.html#import-expressions)
- [pathToFileURL](https://nodejs.org/api/url.html#urlpathtofileurlpath)
- [Module Resolution](https://nodejs.org/api/esm.html#resolver-algorithm)

### Related Projects
- [@vitest/ui](https://github.com/vitest-dev/vitest/tree/main/packages/ui) - Example of Vitest extension
- [vitest-dom](https://github.com/testing-library/vitest-dom) - DOM testing matchers
- [vitest-when](https://github.com/mcous/vitest-when) - Test fixtures pattern

---

## 9. Conclusion

### Recommended Approach for citty-test-utils v1.0.0

**Primary Strategy:** `test.extend()` with injected fixtures (Strategy B)
**Fallback Strategy:** Auto-config discovery (Strategy C)
**Support:** Direct config passing (always available)

**Implementation Priority:**
1. Add config resolver with caching
2. Create extended test export
3. Update main exports to use auto-config
4. Write comprehensive documentation
5. Add TypeScript declarations

**Migration Path:**
- v0.6.1 → v1.0.0: Fully backward compatible
- New feature: Import from `citty-test-utils/vitest` for extended test
- Enhanced: Auto-config loading from vitest.config.js

**Success Criteria:**
- Zero-config works for 80% of use cases
- Advanced users can customize everything
- Performance impact < 20ms per test file
- TypeScript support with full intellisense

---

**End of Research Report**
