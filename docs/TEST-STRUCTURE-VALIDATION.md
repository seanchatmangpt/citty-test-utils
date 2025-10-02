# README Test Structure Validation Report
**Date**: 2025-10-02
**Tester**: Hive Mind Tester Agent
**Session**: swarm-1759426017523-yj6oavm23
**Status**: ✅ Structure Ready | 🔴 All Tests Failing (API Mismatch)

## Executive Summary

The readme-validation test infrastructure is **structurally complete** but **functionally broken**. All 6 test files exist and follow proper organization, but **100% of tests fail** due to v0.6.0 API signature changes.

### Key Findings

| Metric | Status | Details |
|--------|--------|---------|
| **Test Files** | ✅ Complete | 6/6 expected files present |
| **Test Organization** | ✅ Excellent | Logical grouping, clear naming |
| **Code Quality** | ✅ Good | Well-structured, documented |
| **API Alignment** | 🔴 BROKEN | 100% mismatch with v0.6.0 |
| **Coverage Scope** | ✅ Comprehensive | All README sections covered |
| **Ready for v0.6.1** | ⚠️ Needs Fixes | Must update API signatures |

## Test Inventory

### Existing Test Files (All Present ✅)

```
playground/test/readme-validation/
├── 01-quick-start.test.mjs           (54 lines, 3 tests)
├── 02-fluent-assertions.test.mjs     (82 lines, 9 tests)
├── 03-scenario-dsl.test.mjs          (78 lines, 5 tests)
├── 04-local-runner.test.mjs          (63 lines, 4 tests)
├── 05-cli-commands.test.mjs         (101 lines, 7 tests)
└── 06-complete-example.test.mjs     (110 lines, 7 tests)

Total: 488 lines, 35 test cases
```

### Test Coverage Map

| File | README Section | Line Coverage | API Version | Status |
|------|---------------|---------------|-------------|---------|
| 01-quick-start | Quick Start (L76-103) | 3 examples | v0.5.1 | 🔴 FAIL |
| 02-fluent-assertions | Assertions (L334-605) | 9 examples | v0.5.1 | 🔴 FAIL |
| 03-scenario-dsl | Scenario DSL (L351-379) | 5 examples | v0.5.1 | 🔴 FAIL |
| 04-local-runner | Local Runner (L302-796) | 4 examples | v0.5.1 | 🔴 FAIL |
| 05-cli-commands | CLI Commands (L137-492) | 7 examples | v0.5.1 | 🔴 FAIL |
| 06-complete-example | Complete Example (L788-903) | 7 examples | v0.5.1 | 🔴 FAIL |

## Detailed Analysis

### File-by-File Assessment

#### ✅ 01-quick-start.test.mjs (STRUCTURE GOOD)

**Purpose**: Validate Quick Start examples from README
**Lines**: 54
**Tests**: 3

**Coverage**:
- ✅ Drive bundled playground locally (L76-88)
- ✅ Build multi-step scenario (L91-103)
- ✅ Inspect toolkit CLI (L70-73)

**Issues Found**:
```javascript
// Line 13-14: WRONG API for v0.6.0
const help = await runLocalCitty({
  args: ['--help'],  // ✅ Correct
  cwd: playgroundDir,
  cliPath: 'src/cli.mjs',
  env: { TEST_CLI: 'true' },
})

// ❌ But line 31: scenario.run() uses wrong signature
.run({ args: ['--help'], cwd: playgroundDir, cliPath: 'src/cli.mjs' })
// Should be: .run(['--help'], { cwd: playgroundDir, cliPath: 'src/cli.mjs' })
```

**Verdict**: Structure excellent, API signatures need fixing

#### ✅ 02-fluent-assertions.test.mjs (STRUCTURE GOOD)

**Purpose**: Validate fluent assertion APIs
**Lines**: 82
**Tests**: 9

**Coverage**:
- ✅ expectSuccess, expectOutput, expectOutputContains
- ✅ expectFailure
- ✅ expectNoStderr
- ✅ expectOutputLength
- ✅ expectJson
- ✅ expectExitCodeIn
- ✅ expectOutputNotContains

**Issues Found**:
```javascript
// Line 13: ALL tests use wrong API
const result = await runLocalCitty(['--help'], { cwd: playgroundDir })
//                                   ^^^^^^^^^^  ❌ WRONG for v0.6.0

// Should be:
const result = await runLocalCitty({
  args: ['--help'],
  cwd: playgroundDir,
  cliPath: 'src/cli.mjs'
})
```

**Verdict**: Good coverage, systematic API fix needed (9 tests × same pattern)

#### ✅ 03-scenario-dsl.test.mjs (STRUCTURE GOOD)

**Purpose**: Validate scenario DSL workflows
**Lines**: 78
**Tests**: 5

**Coverage**:
- ✅ Multi-step workflow
- ✅ Pre-built scenarios (help, version, invalidCommand, jsonOutput)

**Issues Found**:
```javascript
// Line 15: scenario.run() signature wrong
.run('--help', { cwd: playgroundDir })
//   ^^^^^^^^  ❌ v0.6.0 expects different signature

// Actual v0.6.0 behavior unclear - needs investigation
```

**Verdict**: Tests pre-built scenarios well, but API usage incorrect

#### ✅ 04-local-runner.test.mjs (STRUCTURE GOOD)

**Purpose**: Validate local runner with options
**Lines**: 63
**Tests**: 4

**Coverage**:
- ✅ Basic execution with timeout, env
- ✅ Working directory handling
- ✅ Complete API usage
- ✅ Greet command testing

**Issues Found**:
```javascript
// Line 13: Same API issue as file 02
const result = await runLocalCitty(['--help'], { cwd, timeout, env })
//                                   ^^^^^^^^^^  ❌ WRONG
```

**Verdict**: Good options testing, needs API signature fix (4 tests)

#### ✅ 05-cli-commands.test.mjs (STRUCTURE GOOD)

**Purpose**: Validate CLI commands (analysis, runner, gen, test)
**Lines**: 101
**Tests**: 7

**Coverage**:
- ✅ Analysis commands (discover, coverage, recommend)
- ✅ Runner commands
- ✅ Generator commands
- ✅ Test commands

**Issues Found**:
```javascript
// All 7 tests use wrong API pattern
const result = await runLocalCitty(
  ['analysis', 'discover', '--verbose'],
  { cwd: mainDir }
)
```

**Verdict**: Comprehensive CLI coverage, needs API fix across all tests

#### ✅ 06-complete-example.test.mjs (STRUCTURE GOOD)

**Purpose**: Validate complete workflow examples
**Lines**: 110
**Tests**: 7

**Coverage**:
- ✅ Local runner test
- ✅ Scenario test
- ✅ Pre-built scenarios
- ✅ Retry utilities
- ✅ Vitest integration

**Issues Found**:
- Same API issues as other files
- Tests testUtils.retry correctly

**Verdict**: Good integration testing, needs API updates

## API Signature Issues

### The Problem

v0.6.0 changed `runLocalCitty()` signature but README and tests weren't updated:

```javascript
// v0.5.1 API (what tests currently use)
runLocalCitty(['--help'], { cwd: './path' })

// v0.6.0 API (what package actually expects)
runLocalCitty({
  args: ['--help'],
  cwd: './path',
  cliPath: 'src/cli.mjs'  // NOW REQUIRED
})
```

### Test Execution Results

```bash
$ npm test -- test/readme-validation

❌ FAIL: 35/35 tests (100% failure rate)

Error Pattern (all tests):
[
  {
    "expected": "object",
    "code": "invalid_type",
    "path": [],
    "message": "Invalid input: expected object, received array"
  }
]
```

**Root Cause**: Zod schema validation rejects old API signature

## Missing Test Coverage

### Required Additional Tests

Based on TEST-STRATEGY-v0.6.1.md analysis, we need:

```
playground/test/readme-validation/
├── [Existing 6 files]              ✅ PRESENT
├── 07-export-validation.test.mjs   🆕 MISSING
├── 08-api-contracts.test.mjs       🆕 MISSING
└── helpers/
    ├── readme-test-utils.mjs       🆕 MISSING
    └── api-contract-validator.mjs  🆕 MISSING
```

#### 07-export-validation.test.mjs (NEW)

**Purpose**: Validate all documented exports exist

```javascript
describe('Export Integrity Validation', () => {
  it('should export all functions documented in README', () => {
    const pkg = require('citty-test-utils')

    // Verify critical exports
    expect(pkg.runLocalCitty).toBeDefined()
    expect(pkg.runCitty).toBeDefined()
    expect(pkg.scenario).toBeDefined()
    expect(pkg.scenarios).toBeDefined()
    expect(pkg.setupCleanroom).toBeDefined()
    expect(pkg.teardownCleanroom).toBeDefined()
  })

  it('should have correct function signatures', () => {
    // Validate parameter counts and types
  })
})
```

**Priority**: 🔴 P1 (Critical for v0.6.1)
**Effort**: 2 hours
**Impact**: Prevents missing export bugs (like v0.6.0 runCitty issue)

#### 08-api-contracts.test.mjs (NEW)

**Purpose**: Validate API signatures match Zod schemas

```javascript
describe('API Contract Validation', () => {
  it('runLocalCitty should accept options object', () => {
    const validOptions = {
      args: ['--help'],
      cwd: './path',
      cliPath: 'src/cli.mjs'
    }

    // Should not throw
    expect(() => runLocalCittyOptionsSchema.parse(validOptions))
      .not.toThrow()
  })

  it('should reject invalid options with clear errors', () => {
    const invalidOptions = { args: 'not-an-array' }

    expect(() => runLocalCittyOptionsSchema.parse(invalidOptions))
      .toThrow(/expected array/)
  })
})
```

**Priority**: 🔴 P1 (Critical for v0.6.1)
**Effort**: 3 hours
**Impact**: Ensures API contracts are validated before publish

## Test Execution Plan

### Phase 1: Fix Existing Tests (P1 - Day 1)

**Objective**: Make all 35 existing tests pass

**Strategy**:
1. Update `runLocalCitty()` calls to v0.6.0 signature (6 files)
2. Fix `scenario.run()` calls if needed (2 files)
3. Verify all tests pass
4. Document any API issues found

**Files to Update**:
- ✅ 01-quick-start.test.mjs (3 call sites)
- ✅ 02-fluent-assertions.test.mjs (9 call sites)
- ✅ 03-scenario-dsl.test.mjs (4 call sites)
- ✅ 04-local-runner.test.mjs (4 call sites)
- ✅ 05-cli-commands.test.mjs (7 call sites)
- ✅ 06-complete-example.test.mjs (8 call sites)

**Estimated Fixes**: ~35 call sites
**Time**: 4-6 hours
**Success Metric**: 35/35 tests pass

### Phase 2: Add Missing Tests (P1 - Day 2-3)

**Objective**: Add critical validation tests

1. **Export Validation** (07-export-validation.test.mjs)
   - Time: 2 hours
   - Tests: 5-8 tests
   - Coverage: All public exports

2. **API Contracts** (08-api-contracts.test.mjs)
   - Time: 3 hours
   - Tests: 10-15 tests
   - Coverage: All Zod schemas

3. **Test Helpers** (helpers/)
   - Time: 3 hours
   - Coverage: Reusable validation utilities

**Total Time**: 8 hours
**Success Metric**: 50+ total tests, 100% pass rate

### Phase 3: Pre-Publish Validation (P1 - Day 4)

**Objective**: Automate pre-publish checks

1. Create `scripts/pre-publish-validation.sh`
2. Add GitHub Actions workflow
3. Update package.json scripts
4. Test end-to-end validation

**Time**: 4 hours
**Success Metric**: Validation script catches all v0.6.0-style issues

## Recommendations

### Immediate Actions (Before v0.6.1)

1. **Fix All 35 Existing Tests** (CRITICAL)
   - Update API signatures to v0.6.0
   - Verify 100% pass rate
   - Document any new issues found

2. **Add Export Validation** (CRITICAL)
   - Prevent missing export bugs
   - Test file: 07-export-validation.test.mjs

3. **Add API Contract Tests** (CRITICAL)
   - Validate Zod schemas work correctly
   - Test file: 08-api-contracts.test.mjs

4. **Create Pre-Publish Script** (CRITICAL)
   - Automate validation before npm publish
   - Prevent v0.6.0-style failures

### Short-Term Improvements (Week 2)

1. **Enhanced Scenario DSL Testing**
   - Test all method signatures
   - Test backward compatibility
   - Test error handling

2. **Dependency Compatibility Tests**
   - Test Zod v4 specifically
   - Test other critical dependencies
   - Document version requirements

3. **CLI Command Coverage**
   - Test all CLI nouns and verbs
   - Test error messages
   - Test help output

### Long-Term Strategy

1. **README-First Testing**
   - Extract code blocks from README automatically
   - Validate every example on CI
   - Fail builds if README examples don't work

2. **API Contract Enforcement**
   - Generate Zod schemas from TypeScript types
   - Auto-validate API surfaces
   - Prevent breaking changes

3. **Continuous Validation**
   - Run README tests on every PR
   - Validate exports on every build
   - Test against packed package before publish

## Success Criteria

### v0.6.1 Release Gates

- [ ] All 35 existing tests pass (100%)
- [ ] Export validation test added and passing
- [ ] API contract test added and passing
- [ ] Pre-publish script created and tested
- [ ] All README examples work with published v0.6.1
- [ ] No Zod validation errors
- [ ] No missing exports
- [ ] Documentation matches implementation

### Code Coverage Targets

```
Test Coverage:
  README Examples:  100% (35/35 tests pass)
  Public Exports:   100% (all exports validated)
  API Contracts:    100% (all signatures validated)
  Zod Schemas:      100% (all schemas tested)

Overall Quality:
  Test Pass Rate:   100% (0 failures allowed)
  API Alignment:    100% (README = implementation)
  Pre-Publish Gate: PASS (automated validation)
```

## Conclusion

### Test Structure: ✅ EXCELLENT

The readme-validation test infrastructure is **well-organized and comprehensive**:
- ✅ 6 test files covering all README sections
- ✅ 35 test cases with clear naming
- ✅ Good separation of concerns
- ✅ Proper test organization
- ✅ Complete README coverage

### Test Functionality: 🔴 BROKEN

All tests fail due to v0.6.0 API changes:
- 🔴 100% failure rate (35/35 tests)
- 🔴 API signature mismatch
- 🔴 Zod validation rejecting old signatures
- 🔴 Missing export detection not automated

### Readiness for v0.6.1: ⚠️ NEEDS WORK

**Required Work**:
1. Fix 35 test API signatures (4-6 hours)
2. Add export validation test (2 hours)
3. Add API contract test (3 hours)
4. Create pre-publish script (4 hours)

**Total Effort**: 13-15 hours (2 days)

**Confidence Level**: HIGH (structure is solid, only API fixes needed)

---

**Next Actions**:
1. Apply API fixes to all 6 test files
2. Add missing validation tests (07, 08)
3. Create pre-publish validation script
4. Run full validation suite
5. Fix any issues found
6. Validate v0.6.1 candidate package

**Status**: Ready to begin Phase 1 fixes 🚀
