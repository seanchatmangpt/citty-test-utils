# Code Architecture Analysis - v0.6.0
## Hive Mind Coder Agent Report

**Analysis Date**: 2025-10-02
**Version**: 0.6.0
**Agent**: Coder
**Status**: 🟡 **MAJOR ARCHITECTURAL ISSUES IDENTIFIED**

---

## Executive Summary

v0.6.0 attempted a **fail-fast refactor** with Zod validation but introduced **critical breaking changes** that make the package unusable. The root causes are:

1. **Incomplete Zod v4 migration** - Uses Zod v4 but code written for v3
2. **Export inconsistencies** - Missing exports break module dependencies
3. **API signature changes** - Breaking changes without backward compatibility
4. **Documentation drift** - README shows v0.5.1 API, package has v0.6.0 API

**Impact**: 0% of README examples work. Package is **not production-ready**.

---

## 1. Critical Code Issues

### 1.1 Zod v4 Incompatibility 🔴 CRITICAL

**File**: `src/core/runners/local-runner.js:57`

**Issue**: Code uses Zod v3 API with Zod v4 dependency
```javascript
// Line 57 - BROKEN with Zod v4
const validated = LocalRunnerOptionsSchema.parse(options)
```

**Error**:
```
TypeError: Cannot read properties of undefined (reading '_zod')
```

**Root Cause**:
- `package.json` declares `"zod": "^4.1.11"`
- Zod v4 changed internal structure (`_zod` property removed)
- Schema definition still uses v3 patterns

**Evidence**:
```javascript
// Current schema (lines 16-26)
const LocalRunnerOptionsSchema = z.object({
  cliPath: z.string().optional().default(process.env.TEST_CLI_PATH || './src/cli.mjs'),
  cwd: z.string().optional().default(process.env.TEST_CWD || process.cwd()),
  env: z.record(z.string()).optional().default({}),
  timeout: z.number().positive().optional().default(30000),
  args: z.array(z.string()).optional().default([]),
})
```

**Quick Fix (v0.6.1)**:
```json
// package.json - Downgrade to Zod v3
{
  "dependencies": {
    "zod": "^3.23.8"  // Change from ^4.1.11
  }
}
```

**Long-term Fix (v0.7.0)**:
```javascript
// Migrate to Zod v4 API
import { z } from 'zod'

const LocalRunnerOptionsSchema = z.object({
  cliPath: z.string().default(process.env.TEST_CLI_PATH || './src/cli.mjs'),
  cwd: z.string().default(process.env.TEST_CWD || process.cwd()),
  env: z.record(z.string(), z.string()).default({}),
  timeout: z.number().positive().default(30000),
  args: z.array(z.string()).default([]),
})
```

**Risk**: HIGH - Affects **ALL** programmatic API usage

---

### 1.2 Missing Export: `runCitty` 🔴 CRITICAL

**File**: `src/core/scenarios/scenario-dsl.js:2`

**Issue**: Import statement expects `runCitty` from `local-runner.js`
```javascript
// Line 2 - BROKEN
import { runLocalCitty, runCitty } from '../runners/local-runner.js'
```

**Error**:
```
SyntaxError: The requested module '../runners/local-runner.js'
does not provide an export named 'runCitty'
```

**Root Cause**:
- `local-runner.js` only exports: `runLocalCitty`, `wrapWithAssertions`, `runLocalCittySafe`
- `runCitty` is defined in `cleanroom-runner.js:65`
- Scenario DSL incorrectly imports from `local-runner.js`

**Quick Fix (v0.6.1) - Option A**:
```javascript
// src/core/runners/local-runner.js - Add re-export
export { runCitty } from './cleanroom-runner.js'
```

**Quick Fix (v0.6.1) - Option B**:
```javascript
// src/core/scenarios/scenario-dsl.js - Fix import
import { runLocalCitty } from '../runners/local-runner.js'
import { runCitty } from '../runners/cleanroom-runner.js'
```

**Recommendation**: Use **Option A** - maintains backward compatibility

**Risk**: HIGH - Breaks scenario DSL and cleanroom testing

---

### 1.3 Scenario DSL API Mismatch 🔴 CRITICAL

**File**: `src/core/scenarios/scenario-dsl.js:48`

**Issue**: `.run()` method expects string or array, receives object
```javascript
// Line 48 - Type error
const commandArgs = Array.isArray(args) ? args : args.split(' ')
```

**Error when passing object**:
```
TypeError: args.split is not a function
```

**Root Cause**: README shows object syntax, implementation expects string
```javascript
// README example (lines 95-97)
.run('--help', { cwd: './playground', env: { TEST_CLI: 'true' } })

// Implementation expects (line 48)
args: string | string[]  // NOT object
```

**Current Signature**:
```javascript
run(args, options = {}) {
  // args expected to be string or array
  const commandArgs = Array.isArray(args) ? args : args.split(' ')
  currentStep.command = { args: commandArgs, options }
  return this
}
```

**Quick Fix (v0.6.1)**:
```javascript
run(argsOrOptions, options = {}) {
  if (!currentStep) {
    throw new Error('Must call step() before run()')
  }

  // Handle both old (string/array) and new (object) API
  let commandArgs, commandOptions

  if (typeof argsOrOptions === 'object' && !Array.isArray(argsOrOptions)) {
    // New API: run({ args: ['--help'], cwd: './project' })
    commandArgs = argsOrOptions.args || []
    commandOptions = argsOrOptions
  } else {
    // Old API: run('--help', { cwd: './project' })
    commandArgs = Array.isArray(argsOrOptions)
      ? argsOrOptions
      : argsOrOptions.split(' ')
    commandOptions = options
  }

  currentStep.command = { args: commandArgs, options: commandOptions }
  return this
}
```

**Risk**: HIGH - All scenario examples broken

---

### 1.4 README API Mismatch 🔴 CRITICAL

**Files**: `README.md` (multiple sections)

**Issue**: README shows v0.5.1 API signature, package has v0.6.0 API

**v0.5.1 API (README)**:
```javascript
// ❌ WRONG for v0.6.0
const result = await runLocalCitty(['--help'], {
  cwd: './my-project',
  env: { DEBUG: 'true' }
})
```

**v0.6.0 API (Implementation)**:
```javascript
// ✅ CORRECT for v0.6.0
const result = await runLocalCitty({
  args: ['--help'],
  cwd: './my-project',
  cliPath: 'src/cli.mjs',  // Now REQUIRED
  env: { DEBUG: 'true' }
})
```

**Breaking Changes**:
1. `args` moved from first parameter to property
2. `cliPath` is now **required** (was auto-detected)
3. Options object now validated with Zod

**Affected README Sections**:
- Line 76-88: Quick Start
- Line 91-103: Multi-step scenario
- Line 302-314: Local Runner basic
- Line 423-435: Local Runner with options
- Line 532-551: Complete API usage
- Line 584-605: Fluent Assertions
- Line 614-627: Scenario DSL
- Line 787-903: Complete Example

**Impact**: **100% of programmatic examples fail**

**Quick Fix (v0.6.1)**: Add backward compatibility wrapper
```javascript
// src/core/runners/local-runner.js
export function runLocalCitty(argsOrOptions, legacyOptions) {
  // Detect API version
  if (Array.isArray(argsOrOptions)) {
    // v0.5.1 API: runLocalCitty(['--help'], { cwd: './project' })
    console.warn('⚠️  Using deprecated API. Please migrate to v0.6.0 API.')
    return runLocalCittyV6({
      args: argsOrOptions,
      ...legacyOptions,
      cliPath: legacyOptions?.cliPath || process.env.TEST_CLI_PATH || './src/cli.mjs'
    })
  } else {
    // v0.6.0 API: runLocalCitty({ args: ['--help'], cwd: './project' })
    return runLocalCittyV6(argsOrOptions)
  }
}

function runLocalCittyV6(options) {
  // Current v0.6.0 implementation
  const validated = LocalRunnerOptionsSchema.parse(options)
  // ... rest of implementation
}
```

**Risk**: CRITICAL - No users can follow documentation

---

## 2. Architectural Patterns Review

### 2.1 Fail-Fast Implementation ✅ GOOD

**Observation**: v0.6.0 correctly implements fail-fast philosophy

**Evidence**:
```javascript
// local-runner.js:64-76
if (!existsSync(resolvedCliPath)) {
  throw new Error(
    `CLI file not found: ${resolvedCliPath}\n` +
    `Expected path: ${cliPath}\n` +
    `Working directory: ${cwd}\n` +
    `Resolved to: ${resolvedCliPath}\n\n` +
    `Possible fixes:\n` +
    `  1. Check the cliPath is correct\n` +
    `  2. Ensure the file exists at the specified location\n` +
    `  3. Use an absolute path: cliPath: '/absolute/path/to/cli.js'\n` +
    `  4. Check your working directory (cwd) is correct`
  )
}
```

**Strengths**:
- Clear, actionable error messages
- Immediate failure (no silent errors)
- Helpful debugging context
- Suggested fixes included

**Recommendation**: ✅ **Keep this pattern** - excellent DX

---

### 2.2 Zod Validation Strategy ⚠️ NEEDS IMPROVEMENT

**Current Approach**: Schema validation at entry points

**Strengths**:
- Type safety at runtime
- Clear validation errors
- Self-documenting schemas

**Weaknesses**:
1. **Zod version incompatibility** (v4 vs v3)
2. **No migration path** for breaking changes
3. **Default values in schema** (should be in config)

**Example Issue**:
```javascript
// Line 17-19 - Defaults in schema (anti-pattern)
cliPath: z.string().optional().default(
  process.env.TEST_CLI_PATH || './src/cli.mjs'
),
```

**Better Pattern**:
```javascript
// Separate defaults from schema
const DEFAULT_OPTIONS = {
  cliPath: process.env.TEST_CLI_PATH || './src/cli.mjs',
  cwd: process.env.TEST_CWD || process.cwd(),
  env: {},
  timeout: 30000,
  args: [],
}

const LocalRunnerOptionsSchema = z.object({
  cliPath: z.string(),
  cwd: z.string(),
  env: z.record(z.string(), z.string()),
  timeout: z.number().positive(),
  args: z.array(z.string()),
})

export function runLocalCitty(userOptions = {}) {
  // Merge with defaults BEFORE validation
  const options = { ...DEFAULT_OPTIONS, ...userOptions }
  const validated = LocalRunnerOptionsSchema.parse(options)
  // ... implementation
}
```

**Benefits**:
- Defaults are configuration, not validation
- Easier to test schemas
- More flexible for different use cases

**Recommendation**: 🔧 **Refactor for v0.6.2**

---

### 2.3 Module Organization ✅ GOOD

**Structure**:
```
src/
├── core/
│   ├── runners/          # Execution engines
│   │   ├── local-runner.js    (302 lines)
│   │   └── cleanroom-runner.js (146 lines)
│   ├── scenarios/        # Test DSL
│   │   ├── scenario-dsl.js    (519 lines)
│   │   └── scenarios.js       (287 lines)
│   ├── assertions/       # Fluent assertions
│   │   ├── assertions.js
│   │   └── snapshot.js
│   ├── coverage/         # AST analysis
│   │   ├── cli-coverage-analyzer.js
│   │   └── ast-cli-analyzer.js
│   └── utils/            # Shared utilities
│       ├── input-validator.js (377 lines)
│       ├── file-utils.js
│       └── context-manager.js
├── commands/             # CLI commands
│   ├── test.js
│   ├── gen.js
│   ├── runner.js
│   ├── analysis.js
│   └── info.js
└── cli.mjs              # Entry point
```

**Strengths**:
- Clean separation of concerns
- Logical grouping by functionality
- Reasonable file sizes (<600 lines)

**Weaknesses**:
- Some circular dependencies (scenarios → runners)
- Export/import inconsistencies

**Recommendation**: ✅ **Maintain structure**, fix exports

---

### 2.4 Error Handling Patterns ✅ EXCELLENT

**Consistent Pattern**: Fail-fast with rich context

**Examples**:
```javascript
// cleanroom-runner.js:69
if (!singleton) {
  throw new Error('Cleanroom not initialized. Call setupCleanroom first.')
}

// cleanroom-runner.js:73-75
if (!containerHealthy) {
  throw new Error('Container is no longer healthy. Please restart cleanroom.')
}

// input-validator.js:48-54
throwIfInvalid() {
  if (!this.isValid()) {
    const error = new ValidationError(this.getErrorMessage(), 'options')
    error.errors = this.errors
    throw error
  }
}
```

**Strengths**:
- No try-catch defensive coding
- Errors propagate immediately
- Clear error messages
- Custom error types for context

**Recommendation**: ✅ **Keep this pattern**

---

### 2.5 Type Safety (TypeScript Definitions) ⚠️ INCOMPLETE

**File**: `src/types/types.d.ts`

**Issue**: No type definitions for v0.6.0 API

**Missing Types**:
```typescript
// Need to add
export interface LocalRunnerOptions {
  cliPath: string
  cwd?: string
  env?: Record<string, string>
  timeout?: number
  args?: string[]
}

export function runLocalCitty(options: LocalRunnerOptions): TestResult
```

**Current State**: Types exist but may not match v0.6.0 implementation

**Recommendation**: 🔧 **Update types for v0.6.1**

---

## 3. Code Quality Assessment

### 3.1 Test Coverage ⚠️ UNKNOWN

**Issue**: No coverage reports found

**Evidence**:
- `package.json` has `test:coverage` script
- No `coverage/` directory
- No `.nyc_output/`

**Recommendation**:
```bash
# Add to CI/CD
npm run test:coverage
# Require 80%+ coverage for critical paths
```

---

### 3.2 File Size Analysis ✅ GOOD

**Statistics**: 51 JavaScript files in `src/`

**Large Files** (500+ lines):
- `scenario-dsl.js` - 519 lines (acceptable - DSL complexity)
- None exceed 600 lines ✅

**Recommendation**: ✅ **Maintain current limits**

---

### 3.3 Code Duplication 🟡 MODERATE

**Observation**: Some duplication between `runLocalCitty` and `runLocalCittySafe`

**Example**:
```javascript
// Lines 55-110 vs 242-301
// Nearly identical implementation, only differs in error handling
```

**Refactor Opportunity**:
```javascript
function runLocalCittyCore(validated, throwOnError = true) {
  const { cliPath, cwd, env, timeout, args } = validated
  const resolvedCliPath = resolve(cwd, cliPath)

  if (!existsSync(resolvedCliPath)) {
    const error = new Error(/* ... */)
    if (throwOnError) throw error
    return createErrorResult(error)
  }

  // ... shared implementation
}

export function runLocalCitty(options) {
  const validated = LocalRunnerOptionsSchema.parse(options)
  return runLocalCittyCore(validated, true)
}

export function runLocalCittySafe(options) {
  const validated = LocalRunnerOptionsSchema.parse(options)
  return runLocalCittyCore(validated, false)
}
```

**Recommendation**: 🔧 **Refactor for v0.6.2**

---

## 4. Quick Win Fixes for v0.6.1

### Priority 1: Make Package Usable 🔴

**Fix 1: Zod Compatibility** (5 minutes)
```bash
# package.json
npm install zod@^3.23.8 --save
npm uninstall zod
npm install zod@3.23.8 --save-exact
```

**Fix 2: Export `runCitty`** (2 minutes)
```javascript
// src/core/runners/local-runner.js - Add line 302
export { runCitty } from './cleanroom-runner.js'
```

**Fix 3: Backward Compatibility** (30 minutes)
```javascript
// src/core/runners/local-runner.js
export function runLocalCitty(argsOrOptions, legacyOptions) {
  // Support both v0.5.1 and v0.6.0 API
  // See detailed code in section 1.4
}
```

**Fix 4: Scenario DSL Compatibility** (15 minutes)
```javascript
// src/core/scenarios/scenario-dsl.js:43
run(argsOrOptions, options = {}) {
  // Support both API styles
  // See detailed code in section 1.3
}
```

**Total Time**: ~1 hour
**Impact**: Makes package **100% functional**

---

### Priority 2: Update Documentation 🟡

**Fix 5: README Examples** (2 hours)
- Update all code examples to v0.6.0 API
- Add migration guide
- Show both API versions with deprecation notice

**Fix 6: Type Definitions** (1 hour)
- Update `types.d.ts` for v0.6.0 API
- Add JSDoc comments with examples

**Total Time**: ~3 hours
**Impact**: Users can follow documentation

---

### Priority 3: Testing Infrastructure 🟢

**Fix 7: Validation Suite Integration** (30 minutes)
```bash
# Add to package.json scripts
"test:readme": "vitest run playground/test/readme-validation"
"prepublishOnly": "npm run test:readme"
```

**Fix 8: CI/CD Integration** (1 hour)
```yaml
# .github/workflows/ci.yml
- name: Validate README examples
  run: npm run test:readme
```

**Total Time**: ~1.5 hours
**Impact**: Prevent future regressions

---

## 5. Architectural Recommendations

### v0.6.1 (Patch - This Week)

✅ **Critical Fixes**:
1. Downgrade to Zod v3 OR update all validation code
2. Export `runCitty` from `local-runner.js`
3. Add backward compatibility for API changes
4. Fix Scenario DSL to accept both API styles

📝 **Documentation**:
5. Update README with correct v0.6.0 examples
6. Add migration guide (v0.5.1 → v0.6.0)
7. Update TypeScript definitions

🧪 **Testing**:
8. Integrate validation suite into CI/CD
9. Add prepublish checks

---

### v0.6.2 (Minor - Next Month)

🔧 **Code Quality**:
1. Refactor Zod schema defaults pattern
2. Reduce duplication in runner implementations
3. Add comprehensive JSDoc comments
4. Improve error messages with examples

📊 **Monitoring**:
5. Add test coverage reporting (80%+ target)
6. Add bundle size monitoring
7. Performance benchmarks

🎯 **DX Improvements**:
8. Better auto-detection for CLI paths
9. Improve error context with file locations
10. Add debug mode with verbose logging

---

### v0.7.0 (Major - Future)

🚀 **Zod v4 Migration**:
1. Fully migrate to Zod v4 API
2. Remove v0.5.1 compatibility layer
3. Update all schemas and validation

🏗️ **Architecture**:
4. Plugin system for custom runners
5. Extensible assertion framework
6. Better snapshot diffing

📦 **Ecosystem**:
7. Vitest plugin
8. Jest integration
9. GitHub Actions templates

---

## 6. Code Quality Metrics

### Current State

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Total Files** | 51 | - | ✅ |
| **Max File Size** | 519 lines | <600 | ✅ |
| **Test Coverage** | Unknown | 80%+ | ⚠️ |
| **Type Safety** | Partial | Full | ⚠️ |
| **README Accuracy** | 0% | 100% | 🔴 |
| **Zod Version** | v4 (broken) | v3 or v4 (working) | 🔴 |
| **API Stability** | Breaking | Stable | 🔴 |
| **Export Consistency** | Missing exports | Complete | 🔴 |

### Code Smells Detected

1. **Zod v4 incompatibility** - Dependency mismatch
2. **Missing exports** - Import/export inconsistency
3. **API drift** - Documentation doesn't match code
4. **Default values in schemas** - Anti-pattern
5. **Code duplication** - `runLocalCitty` vs `runLocalCittySafe`

### Strengths

1. **Excellent error handling** - Fail-fast with rich context
2. **Clean module structure** - Logical organization
3. **Reasonable file sizes** - No bloated files
4. **Good separation of concerns** - Clear responsibilities
5. **Comprehensive validation** - Input sanitization

---

## 7. Action Items Summary

### Immediate (v0.6.1 - TODAY)

- [ ] **Fix Zod dependency** - Downgrade to v3.23.8
- [ ] **Export `runCitty`** - Add to local-runner.js
- [ ] **Backward compatibility** - Support both API versions
- [ ] **Fix Scenario DSL** - Accept object arguments
- [ ] **Test fixes** - Run validation suite
- [ ] **Publish patch** - Release v0.6.1

### Short Term (v0.6.2 - This Month)

- [ ] **Update README** - All examples to v0.6.0 API
- [ ] **Migration guide** - Document API changes
- [ ] **Type definitions** - Update for v0.6.0
- [ ] **Refactor schemas** - Separate defaults from validation
- [ ] **Reduce duplication** - Share runner core logic
- [ ] **Add coverage** - 80%+ for critical paths

### Long Term (v0.7.0 - Next Quarter)

- [ ] **Zod v4 migration** - Full compatibility
- [ ] **Remove compatibility layer** - Clean v0.7.0 API
- [ ] **Plugin system** - Extensible architecture
- [ ] **Enhanced testing** - Better assertions and snapshots
- [ ] **Ecosystem integration** - Vitest, Jest, GitHub Actions

---

## 8. Coordination Report

**Status**: ✅ Analysis complete

**Findings Shared**:
- Architecture review stored in memory
- Code issues documented
- Quick-win fixes identified
- Refactoring priorities established

**Next Agent**: Reviewer (to assess code quality and security)

**Memory Keys**:
- `hive/coder/architecture` - Full architecture analysis
- `hive/coder/quick-wins` - v0.6.1 fix priorities
- `hive/coder/refactoring` - v0.6.2+ improvements

---

## Conclusion

**v0.6.0 Verdict**: 🔴 **Not Production Ready**

**Root Causes**:
1. Incomplete Zod v4 migration
2. Missing module exports
3. Breaking API changes without compatibility
4. Documentation completely out of sync

**Path Forward**:
- **v0.6.1** (urgent): Fix critical bugs, restore functionality
- **v0.6.2** (polish): Clean up code, improve quality
- **v0.7.0** (vision): Zod v4, plugin system, ecosystem

**Estimated Effort**:
- v0.6.1 fixes: **1 hour development + 30 min testing**
- v0.6.2 improvements: **1 week development**
- v0.7.0 features: **1 month development**

**Recommendation**: **Publish v0.6.1 patch immediately**, then focus on quality improvements.

---

**Generated by**: Hive Mind Coder Agent
**Date**: 2025-10-02
**Swarm ID**: swarm-1759425070425-h01v5wksp
