# Refactored Unit Tests - New runLocalCitty API

## Overview

All unit tests have been refactored to use the new `runLocalCitty` API that executes **REAL CLI commands** instead of mocks.

## Key Changes

### 1. **NO MORE MOCKING** ❌

**REMOVED:**
```javascript
// ❌ DELETE THIS - Old mock-based approach
vi.mock('child_process')
const mockExecSync = vi.fn()
mockExecSync.mockReturnValue('Mock output')
```

**NEW:**
```javascript
// ✅ NEW - Real CLI execution
const result = runLocalCitty({
  cliPath: './test-cli.mjs',
  args: ['--help']
})
expect(result.stdout).toContain('Real output!')
```

### 2. **New API Format**

**OLD:**
```javascript
const result = await runLocalCitty(['--help'], { env: { TEST: 'true' } })
```

**NEW:**
```javascript
const result = runLocalCitty({
  cliPath: './test-cli.mjs',  // REQUIRED: explicit CLI path
  args: ['--help'],           // Args now in options object
  cwd: '/path/to/dir',        // Optional: working directory
  env: { TEST: 'true' },      // Optional: environment variables
  timeout: 30000              // Optional: timeout in ms
})
```

### 3. **Result Structure**

```javascript
{
  success: true,              // Boolean success flag
  exitCode: 0,                // Exit code
  stdout: 'output',           // Standard output (trimmed)
  stderr: '',                 // Standard error
  args: ['--help'],           // Arguments used
  cliPath: '/abs/path/cli.js', // Absolute CLI path
  cwd: '/working/dir',        // Working directory
  durationMs: 123,            // Execution time
  command: 'node ...'         // Full command executed
}
```

## Refactored Test Files

### 1. `local-runner.test.mjs` ⭐ **CRITICAL**

**Most Important** - Tests the local-runner itself with real CLI execution.

**Key Test Categories:**
- ✅ Zod schema validation (cliPath required, defaults, type checking)
- ✅ Real CLI execution (--help, --version, echo, errors)
- ✅ Error handling (fail-fast, helpful messages)
- ✅ runLocalCittySafe (graceful error handling)
- ✅ wrapWithAssertions (fluent API)
- ✅ Concurrent execution
- ✅ Environment variables
- ✅ Working directory handling
- ✅ Performance tracking
- ✅ Edge cases (unicode, special chars, etc.)

**What Changed:**
- Removed ALL mocking (100+ lines of mock code deleted!)
- Created real test CLI that responds to commands
- Tests actual behavior, not mock behavior
- Tests Zod validation rules

### 2. `scenario-dsl.test.mjs`

**Key Test Categories:**
- ✅ Scenario builder pattern
- ✅ Step execution (sequential & concurrent)
- ✅ testUtils (waitFor, retry, createTempFile)
- ✅ Error handling

**What Changed:**
- Updated to new `{ args: [...] }` API
- Uses real test CLI for integration tests
- Removed child_process mocking

### 3. `snapshot.test.mjs`

**Key Test Categories:**
- ✅ Snapshot configuration
- ✅ Snapshot manager (create, match, update)
- ✅ Snapshot utilities
- ✅ Integration with local runner
- ✅ Integration with scenario DSL

**What Changed:**
- Uses real CLI for snapshot tests
- Updated API calls to new format
- Tests real snapshot behavior

### 4. `analysis-utils.test.mjs`

**Key Test Categories:**
- ✅ Metadata building
- ✅ Path validation
- ✅ Report formatting (JSON, YAML)
- ✅ Error formatting
- ✅ Utility functions (percentage, file size, duration)

**What Changed:**
- Pure utility function testing (no CLI execution)
- No changes needed for API (doesn't use runLocalCitty)

### 5. `ast-cache.test.mjs`

**Key Test Categories:**
- ✅ Cache key generation
- ✅ Cache hit/miss scenarios
- ✅ TTL expiration
- ✅ Cache size limits
- ✅ Statistics tracking

**What Changed:**
- Pure caching tests (no CLI execution)
- No changes needed for API (doesn't use runLocalCitty)

## How to Use These Tests

### 1. Copy to Test Directory

```bash
# Copy all refactored tests to test/unit/
cp hive/refactor/unit-tests/*.test.mjs test/unit/
```

### 2. Run Tests

```bash
# Run all unit tests
npm test -- test/unit/

# Run specific test file
npm test -- test/unit/local-runner.test.mjs

# Run with coverage
npm run test:coverage
```

### 3. Replace Old Tests

```bash
# Backup old tests
mv test/unit/local-runner.test.mjs test/unit/local-runner.test.mjs.old

# Use new refactored version
cp hive/refactor/unit-tests/local-runner.test.mjs test/unit/
```

## Testing Philosophy

### Before (Mock-Based) ❌

```javascript
// Mock the behavior
mockExecSync.mockReturnValue('{"version": "3.0.0"}')

// Test the mock
const result = await runLocalCitty(['--version'])
expect(result.json).toEqual({ version: '3.0.0' })
```

**Problems:**
- Tests mock behavior, not real behavior
- 120+ lines of mock code to maintain
- Doesn't catch real CLI bugs
- Mock responses hardcoded

### After (Real CLI) ✅

```javascript
// Execute real CLI
const result = runLocalCitty({
  cliPath: './test-cli.mjs',
  args: ['--version', '--json']
})

// Test real output
expect(result.stdout).toContain('1.0.0')
const json = JSON.parse(result.stdout)
expect(json.version).toBe('1.0.0')
```

**Benefits:**
- Tests actual CLI behavior
- No mock code needed
- Catches real bugs
- Validates Zod schemas
- Tests fail-fast behavior

## Migration Checklist

For each test file:

- [ ] Remove `vi.mock('child_process')` or `vi.mock('node:child_process')`
- [ ] Remove mock setup in `beforeEach` (mockExecSync, etc.)
- [ ] Update API calls from `runLocalCitty(['--help'])` to `runLocalCitty({ args: ['--help'] })`
- [ ] Add `cliPath` to all runLocalCitty calls
- [ ] Create real test CLI if needed (see local-runner.test.mjs example)
- [ ] Update assertions to test real output, not mock output
- [ ] Remove mock verification calls (`expect(mockExecSync).toHaveBeenCalledWith(...)`)
- [ ] Test and verify all tests pass

## Example: Complete Refactoring

### Before ❌

```javascript
import { vi } from 'vitest'

vi.mock('child_process', () => ({
  execSync: vi.fn()
}))

import { runLocalCitty } from '../../src/core/local-runner.js'
import { execSync } from 'child_process'

it('should execute command', async () => {
  execSync.mockReturnValue('Mock output')

  const result = await runLocalCitty(['--help'], { env: { TEST: 'true' } })

  expect(result.result.stdout).toBe('Mock output')
  expect(execSync).toHaveBeenCalled()
})
```

### After ✅

```javascript
import { describe, it, expect, beforeAll } from 'vitest'
import { runLocalCitty } from '../../src/core/local-runner.js'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const testCliPath = join(process.cwd(), '.test-cli.mjs')

beforeAll(() => {
  // Create real test CLI
  writeFileSync(testCliPath, `#!/usr/bin/env node
if (process.argv.includes('--help')) {
  console.log('Real CLI Help')
  process.exit(0)
}
`, { mode: 0o755 })
})

it('should execute command', () => {
  const result = runLocalCitty({
    cliPath: testCliPath,
    args: ['--help']
  })

  expect(result.stdout).toBe('Real CLI Help')
  expect(result.exitCode).toBe(0)
  expect(result.success).toBe(true)
})
```

## Benefits Summary

1. **✅ No Mocks** - 120+ lines of mock code deleted
2. **✅ Real Behavior** - Tests actual CLI execution
3. **✅ Fail-Fast** - Tests proper error handling
4. **✅ Zod Validation** - Tests schema validation rules
5. **✅ Better Coverage** - Catches real bugs, not mock bugs
6. **✅ Cleaner Code** - Less setup, more straightforward tests
7. **✅ Future-Proof** - Real CLI can evolve without updating mocks

## Questions?

- Check `local-runner.test.mjs` for the most comprehensive example
- All tests create real test CLIs in `beforeAll`/`beforeEach`
- Tests use real file system operations
- No mocking required!
