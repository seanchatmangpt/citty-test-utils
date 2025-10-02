# v0.6.1 Fix Strategy - Comprehensive Implementation Plan

**Date**: 2025-10-02
**Version**: v0.6.1 Planning
**Status**: 🎯 **READY FOR IMPLEMENTATION**
**Priority**: 🔴 **CRITICAL - PRODUCTION BLOCKING**

## Executive Summary

Based on comprehensive validation of v0.6.0, this document provides a **complete, actionable fix strategy** for v0.6.1 patch release. All four critical issues have been analyzed with specific implementation plans.

### Critical Issues (All P1)

| Issue | Impact | Fix Complexity | ETA |
|-------|--------|----------------|-----|
| 1. Zod v4 Incompatibility | 🔴 BREAKING | Low | 30 min |
| 2. Missing `runCitty` Export | 🔴 BREAKING | Low | 15 min |
| 3. Scenario DSL API Mismatch | 🟡 High | Medium | 2 hours |
| 4. README Documentation Drift | 🟡 High | Low | 1 hour |

**Total Estimated Time**: 3-4 hours for complete fix

---

## Issue #1: Zod v4 Incompatibility ⚠️

### Problem Analysis

**Location**: `src/core/runners/local-runner.js:57`

**Error**:
```
TypeError: Cannot read properties of undefined (reading '_zod')
    at LocalRunnerOptionsSchema.parse()
```

**Root Cause**: Zod v4.1.11 has internal API changes. The schema works, but parse() behavior changed.

**Current Code**:
```javascript
// Line 16-26 in local-runner.js
const LocalRunnerOptionsSchema = z.object({
  cliPath: z.string().optional().default(
    process.env.TEST_CLI_PATH || './src/cli.mjs'
  ),
  cwd: z.string().optional().default(
    process.env.TEST_CWD || process.cwd()
  ),
  env: z.record(z.string()).optional().default({}),
  timeout: z.number().positive().optional().default(30000),
  args: z.array(z.string()).optional().default([]),
})
```

### Solution Options

#### ✅ **Option A: Downgrade to Zod v3 (RECOMMENDED)**

**Rationale**:
- Fastest fix with zero code changes
- Proven compatibility with existing codebase
- Low risk, immediate resolution
- Zod v3.23.8 is stable and widely used

**Implementation**:
```json
// package.json
{
  "dependencies": {
    "zod": "^3.23.8"  // Change from ^4.1.11
  }
}
```

**Testing**:
```bash
npm install zod@3.23.8
npm test -- test/unit
npm test -- playground/test/readme-validation
```

**Pros**:
- Zero code changes required
- Immediate fix
- Well-tested version

**Cons**:
- Delays Zod v4 adoption
- Will need migration eventually

#### Option B: Fix Code for Zod v4

**Implementation** (if chosen):
```javascript
// Update schema to handle v4 changes
const LocalRunnerOptionsSchema = z.object({
  cliPath: z.string().default('./src/cli.mjs'),
  cwd: z.string().default(process.cwd()),
  env: z.record(z.string()).default({}),
  timeout: z.number().positive().default(30000),
  args: z.array(z.string()).default([]),
}).transform((data) => ({
  ...data,
  cliPath: data.cliPath || process.env.TEST_CLI_PATH || './src/cli.mjs',
  cwd: data.cwd || process.env.TEST_CWD || process.cwd()
}))
```

**Testing Requirements**:
- All schema validations pass
- Environment variable defaults work
- Optional fields behave correctly
- Error messages are clear

**Pros**:
- Modern Zod version
- Future-proof

**Cons**:
- Requires code changes and testing
- Potential for new bugs
- Delays release

#### 🎯 **DECISION: Option A (Downgrade to v3)**

**Action Items**:
1. Update package.json: `"zod": "^3.23.8"`
2. Run `npm install`
3. Verify all tests pass
4. Document in CHANGELOG

---

## Issue #2: Missing `runCitty` Export 🚨

### Problem Analysis

**Location**: `src/core/scenarios/scenarios.js:2`

**Error**:
```
SyntaxError: The requested module '../runners/local-runner.js'
does not provide an export named 'runCitty'
```

**Root Cause**:
- `scenarios.js` imports `runCitty` from `local-runner.js`
- `local-runner.js` only exports `runLocalCitty`, `wrapWithAssertions`, `runLocalCittySafe`
- `runCitty` doesn't exist anywhere in the codebase

**Current Code**:
```javascript
// src/core/scenarios/scenarios.js:2
import { runLocalCitty, runCitty } from '../runners/local-runner.js'

// Line 14 uses runCitty for cleanroom
return env === 'cleanroom' ? runCitty(args, options) : runLocalCitty(args, options)
```

### Solution Analysis

**Where is `runCitty` supposed to come from?**

Looking at the codebase structure:
- `runLocalCitty` - executes CLI locally (exists)
- `runCitty` - should execute in cleanroom (missing)
- Likely exists in cleanroom-runner module

**Investigation**:
```bash
# Check if cleanroom-runner exists
find src -name "*cleanroom*"
# Expected: src/core/runners/cleanroom-runner.js (or similar)
```

### Solution: Create or Re-export `runCitty`

#### ✅ **Option A: Re-export from Cleanroom Module (RECOMMENDED)**

**If cleanroom-runner.js exists**:

```javascript
// src/core/runners/local-runner.js
// Add at bottom of file:

// Re-export cleanroom runner for convenience
export { runCitty } from './cleanroom-runner.js'
```

**Update index.js**:
```javascript
// index.js - ensure cleanroom exports are included
export * from './src/core/runners/local-runner.js'
export * from './src/core/runners/cleanroom-runner.js' // Add if missing
```

#### Option B: Create Alias (if cleanroom doesn't exist)

```javascript
// src/core/runners/local-runner.js
// Add at bottom:

/**
 * Alias for runLocalCitty for backward compatibility
 * @deprecated Use runLocalCitty instead
 */
export const runCitty = runLocalCitty
```

#### Option C: Fix scenarios.js (if cleanroom is separate)

```javascript
// src/core/scenarios/scenarios.js
import { runLocalCitty } from '../runners/local-runner.js'
import { runCitty } from '../runners/cleanroom-runner.js' // Import from correct module

// ... rest of code unchanged
```

### 🎯 **DECISION: Investigate First, Then Apply Best Option**

**Action Items**:
1. Search for cleanroom-runner module: `find src -name "*cleanroom*"`
2. If found: Use Option A (re-export)
3. If not found: Use Option B (alias) with deprecation warning
4. Update index.js to ensure export
5. Test with: `node -e "import('citty-test-utils').then(m => console.log(m.runCitty))"`

---

## Issue #3: Scenario DSL API Mismatch 🔧

### Problem Analysis

**Location**: `src/core/scenarios/scenario-dsl.js:48`

**Error**:
```
TypeError: args.split is not a function
```

**Root Cause**: Method signature expectations mismatch

**Current Code (line 43-50)**:
```javascript
run(args, options = {}) {
  if (!currentStep) {
    throw new Error('Must call step() before run()')
  }
  // ❌ This assumes args is string or array
  const commandArgs = Array.isArray(args) ? args : args.split(' ')
  currentStep.command = { args: commandArgs, options }
  return this
}
```

**README Shows** (v0.6.0 API):
```javascript
.run({ args: ['--help'], cwd: './path', cliPath: 'cli.mjs' })
```

**But Code Expects**:
```javascript
.run(['--help'], { cwd: './path', cliPath: 'cli.mjs' })
// OR
.run('--help', { cwd: './path', cliPath: 'cli.mjs' })
```

### Solution: Support All Three Signatures

#### ✅ **Recommended: Flexible Method Signature**

```javascript
/**
 * Execute a command in this step
 * @param {string|string[]|Object} argsOrOptions - Command args or full options object
 * @param {Object} [options={}] - Additional options (if first param is args)
 *
 * Supports three signatures:
 * 1. .run('--help')                                    // String args
 * 2. .run(['--help'], { cwd: './path' })              // Array args + options
 * 3. .run({ args: ['--help'], cwd: './path' })        // v0.6.0 style (options object)
 */
run(argsOrOptions, options = {}) {
  if (!currentStep) {
    throw new Error('Must call step() before run()')
  }

  let commandArgs
  let commandOptions

  // Signature detection
  if (typeof argsOrOptions === 'string') {
    // Signature 1: .run('--help') or .run('--help', { options })
    commandArgs = argsOrOptions.split(' ')
    commandOptions = options
  } else if (Array.isArray(argsOrOptions)) {
    // Signature 2: .run(['--help'], { options })
    commandArgs = argsOrOptions
    commandOptions = options
  } else if (typeof argsOrOptions === 'object' && argsOrOptions.args) {
    // Signature 3: .run({ args: ['--help'], cwd: './path', cliPath: 'cli.mjs' })
    // v0.6.0 style - options object with args property
    commandArgs = argsOrOptions.args
    commandOptions = { ...argsOrOptions }
    delete commandOptions.args // Remove args from options to avoid duplication
  } else {
    throw new Error(
      'Invalid run() signature. Expected:\n' +
      '  .run("--help")\n' +
      '  .run(["--help"], { options })\n' +
      '  .run({ args: ["--help"], cwd: "./path" })'
    )
  }

  currentStep.command = { args: commandArgs, options: commandOptions }
  return this
}
```

### Testing Strategy

```javascript
// Test all three signatures
describe('Scenario DSL .run() signatures', () => {
  it('should accept string args', () => {
    const s = scenario('test')
      .step('help')
      .run('--help')
    expect(s._steps[0].command.args).toEqual(['--help'])
  })

  it('should accept array args with options', () => {
    const s = scenario('test')
      .step('help')
      .run(['--help'], { cwd: './path' })
    expect(s._steps[0].command.args).toEqual(['--help'])
    expect(s._steps[0].command.options.cwd).toBe('./path')
  })

  it('should accept v0.6.0 options object', () => {
    const s = scenario('test')
      .step('help')
      .run({ args: ['--help'], cwd: './path', cliPath: 'cli.mjs' })
    expect(s._steps[0].command.args).toEqual(['--help'])
    expect(s._steps[0].command.options.cwd).toBe('./path')
    expect(s._steps[0].command.options.cliPath).toBe('cli.mjs')
  })
})
```

### 🎯 **DECISION: Implement Flexible Signature**

**Action Items**:
1. Update `scenario-dsl.js` with flexible run() method
2. Add comprehensive signature tests
3. Update JSDoc comments
4. Verify all existing tests still pass
5. Test with README examples

---

## Issue #4: README Documentation Drift 📚

### Problem Analysis

**Impact**: ALL code examples in README show v0.5.1 API (old signature)

**Affected Sections**:
| Section | Lines | Example | Issue |
|---------|-------|---------|-------|
| Quick Start | 76-88 | `runLocalCitty(['--help'], {...})` | Wrong signature |
| Multi-step Scenario | 91-103 | `.run('--help', {...})` | Missing cliPath |
| Local Runner | 302-314 | Array as first param | Wrong signature |
| Fluent Assertions | 334-345 | Array as first param | Wrong signature |
| Complete Example | 787-903 | Array as first param | Wrong signature |

### Solution: Update All Examples to v0.6.0 API

#### Template for Updates

**Before (v0.5.1 - WRONG)**:
```javascript
const result = await runLocalCitty(['--help'], {
  cwd: './my-project',
  env: { DEBUG: 'true' }
})
```

**After (v0.6.0 - CORRECT)**:
```javascript
const result = await runLocalCitty({
  args: ['--help'],
  cwd: './my-project',
  cliPath: 'src/cli.mjs',  // Now required
  env: { DEBUG: 'true' }
})
```

### Specific Updates Required

#### 1. Quick Start Section (Lines 76-88)

```markdown
### Quick Start: Drive bundled playground

```javascript
import { runLocalCitty } from 'citty-test-utils'

const result = await runLocalCitty({
  args: ['--help'],
  cwd: './playground',
  cliPath: 'src/cli.mjs',
  env: { TEST_CLI: 'true' }
})

result.expectSuccess().expectOutput('USAGE')
```
```

#### 2. Multi-step Scenario (Lines 91-103)

**Note**: With flexible run() signature (Issue #3 fix), this can support multiple styles:

```markdown
### Build Multi-step Scenarios

```javascript
import { scenario } from 'citty-test-utils'

// Option 1: v0.6.0 style (options object)
await scenario('Playground smoke test')
  .step('Show help')
  .run({ args: ['--help'], cwd: './playground', cliPath: 'src/cli.mjs' })
  .expectSuccess()
  .expectOutput('USAGE')
  .execute('local')

// Option 2: Traditional style (still supported)
await scenario('Playground smoke test')
  .step('Show help')
  .run(['--help'], { cwd: './playground', cliPath: 'src/cli.mjs' })
  .expectSuccess()
  .expectOutput('USAGE')
  .execute('local')
```
```

#### 3. Local Runner Documentation (Lines 302-314)

```markdown
### Local Runner API

```javascript
import { runLocalCitty } from 'citty-test-utils'

// Basic usage
const result = await runLocalCitty({
  args: ['--help'],
  cliPath: 'src/cli.mjs'
})

// With all options
const result = await runLocalCitty({
  args: ['test', 'run'],
  cliPath: './bin/my-cli.js',
  cwd: './my-project',
  env: { DEBUG: '1', NODE_ENV: 'test' },
  timeout: 30000
})
```
```

#### 4. Add Migration Guide Section

```markdown
## Migration Guide: v0.5.1 → v0.6.0

### Breaking Changes

#### 1. API Signature Change

**Before (v0.5.1)**:
```javascript
runLocalCitty(['--help'], { cwd: './project' })
```

**After (v0.6.0)**:
```javascript
runLocalCitty({
  args: ['--help'],
  cwd: './project',
  cliPath: 'src/cli.mjs'  // Now required
})
```

#### 2. cliPath Now Required

All `runLocalCitty()` calls must specify `cliPath`:

```javascript
const result = await runLocalCitty({
  args: ['--help'],
  cliPath: 'src/cli.mjs'  // Required in v0.6.0
})
```

#### 3. Zod Validation

v0.6.0 uses Zod for options validation with fail-fast behavior:

```javascript
// Invalid options throw immediately
runLocalCitty({ args: 'not-an-array' })
// ZodError: Expected array, received string
```

### Why These Changes?

1. **Type Safety**: Zod validation catches errors early
2. **Fail-Fast**: Issues detected before execution
3. **Explicit Configuration**: cliPath requirement prevents ambiguity
4. **Better Error Messages**: Clear validation errors
```

### 🎯 **DECISION: Comprehensive README Update**

**Action Items**:
1. Update Quick Start examples (lines 76-103)
2. Update Local Runner section (lines 302-450)
3. Update Scenario DSL examples (lines 614-750)
4. Update Complete Examples (lines 787-903)
5. Add Migration Guide section
6. Update API Reference with all signatures
7. Add deprecation notices where applicable

---

## Implementation Plan

### Phase 1: Critical Fixes (2-3 hours)

**Priority 1 - Blocking Issues**:

1. **✅ Fix Zod Dependency** (30 min)
   - Update package.json to Zod v3.23.8
   - Run `npm install`
   - Verify all tests pass
   - Document in CHANGELOG

2. **✅ Fix Missing Export** (15 min)
   - Investigate cleanroom-runner location
   - Add runCitty export to local-runner.js
   - Update index.js if needed
   - Test: `import { runCitty } from 'citty-test-utils'`

3. **✅ Fix Scenario DSL** (2 hours)
   - Implement flexible run() signature
   - Add comprehensive tests for all signatures
   - Update JSDoc documentation
   - Verify all existing tests pass
   - Test with README examples

### Phase 2: Documentation (1 hour)

**Priority 1 - User Impact**:

4. **✅ Update README** (1 hour)
   - Fix Quick Start examples
   - Fix all API examples
   - Add Migration Guide section
   - Update API Reference
   - Add deprecation notices

### Phase 3: Validation (30 min)

**Priority 1 - Quality Gate**:

5. **✅ Pre-Publish Testing**
   - Run all unit tests: `npm run test:unit`
   - Run all integration tests: `npm run test:integration`
   - Run README validation: `npm test -- playground/test/readme-validation`
   - Manual test: Follow Quick Start from README
   - Verify exports: Test all documented exports

### Phase 4: Release (30 min)

**Priority 1 - Deployment**:

6. **✅ Publish v0.6.1**
   - Update version in package.json to 0.6.1
   - Update CHANGELOG.md with fixes
   - Commit changes: `git commit -m "v0.6.1: Critical bug fixes"`
   - Create git tag: `git tag v0.6.1`
   - Publish to npm: `npm publish`
   - Push to GitHub: `git push && git push --tags`

---

## Detailed File Changes

### Files to Modify

| File | Changes | Lines | Priority |
|------|---------|-------|----------|
| `package.json` | Update Zod to v3.23.8 | 1 | P1 |
| `src/core/runners/local-runner.js` | Add runCitty export | 1-3 | P1 |
| `src/core/scenarios/scenario-dsl.js` | Fix run() signature | 15-30 | P1 |
| `index.js` | Ensure cleanroom exports | 1-2 | P1 |
| `README.md` | Update all examples | ~200 | P1 |
| `CHANGELOG.md` | Document fixes | 10-20 | P1 |

### Files to Create

| File | Purpose | Priority |
|------|---------|----------|
| `docs/FIX-STRATEGY-v0.6.1.md` | This document | P1 |
| `test/unit/scenario-dsl-signatures.test.mjs` | Test all run() signatures | P2 |

---

## Risk Assessment

### Low Risk Changes ✅

1. **Zod Downgrade**: Reverting to known-good version
2. **Export Addition**: Adding missing export is non-breaking
3. **README Updates**: Documentation only, no code impact

### Medium Risk Changes ⚠️

4. **Scenario DSL run() Method**:
   - **Risk**: Could break existing tests if not careful
   - **Mitigation**: Comprehensive testing, backward compatibility
   - **Fallback**: Revert to original if issues found

### Testing Coverage

**Required Test Pass Rate**: 100%

- Unit tests: 100% pass
- Integration tests: 100% pass
- README validation tests: 100% pass (6/6 tests)
- Manual Quick Start: Success

---

## Rollback Plan

If issues are discovered after v0.6.1 release:

### Immediate Rollback (< 1 hour)

1. Unpublish v0.6.1 if within 72 hours: `npm unpublish citty-test-utils@0.6.1`
2. Revert git changes: `git revert <commit-hash>`
3. Publish v0.6.2 with revert
4. Update README with known issues

### Phased Rollback (> 72 hours)

1. Cannot unpublish, must publish v0.6.2 with fixes
2. Add deprecation warning to v0.6.1 in npm
3. Update documentation with upgrade path
4. Investigate and fix properly for v0.6.3

---

## Success Criteria

### Pre-Release Checklist

- [ ] All P1 fixes implemented
- [ ] Zod v3.23.8 installed and working
- [ ] runCitty export available
- [ ] Scenario DSL supports all signatures
- [ ] README updated with v0.6.0 API
- [ ] Migration guide added
- [ ] All unit tests pass (100%)
- [ ] All integration tests pass (100%)
- [ ] All README validation tests pass (6/6)
- [ ] Manual Quick Start test successful
- [ ] CHANGELOG.md updated
- [ ] Version bumped to 0.6.1
- [ ] Git tag created

### Post-Release Validation

- [ ] Package published to npm
- [ ] Install test: `npm install citty-test-utils@0.6.1`
- [ ] Import test: `import { runLocalCitty, runCitty, scenario } from 'citty-test-utils'`
- [ ] Quick Start works from README
- [ ] GitHub release created
- [ ] Users notified of fix release

---

## Timeline

**Total Time**: 3.5-4.5 hours

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Critical Fixes | 2.5 hours | 🟡 Ready |
| Phase 2: Documentation | 1 hour | 🟡 Ready |
| Phase 3: Validation | 30 min | 🟡 Ready |
| Phase 4: Release | 30 min | 🟡 Ready |

**Target Release Date**: Same day as implementation start

---

## Additional Recommendations

### Short Term (v0.6.2)

1. **Add Pre-Publish Script**:
   ```bash
   # scripts/pre-publish-validation.sh
   npm run test:unit
   npm run test:integration
   cd playground && npm test -- test/readme-validation
   ```

2. **Add to package.json**:
   ```json
   "scripts": {
     "prepublishOnly": "./scripts/pre-publish-validation.sh"
   }
   ```

### Long Term (v0.7.0)

1. **Migrate to Zod v4 Properly**:
   - Update all schemas
   - Test thoroughly
   - Add migration guide

2. **Automated README Testing**:
   - Extract code blocks from README
   - Run as part of CI/CD
   - Prevent future drift

3. **API Versioning**:
   - Consider API version exports
   - Deprecation warnings for old signatures
   - Clear upgrade paths

---

## Conclusion

This fix strategy provides a **complete, actionable plan** to resolve all v0.6.0 critical issues in v0.6.1:

✅ **Fast**: 3-4 hours total implementation time
✅ **Safe**: Low-risk changes with comprehensive testing
✅ **Complete**: Addresses all 4 critical issues
✅ **Documented**: README and migration guide updated
✅ **Tested**: 100% test coverage requirement

**Recommendation**: Implement immediately and release same day.

---

**Next Steps**:
1. Review and approve this strategy
2. Assign implementation to development team
3. Execute Phase 1 (Critical Fixes)
4. Execute Phase 2 (Documentation)
5. Execute Phase 3 (Validation)
6. Execute Phase 4 (Release)
7. Monitor post-release for issues
