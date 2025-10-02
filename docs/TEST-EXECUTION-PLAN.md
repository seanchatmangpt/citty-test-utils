# Test Execution Plan for v0.6.1 Validation

**Date**: 2025-10-02
**Prepared By**: Hive Mind Tester Agent
**Status**: 🎯 Ready to Execute
**Estimated Time**: 2 days (13-15 hours)

## Overview

This plan outlines the systematic approach to fix and enhance the readme-validation test suite for v0.6.1 release validation.

## Current State

```
Test Structure:    ✅ EXCELLENT (6 files, 35 tests, well-organized)
Test Functionality: 🔴 BROKEN (100% failure rate due to API mismatch)
Missing Coverage:  ⚠️ GAPS (export validation, API contracts)
Automation:        ❌ NONE (no pre-publish validation)
```

## Execution Phases

### Phase 1: API Signature Fixes (Priority P1 - Day 1)

**Objective**: Fix all 35 existing tests to use v0.6.0 API

**Time Estimate**: 4-6 hours
**Success Criteria**: 35/35 tests pass (100% pass rate)
**Release Blocker**: YES

#### Files to Fix (6 total)

##### 1. `01-quick-start.test.mjs` (3 call sites)

**Current Code**:
```javascript
// Line 13-18: ✅ Already correct
const help = await runLocalCitty({
  args: ['--help'],
  cwd: playgroundDir,
  cliPath: 'src/cli.mjs',
  env: { TEST_CLI: 'true' },
})

// Line 31: ❌ BROKEN - scenario.run() signature
.run({ args: ['--help'], cwd: playgroundDir, cliPath: 'src/cli.mjs', env: { TEST_CLI: 'true' } })

// Line 35: ❌ BROKEN - scenario.run() signature
.run({ args: ['invalid-command'], cwd: playgroundDir, cliPath: 'src/cli.mjs', env: { TEST_CLI: 'true' } })

// Line 44-47: ✅ Already correct
const result = await runLocalCitty({
  args: ['--show-help'],
  cwd: join(__dirname, '../../..'),
  cliPath: 'src/cli.mjs',
})
```

**Fix Required**: Update scenario.run() signatures (2 call sites)

**Estimated Time**: 30 minutes

##### 2. `02-fluent-assertions.test.mjs` (9 call sites)

**Pattern to Fix** (repeated 9 times):
```javascript
// ❌ CURRENT (v0.5.1 API)
const result = await runLocalCitty(['--help'], { cwd: playgroundDir })

// ✅ FIXED (v0.6.0 API)
const result = await runLocalCitty({
  args: ['--help'],
  cwd: playgroundDir,
  cliPath: 'src/cli.mjs'
})
```

**Call Sites**:
- Line 13: expectSuccess and expectOutput
- Line 24: expectFailure
- Line 32: expectNoStderr
- Line 38: expectOutputLength
- Line 45: JSON validation
- Line 57: Complete assertion chain
- Line 70: expectExitCodeIn
- Line 77: expectOutputNotContains
- Line 46: JSON validation with --json flag

**Estimated Time**: 1 hour

##### 3. `03-scenario-dsl.test.mjs` (4 call sites)

**Pattern to Fix** (scenario.run() calls):
```javascript
// ❌ CURRENT
.run('--help', { cwd: playgroundDir })
.run(['--version'], { cwd: playgroundDir })

// ✅ NEED TO DETERMINE correct v0.6.0 signature
// Option A: Keep string/array args
.run(['--help'], { cwd: playgroundDir, cliPath: 'src/cli.mjs' })

// Option B: Use options object
.run({ args: ['--help'], cwd: playgroundDir, cliPath: 'src/cli.mjs' })
```

**Investigation Required**: Check actual v0.6.0 scenario.run() signature

**Call Sites**:
- Line 15: run('--help', ...)
- Line 19: run('--version', ...)
- Line 23: run('invalid-command', ...)
- Line 34-40: Multiple run() calls in complex workflow

**Estimated Time**: 1.5 hours (includes investigation)

##### 4. `04-local-runner.test.mjs` (4 call sites)

**Pattern to Fix** (same as file 02):
```javascript
// ❌ CURRENT
await runLocalCitty(['--help'], { cwd, timeout, env })

// ✅ FIXED
await runLocalCitty({
  args: ['--help'],
  cwd: playgroundDir,
  cliPath: 'src/cli.mjs',
  timeout: 30000,
  env: { DEBUG: 'true' }
})
```

**Call Sites**:
- Line 13: Basic execution with options
- Line 26: With working directory
- Line 35: Complete API usage
- Line 55: Testing greet command

**Estimated Time**: 45 minutes

##### 5. `05-cli-commands.test.mjs` (7 call sites)

**Pattern to Fix**:
```javascript
// ❌ CURRENT
await runLocalCitty(
  ['analysis', 'discover', '--verbose'],
  { cwd: mainDir }
)

// ✅ FIXED
await runLocalCitty({
  args: ['analysis', 'discover', '--verbose'],
  cwd: mainDir,
  cliPath: 'src/cli.mjs'
})
```

**Call Sites**:
- Line 14: analysis discover
- Line 27: analysis discover with --entry-file
- Line 40: analysis coverage
- Line 53: analysis recommend
- Line 67: runner local
- Line 78: gen project
- Line 90: test run

**Estimated Time**: 1 hour

##### 6. `06-complete-example.test.mjs` (8 call sites)

**Mixed patterns** - includes both runLocalCitty and scenario.run():
```javascript
// runLocalCitty calls (5x)
// scenario.run() calls (3x)
```

**Estimated Time**: 1 hour

#### Phase 1 Summary

| File | Call Sites | Pattern | Time | Difficulty |
|------|-----------|---------|------|------------|
| 01-quick-start | 3 | Mixed | 30min | Medium |
| 02-fluent-assertions | 9 | Uniform | 1hr | Easy |
| 03-scenario-dsl | 4 | scenario.run() | 1.5hr | Hard |
| 04-local-runner | 4 | Uniform | 45min | Easy |
| 05-cli-commands | 7 | Uniform | 1hr | Easy |
| 06-complete-example | 8 | Mixed | 1hr | Medium |

**Total Time**: 5 hours 45 minutes
**Validation Time**: 15 minutes
**Buffer**: 15 minutes
**TOTAL PHASE 1**: 6 hours

### Phase 2: Add Missing Tests (Priority P1 - Day 2)

**Objective**: Add critical validation tests for exports and API contracts

**Time Estimate**: 8 hours
**Success Criteria**: All new tests pass, increase coverage
**Release Blocker**: YES

#### Test 1: Export Validation (2 hours)

**File**: `playground/test/readme-validation/07-export-validation.test.mjs`

**Test Plan**:
```javascript
describe('Export Integrity Validation', () => {
  // Test 1: All documented exports exist
  it('should export all functions documented in README', () => {
    const pkg = require('citty-test-utils')

    expect(pkg.runLocalCitty).toBeDefined()
    expect(pkg.runCitty).toBeDefined()
    expect(pkg.scenario).toBeDefined()
    expect(pkg.scenarios).toBeDefined()
    expect(pkg.setupCleanroom).toBeDefined()
    expect(pkg.teardownCleanroom).toBeDefined()
    expect(pkg.testUtils).toBeDefined()
  })

  // Test 2: Exported functions are callable
  it('should have callable function exports', () => {
    const pkg = require('citty-test-utils')

    expect(typeof pkg.runLocalCitty).toBe('function')
    expect(typeof pkg.runCitty).toBe('function')
    expect(typeof pkg.scenario).toBe('function')
  })

  // Test 3: Scenarios object has pre-built scenarios
  it('should export pre-built scenarios', () => {
    const { scenarios } = require('citty-test-utils')

    expect(scenarios.help).toBeDefined()
    expect(scenarios.version).toBeDefined()
    expect(scenarios.invalidCommand).toBeDefined()
    expect(scenarios.jsonOutput).toBeDefined()
  })

  // Test 4: testUtils object has utility functions
  it('should export test utilities', () => {
    const { testUtils } = require('citty-test-utils')

    expect(testUtils.retry).toBeDefined()
    expect(typeof testUtils.retry).toBe('function')
  })

  // Test 5: Function signatures match documentation
  it('should accept documented parameters', async () => {
    const { runLocalCitty } = require('citty-test-utils')

    // Should not throw when called with documented API
    const result = await runLocalCitty({
      args: ['--help'],
      cwd: './playground',
      cliPath: 'src/cli.mjs'
    })

    expect(result).toBeDefined()
    expect(result.result).toBeDefined()
  })
})
```

**Estimated Tests**: 5-8 tests
**Time Breakdown**:
- Setup and imports: 15 min
- Test implementation: 1 hr
- Validation and debugging: 30 min
- Documentation: 15 min

#### Test 2: API Contract Validation (3 hours)

**File**: `playground/test/readme-validation/08-api-contracts.test.mjs`

**Test Plan**:
```javascript
describe('API Contract Validation', () => {
  // Test Group 1: runLocalCitty Options Schema
  describe('runLocalCitty options validation', () => {
    it('should accept valid options object', () => {
      // Test Zod schema validation
    })

    it('should reject invalid args (not array)', () => {
      // Test validation error
    })

    it('should require cliPath in options', () => {
      // Test required field
    })

    it('should accept optional timeout', () => {
      // Test optional fields
    })

    it('should accept optional env object', () => {
      // Test optional env vars
    })
  })

  // Test Group 2: scenario.run() Signature
  describe('scenario.run() signature validation', () => {
    it('should accept options object', () => {
      // Test new API
    })

    it('should accept string args (backward compat)', () => {
      // Test legacy support
    })

    it('should accept array args (backward compat)', () => {
      // Test legacy support
    })
  })

  // Test Group 3: Return Value Contracts
  describe('return value contracts', () => {
    it('runLocalCitty should return result object', async () => {
      // Validate return structure
    })

    it('result should have expectSuccess method', async () => {
      // Validate fluent API
    })

    it('result should have result.stdout/stderr', async () => {
      // Validate result object shape
    })
  })
})
```

**Estimated Tests**: 10-15 tests
**Time Breakdown**:
- Schema analysis: 30 min
- Test implementation: 1.5 hrs
- Validation: 45 min
- Documentation: 15 min

#### Test 3: Helper Utilities (3 hours)

**Files**:
- `playground/test/readme-validation/helpers/readme-test-utils.mjs`
- `playground/test/readme-validation/helpers/api-contract-validator.mjs`

**Content**:
```javascript
// readme-test-utils.mjs
export class ReadmeTestUtils {
  static extractCodeBlocks(readmePath, language = 'javascript') {
    // Extract code examples from README
  }

  static async validateExample(code, options = {}) {
    // Execute and validate code example
  }

  static compareApiSignatures(readmeSignature, actualFunction) {
    // Compare documentation vs implementation
  }
}

// api-contract-validator.mjs
export class ApiContractValidator {
  static validateSignature(fn, schema) {
    // Validate function against Zod schema
  }

  static validateExports(packageName, expectedExports) {
    // Check all exports exist
  }

  static validateBackwardCompatibility(oldApi, newApi) {
    // Check for breaking changes
  }
}
```

**Time Breakdown**:
- Design utilities: 45 min
- Implementation: 1.5 hrs
- Testing: 30 min
- Documentation: 15 min

#### Phase 2 Summary

| Task | Tests | Time | Priority |
|------|-------|------|----------|
| Export Validation | 5-8 | 2hr | P1 Critical |
| API Contracts | 10-15 | 3hr | P1 Critical |
| Helper Utilities | N/A | 3hr | P1 Critical |

**TOTAL PHASE 2**: 8 hours

### Phase 3: Pre-Publish Automation (Priority P1 - Day 2)

**Objective**: Automate validation before publishing to npm

**Time Estimate**: 4 hours
**Success Criteria**: Script catches v0.6.0-style issues
**Release Blocker**: YES

#### Deliverable 1: Pre-Publish Script (2 hours)

**File**: `scripts/pre-publish-validation.sh`

```bash
#!/bin/bash
set -e

echo "🔍 Pre-Publish Validation for v0.6.1"
echo "======================================"

# Step 1: Build package
echo ""
echo "📦 Step 1: Building package..."
npm run build 2>/dev/null || true

# Step 2: Pack locally
echo ""
echo "📦 Step 2: Creating tarball..."
npm pack
TARBALL=$(ls citty-test-utils-*.tgz | tail -n 1)
echo "   Created: $TARBALL"

# Step 3: Install in playground
echo ""
echo "📦 Step 3: Installing in playground..."
cd playground
npm install ../$TARBALL

# Step 4: Run README validation tests
echo ""
echo "📋 Step 4: Testing README examples..."
npm test -- test/readme-validation/01-quick-start.test.mjs
npm test -- test/readme-validation/02-fluent-assertions.test.mjs
npm test -- test/readme-validation/03-scenario-dsl.test.mjs
npm test -- test/readme-validation/04-local-runner.test.mjs
npm test -- test/readme-validation/05-cli-commands.test.mjs
npm test -- test/readme-validation/06-complete-example.test.mjs

# Step 5: Export validation
echo ""
echo "📦 Step 5: Validating exports..."
npm test -- test/readme-validation/07-export-validation.test.mjs

# Step 6: API contracts
echo ""
echo "📝 Step 6: Validating API contracts..."
npm test -- test/readme-validation/08-api-contracts.test.mjs

# Step 7: Cleanup
echo ""
echo "🧹 Step 7: Cleaning up..."
cd ..
rm -f $TARBALL

# Success
echo ""
echo "✅ PRE-PUBLISH VALIDATION PASSED"
echo "✅ Package is ready for publishing"
echo ""
```

**Features**:
- ✅ Tests against packed tarball (not src)
- ✅ Validates README examples work
- ✅ Checks exports exist
- ✅ Validates API contracts
- ✅ Auto-cleanup

**Time**: 1.5 hours + 30 min testing

#### Deliverable 2: GitHub Actions Workflow (2 hours)

**File**: `.github/workflows/pre-publish.yml`

```yaml
name: Pre-Publish Validation

on:
  push:
    branches: [main, master]
  pull_request:
  workflow_dispatch:

jobs:
  validate-package:
    name: Validate Package for Publishing
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run pre-publish validation
        run: |
          chmod +x scripts/pre-publish-validation.sh
          ./scripts/pre-publish-validation.sh

      - name: Upload validation report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: validation-report
          path: |
            playground/coverage/
            playground/test-results/

  test-readme-examples:
    name: Test README Examples
    runs-on: ubuntu-latest
    needs: validate-package

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          npm ci
          cd playground && npm ci

      - name: Run README validation tests
        run: |
          cd playground
          npm test -- test/readme-validation --reporter=verbose

      - name: Check test results
        run: |
          if [ $? -ne 0 ]; then
            echo "❌ README validation tests failed"
            exit 1
          fi
          echo "✅ All README examples work correctly"
```

**Features**:
- ✅ Runs on every push/PR
- ✅ Tests packed package
- ✅ Uploads artifacts
- ✅ Separate job for README tests
- ✅ Clear pass/fail status

**Time**: 1.5 hours + 30 min testing

#### Phase 3 Summary

| Deliverable | Time | Priority |
|------------|------|----------|
| Pre-publish script | 2hr | P1 Critical |
| GitHub Actions | 2hr | P1 Critical |

**TOTAL PHASE 3**: 4 hours

## Total Time Estimate

| Phase | Tasks | Time | Status |
|-------|-------|------|--------|
| Phase 1 | Fix 35 tests | 6hr | Not Started |
| Phase 2 | Add 2 test files + helpers | 8hr | Not Started |
| Phase 3 | Automation | 4hr | Not Started |
| **TOTAL** | **All work** | **18hr** | **Ready** |

**With efficiency gains**: 13-15 hours (2 days)

## Success Metrics

### Phase 1 Success Criteria
- [ ] 35/35 existing tests pass (100% pass rate)
- [ ] 0 Zod validation errors
- [ ] 0 API signature mismatches
- [ ] All README examples work

### Phase 2 Success Criteria
- [ ] Export validation test added (5-8 tests)
- [ ] API contract test added (10-15 tests)
- [ ] Helper utilities created and documented
- [ ] All new tests pass
- [ ] Total test count: 50-58 tests

### Phase 3 Success Criteria
- [ ] Pre-publish script created and tested
- [ ] GitHub Actions workflow configured
- [ ] Script catches v0.6.0-style issues
- [ ] Validation runs in < 60 seconds
- [ ] CI/CD integration complete

### Overall v0.6.1 Release Gates
- [ ] 100% test pass rate (50-58 tests)
- [ ] 100% README example coverage
- [ ] 100% export validation
- [ ] 100% API contract coverage
- [ ] Pre-publish validation passes
- [ ] No breaking changes detected
- [ ] Documentation matches implementation

## Risk Assessment

### Low Risk Areas ✅
- Test structure (already excellent)
- Test organization (well-designed)
- Test coverage scope (comprehensive)

### Medium Risk Areas ⚠️
- scenario.run() API signature (unclear from docs)
- Backward compatibility (need to verify)
- CI/CD integration (new workflow)

### High Risk Areas 🔴
- None identified (structure is solid)

### Risk Mitigation

1. **API Investigation** (scenario.run)
   - Check actual implementation
   - Test both old and new signatures
   - Document findings

2. **Incremental Testing**
   - Fix one file at a time
   - Run tests after each fix
   - Identify issues early

3. **Validation at Each Step**
   - Phase 1: Test after each file fix
   - Phase 2: Test each new test file
   - Phase 3: Test pre-publish script

## Execution Order

### Day 1 (6-7 hours)

**Morning (3-4 hours)**:
1. Investigate scenario.run() API (30 min)
2. Fix 02-fluent-assertions.test.mjs (1 hr)
3. Fix 04-local-runner.test.mjs (45 min)
4. Fix 05-cli-commands.test.mjs (1 hr)

**Afternoon (3 hours)**:
5. Fix 01-quick-start.test.mjs (30 min)
6. Fix 03-scenario-dsl.test.mjs (1.5 hr)
7. Fix 06-complete-example.test.mjs (1 hr)

**End of Day Validation**:
- Run full test suite
- Verify 35/35 tests pass
- Document any issues

### Day 2 (7-8 hours)

**Morning (4 hours)**:
1. Create 07-export-validation.test.mjs (2 hr)
2. Create 08-api-contracts.test.mjs (3 hr)

**Afternoon (4 hours)**:
3. Create helper utilities (3 hr)
4. Create pre-publish script (2 hr)
5. Create GitHub Actions workflow (2 hr)

**End of Day Validation**:
- Run full test suite (50-58 tests)
- Run pre-publish script
- Verify all gates pass

## Deliverables

### Code Deliverables
- [ ] 6 fixed test files (Phase 1)
- [ ] 2 new test files (Phase 2)
- [ ] 2 helper utility files (Phase 2)
- [ ] 1 pre-publish script (Phase 3)
- [ ] 1 GitHub Actions workflow (Phase 3)

### Documentation Deliverables
- [ ] TEST-STRUCTURE-VALIDATION.md (✅ Complete)
- [ ] TEST-EXECUTION-PLAN.md (✅ Complete)
- [ ] API-CHANGES-v0.6.0.md (if issues found)
- [ ] Updated README (if needed)

### Validation Deliverables
- [ ] Test execution report
- [ ] Pre-publish validation report
- [ ] Coverage report
- [ ] Release readiness checklist

## Next Steps

1. **Review and Approve Plan**
   - Get stakeholder approval
   - Confirm priorities
   - Allocate resources

2. **Begin Phase 1**
   - Investigate scenario.run() API
   - Start fixing test files
   - Track progress

3. **Complete Phase 1**
   - Fix all 35 tests
   - Validate 100% pass rate
   - Report findings

4. **Execute Phase 2**
   - Add new tests
   - Create helpers
   - Validate coverage

5. **Execute Phase 3**
   - Create automation
   - Test validation script
   - Configure CI/CD

6. **Final Validation**
   - Run full test suite
   - Run pre-publish script
   - Verify release readiness

---

**Status**: 🎯 READY TO EXECUTE
**Confidence**: HIGH (structure solid, clear path forward)
**Timeline**: 2 days (13-15 hours)
**Risk Level**: LOW (incremental approach, good structure)
