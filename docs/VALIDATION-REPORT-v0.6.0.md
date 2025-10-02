# v0.6.0 Validation Report

**Date**: 2025-10-02
**Version Tested**: 0.6.0
**Status**: 🔴 **CRITICAL ISSUES FOUND**

## Executive Summary

Testing v0.6.0 against README examples reveals **critical breaking issues** that prevent users from following any documentation examples. The package is **not production-ready** as published.

### Critical Issues Found

1. ❌ **Zod v4 Compatibility Broken** - Schema validation fails
2. ❌ **Missing Exports** - `runCitty` not exported from local-runner
3. ❌ **API Documentation Mismatch** - README shows incompatible API
4. ❌ **Scenario DSL Broken** - `.run()` method signature mismatch

## Detailed Issues

### 1. Zod v4 Compatibility Issue

**Error**:
```
TypeError: Cannot read properties of undefined (reading '_zod')
```

**Location**: `src/core/runners/local-runner.js:57`

**Cause**: Zod v4.1.11 has breaking changes from v3. The `parse()` method behavior changed.

**Impact**: **ALL** `runLocalCitty()` calls fail immediately

**Fix Required**:
- Downgrade to Zod v3
- OR update validation code for Zod v4 API changes
- OR add Zod v4 adapter layer

### 2. Missing `runCitty` Export

**Error**:
```
SyntaxError: The requested module '../runners/local-runner.js' does not provide an export named 'runCitty'
```

**Location**: `src/core/scenarios/scenarios.js:2`

**Cause**: `local-runner.js` only exports `runLocalCitty`, but `scenarios.js` imports `runCitty`

**Impact**: Cannot use scenarios or cleanroom testing

**Fix Required**:
- Export `runCitty` from `local-runner.js`
- OR import from correct module (likely `cleanroom-runner.js`)
- OR update scenarios.js imports

### 3. Scenario DSL API Mismatch

**Error**:
```
TypeError: args.split is not a function
```

**Location**: `src/core/scenarios/scenario-dsl.js:48`

**Cause**: `.run()` method expects string or array, but receives object

**Current Code**:
```javascript
const commandArgs = Array.isArray(args) ? args : args.split(' ')
```

**What We Passed** (following README):
```javascript
.run({ args: ['--help'], cwd: './path', cliPath: 'cli.mjs' })
```

**Impact**: Cannot use scenario DSL at all

**Fix Required**:
- Update README to show correct scenario API
- OR update scenario-dsl.js to accept options object
- OR document actual expected format

### 4. README Examples Completely Broken

**ALL** these README sections have broken examples:

| Section | Line | Example | Issue |
|---------|------|---------|-------|
| Quick Start | 76-88 | `runLocalCitty(['--help'], {...})` | Wrong API signature |
| Multi-step Scenario | 91-103 | `.run('--help', {...})` | Scenario API mismatch |
| Local Runner | 302-314 | Array as first param | Wrong API signature |
| Fluent Assertions | 334-345 | Array as first param | Wrong API signature |
| Complete Example | 787-903 | Array as first param | Wrong API signature |

## Test Results

```
✗ Quick Start: Drive bundled playground - Zod validation error
✗ Quick Start: Build multi-step scenario - Scenario DSL error
✗ Quick Start: Inspect toolkit CLI - Missing export error
```

**Pass Rate**: 0/3 (0%)

## Impact Assessment

### Severity: 🔴 **CRITICAL**

**Who is Affected**:
- ✅ New users following Quick Start - **BROKEN**
- ✅ Users upgrading from v0.5.1 - **BROKEN**
- ✅ Existing projects - **BROKEN** (if they update)
- ✅ Documentation examples - **ALL BROKEN**

**What Works**:
- ❌ Quick Start examples - FAIL
- ❌ Local Runner examples - FAIL
- ❌ Scenario DSL examples - FAIL
- ❌ Cleanroom examples - FAIL (missing export)
- ✅ CLI commands (may work if used directly via CLI)

## Root Causes

1. **Breaking Dependency Change**: Zod v3 → v4 without code updates
2. **Incomplete Refactor**: API changed but exports not updated
3. **No Integration Testing**: Examples never tested against published package
4. **Missing Migration Guide**: No upgrade path from v0.5.1
5. **README Not Updated**: Still shows v0.5.1 API

## Recommended Actions

### Immediate (v0.6.1 Patch - TODAY)

1. **Fix Zod Compatibility**
   ```json
   // package.json
   "dependencies": {
     "zod": "^3.23.8"  // Downgrade to v3
   }
   ```

2. **Fix Missing Export**
   ```javascript
   // src/core/runners/local-runner.js
   export { runCitty } from './cleanroom-runner.js'
   ```

3. **Publish v0.6.1 Immediately**
   - Fix these critical bugs
   - Test against README examples
   - Publish patch release

### Short Term (v0.6.2 - This Week)

4. **Update README**
   - Fix ALL code examples
   - Show actual v0.6.0 API
   - Add migration guide

5. **Add Integration Tests**
   - Test every README example
   - CI/CD validation
   - Prevent future drift

### Long Term (v0.7.0 - Next Release)

6. **API Versioning**
   - Semantic versioning strictly
   - Deprecation warnings
   - Backward compatibility layer

7. **Better Testing**
   - Automated README example testing
   - Pre-publish validation
   - Integration test suite

## Current Package Status

**v0.6.0 is NOT USABLE** as published:

- ❌ Cannot follow Quick Start
- ❌ Cannot use Local Runner
- ❌ Cannot use Scenario DSL
- ❌ Cannot use Cleanroom Testing
- ✅ CLI commands might work (untested)

## Validation Test Suite

Created comprehensive test suite in `playground/test/readme-validation/`:

1. ✅ `01-quick-start.test.mjs` - Quick Start examples
2. ✅ `02-fluent-assertions.test.mjs` - Fluent API examples
3. ✅ `03-scenario-dsl.test.mjs` - Scenario DSL examples
4. ✅ `04-local-runner.test.mjs` - Local Runner examples
5. ✅ `05-cli-commands.test.mjs` - CLI command examples
6. ✅ `06-complete-example.test.mjs` - Complete workflow examples

**Status**: All tests fail due to critical bugs above

## Recommendation

### DO NOT USE v0.6.0

Users should:
1. **Stay on v0.5.1** until patch released
2. **Do not upgrade** to v0.6.0
3. **Wait for v0.6.1** with critical fixes

### For Maintainers

1. **Immediate hotfix required** (v0.6.1)
2. **Test before publishing** (use validation suite)
3. **Update README** to match implementation
4. **Add deprecation path** for API changes

## Files Created

Documentation:
- ✅ `docs/v0.6.0-API-ISSUES.md` - Detailed API problems
- ✅ `docs/VALIDATION-REPORT-v0.6.0.md` - This report

Test Suites:
- ✅ `playground/test/readme-validation/` - 6 test files
- ✅ Comprehensive coverage of README examples
- ✅ Ready to use for v0.6.1 validation

## Next Steps

1. [ ] Fix Zod dependency (v4 → v3 or fix validation code)
2. [ ] Fix missing `runCitty` export
3. [ ] Fix Scenario DSL API mismatch
4. [ ] Test all fixes with validation suite
5. [ ] Update README with correct API examples
6. [ ] Publish v0.6.1 patch release
7. [ ] Add CI/CD to prevent future issues

---

**Conclusion**: v0.6.0 has critical bugs preventing **ALL** programmatic usage. A patch release is **urgently needed**.
