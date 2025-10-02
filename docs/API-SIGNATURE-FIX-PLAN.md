# API Signature Fix Plan - v0.6.0

## Executive Summary

**Critical Issue**: v0.6.0 introduced breaking API changes that are not reflected in README documentation, causing mismatches between documented and actual API signatures.

**Impact**: HIGH - Users following README examples will encounter immediate runtime errors.

**Root Cause**: API refactor from positional arguments to options object without updating consumer code.

---

## 🔴 Critical Findings

### 1. **Missing Export: `runCitty`**

**File**: `/Users/sac/citty-test-utils/src/core/runners/local-runner.js`

**Issue**: Line 2 of `scenario-dsl.js` imports `runCitty` but it's NOT exported from `local-runner.js`

```javascript
// scenario-dsl.js:2
import { runLocalCitty, runCitty } from '../runners/local-runner.js'

// local-runner.js exports (ACTUAL):
export function runLocalCitty(options) { ... }
export function wrapWithAssertions(result) { ... }
export function runLocalCittySafe(options) { ... }

// ❌ NO EXPORT FOR runCitty!
```

**Expected**: `runCitty` should be exported for cleanroom execution
**Actual**: Import fails silently or throws at runtime

---

### 2. **API Signature Breaking Change**

#### v0.5.1 API (OLD - in README):
```javascript
runLocalCitty(['--help'], { cwd: './project' })
```

**Signature**: `runLocalCitty(args: string[], options?: object)`
- First parameter: `args` array
- Second parameter: `options` object

#### v0.6.0 API (NEW - in code):
```javascript
runLocalCitty({ args: ['--help'], cwd: './project', cliPath: 'src/cli.mjs' })
```

**Signature**: `runLocalCitty(options: object)`
- Single parameter: `options` object containing `args`, `cwd`, `cliPath`, `env`, `timeout`

**Zod Schema** (local-runner.js:16-26):
```javascript
const LocalRunnerOptionsSchema = z.object({
  cliPath: z.string().optional().default(process.env.TEST_CLI_PATH || './src/cli.mjs'),
  cwd: z.string().optional().default(process.env.TEST_CWD || process.cwd()),
  env: z.record(z.string()).optional().default({}),
  timeout: z.number().positive().optional().default(30000),
  args: z.array(z.string()).optional().default([]),
})
```

---

### 3. **Scenario DSL `.run()` Method Incompatibility**

**File**: `/Users/sac/citty-test-utils/src/core/scenarios/scenario-dsl.js`

**Lines 113, 179**: `.run()` passes arguments to `runLocalCitty` in OLD format:

```javascript
// scenario-dsl.js:113
result = await runLocalCitty(step.command.args, options)
                              ^^^^^^^^^^^^^^^^  ^^^^^^^
                              OLD: positional args   OLD: separate options

// scenario-dsl.js:179 (same issue)
result = await runLocalCitty(step.command.args, options)
```

**Problem**: This calls NEW API with OLD signature, causing:
1. First param (`step.command.args`) interpreted as `options` object → Zod validation fails
2. Second param (`options`) ignored → cwd, env, timeout lost

**Expected behavior**:
```javascript
// NEW API requires single options object
result = await runLocalCitty({
  args: step.command.args,
  ...options
})
```

---

### 4. **README Documentation Outdated**

**File**: `/Users/sac/citty-test-utils/README.md`

**Lines 79-86**: Shows OLD API signature
```javascript
const help = await runLocalCitty(['--help'], {
  cwd: './playground',
  env: { TEST_CLI: 'true' },
})
```

**Lines 304-308**: Shows OLD API signature
```javascript
const result = await runLocalCitty(['--help'], {
  cwd: './my-cli-project',
  env: { DEBUG: 'true' },
  timeout: 30000
})
```

**Appears 15+ times** throughout README in various examples.

---

## 📋 Complete Fix List

### Priority 1: Critical Fixes (Breaks Execution)

#### Fix 1.1: Export `runCitty` from local-runner.js
**File**: `/Users/sac/citty-test-utils/src/core/runners/local-runner.js`
**Action**: Add export for cleanroom runner function
**Implementation**:
```javascript
// Add this export (probably should import from cleanroom-runner.js)
export { runCitty } from './cleanroom-runner.js'

// OR define stub/alias:
export function runCitty(options) {
  // Delegate to cleanroom implementation
  throw new Error('runCitty requires cleanroom-runner.js implementation')
}
```

#### Fix 1.2: Update scenario-dsl.js `.run()` method
**File**: `/Users/sac/citty-test-utils/src/core/scenarios/scenario-dsl.js`
**Lines**: 113, 179
**Action**: Update to use NEW v0.6.0 options object API

**Current (BROKEN)**:
```javascript
result = await runLocalCitty(step.command.args, options)
```

**Fixed**:
```javascript
result = await runLocalCitty({
  args: step.command.args,
  ...options
})
```

**Change required in TWO locations**:
- Line 113 (concurrent execution)
- Line 179 (sequential execution)

#### Fix 1.3: Update scenarios.js helper function
**File**: `/Users/sac/citty-test-utils/src/core/scenarios/scenarios.js`
**Lines**: 14
**Action**: Update `exec()` helper to use NEW API

**Current (BROKEN)**:
```javascript
return env === 'cleanroom' ? runCitty(args, options) : runLocalCitty(args, options)
```

**Fixed**:
```javascript
return env === 'cleanroom'
  ? runCitty({ args, ...options })
  : runLocalCitty({ args, ...options })
```

---

### Priority 2: Documentation Updates (User-Facing)

#### Fix 2.1: Update README Quick Start
**File**: `/Users/sac/citty-test-utils/README.md`
**Lines**: 76-88
**Current**:
```javascript
const help = await runLocalCitty(['--help'], {
  cwd: './playground',
  env: { TEST_CLI: 'true' },
})
```

**Fixed**:
```javascript
const help = await runLocalCitty({
  args: ['--help'],
  cwd: './playground',
  env: { TEST_CLI: 'true' },
})
```

#### Fix 2.2: Update README Scenario Example
**File**: `/Users/sac/citty-test-utils/README.md`
**Lines**: 94-103
**Current**: Uses OLD `.run()` signature
**Fixed**: Document NEW v0.6.0 signature with `args` in options

#### Fix 2.3: Update README API Reference Section
**File**: `/Users/sac/citty-test-utils/README.md`
**Lines**: 297-315, 423-435, 531-551
**Action**: Update ALL runLocalCitty examples to v0.6.0 signature

**Pattern to find/replace**:
```bash
# Find all old patterns
grep -n "runLocalCitty(\[" README.md

# Should be:
runLocalCitty({ args: [...], ...options })
```

---

### Priority 3: Test File Updates (Validation)

#### Fix 3.1: Update test files using old API
**Action**: Search for all test files using OLD signature

```bash
# Find tests using old API
grep -r "runLocalCitty(\[" test/

# Update pattern:
# OLD: runLocalCitty(['cmd'], { opts })
# NEW: runLocalCitty({ args: ['cmd'], ...opts })
```

---

## 🔍 Impact Analysis

### Affected Components

1. **Scenario DSL**: ✅ Partially broken (`.run()` method)
2. **Pre-built Scenarios**: ✅ Broken (uses `exec()` helper)
3. **README Examples**: ❌ All examples outdated
4. **Test Files**: ⚠️ Unknown (need to scan)
5. **Type Definitions**: ⚠️ May need updates for TypeScript

### Breaking Changes Summary

| Component | v0.5.1 | v0.6.0 | Status |
|-----------|--------|--------|--------|
| `runLocalCitty` signature | `(args, opts)` | `({ args, ...opts })` | 🔴 BREAKING |
| `runCitty` export | Not documented | Missing export | 🔴 CRITICAL |
| Scenario DSL `.run()` | Works | Broken | 🔴 CRITICAL |
| README examples | Correct | Outdated | 🟡 DOCS ONLY |

---

## ✅ Validation Checklist

After applying fixes, verify:

- [ ] `runCitty` is exported from `local-runner.js`
- [ ] Scenario DSL `.run()` uses NEW signature (2 locations)
- [ ] `scenarios.js` `exec()` uses NEW signature
- [ ] README examples updated (15+ occurrences)
- [ ] All test files pass with NEW API
- [ ] No import errors for `runCitty`
- [ ] Type definitions match NEW signatures

---

## 📝 Migration Guide for Users

### For Existing Users (v0.5.1 → v0.6.0)

**OLD Code (v0.5.1)**:
```javascript
const result = await runLocalCitty(['--help'], {
  cwd: './project',
  env: { DEBUG: 'true' }
})
```

**NEW Code (v0.6.0)**:
```javascript
const result = await runLocalCitty({
  args: ['--help'],
  cwd: './project',
  env: { DEBUG: 'true' }
})
```

**Key Changes**:
1. Single options object parameter (not two separate params)
2. `args` is now a property inside options object
3. `cliPath` is now configurable (defaults to `./src/cli.mjs`)

---

## 🎯 Implementation Order

1. **Fix exports** (local-runner.js) - Prevents import errors
2. **Fix scenario-dsl.js** - Core functionality
3. **Fix scenarios.js** - Pre-built scenarios
4. **Update README** - User documentation
5. **Update tests** - Validation
6. **Update types** - TypeScript support

---

## 📊 Files Requiring Changes

### Core Code (Priority 1)
- `/Users/sac/citty-test-utils/src/core/runners/local-runner.js` (add export)
- `/Users/sac/citty-test-utils/src/core/scenarios/scenario-dsl.js` (2 changes)
- `/Users/sac/citty-test-utils/src/core/scenarios/scenarios.js` (1 change)

### Documentation (Priority 2)
- `/Users/sac/citty-test-utils/README.md` (15+ changes)

### Tests (Priority 3)
- Scan all files in `/Users/sac/citty-test-utils/test/` directory

### Type Definitions (Priority 3)
- `/Users/sac/citty-test-utils/types/*.d.ts` (if exists)

---

## 🚨 Risk Assessment

**High Risk**: Scenario DSL and pre-built scenarios completely broken
**Medium Risk**: All README examples will fail for new users
**Low Risk**: Existing code using direct API calls (less common)

**Estimated Fix Time**: 2-3 hours for complete resolution

---

## 📞 Next Steps

1. Get approval for fix approach
2. Implement fixes in priority order
3. Run full test suite validation
4. Update CHANGELOG.md with breaking changes
5. Consider adding API version detection/warnings

---

**Analysis completed by**: Hive Mind Swarm - Code Analyst Agent
**Timestamp**: 2025-10-02
**Session**: swarm-1759426017523-yj6oavm23
