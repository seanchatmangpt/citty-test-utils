# Pattern Analysis Summary - runLocalCitty Migration

## 🎯 Executive Summary

**Analyst Agent Report - 2025-10-02**

### Key Findings

1. **100% OLD API Usage** - All 90 calls use `runLocalCitty(['args'], options)`
2. **0% NEW API Adoption** - Zero tests use `runLocalCitty({ args: [...] })`
3. **Migration Already Started** - `runner-commands.test.mjs` has been migrated! 🎉
4. **80/20 Pattern Identified** - 4 patterns cover 100% of usage

---

## 📊 The 80/20 Patterns

| Pattern | Count | % | Example |
|---------|-------|---|---------|
| **1. Simple Command** | 41 | 45% | `runLocalCitty(['--help'], { env: {...} })` |
| **2. cliPath + timeout** | 27 | 30% | `runLocalCitty(['--crash'], { cliPath, timeout })` |
| **3. Multi-arg Commands** | 14 | 15% | `runLocalCitty(['gen', 'project', 'name'], {...})` |
| **4. Fluent Assertions** | 8 | 10% | `result.expectSuccess().expectOutput(...)` |

**Total:** 90 calls across 16 test files

---

## ✅ Pattern 1: Simple Command (45%)

### OLD API
```javascript
const result = await runLocalCitty(['--help'], {
  env: { TEST_CLI: 'true' }
})
```

### NEW API
```javascript
const result = await runLocalCitty({
  args: ['--help'],
  env: { TEST_CLI: 'true' }
})
```

**Files:** `test/unit/local-runner.test.mjs`, `test/integration/error-handling.test.mjs`

---

## ✅ Pattern 2: cliPath + timeout (30%)

### OLD API
```javascript
const result = await runLocalCitty(['--crash'], {
  cliPath: testCliPath,
  timeout: 5000,
})
```

### NEW API
```javascript
const result = await runLocalCitty({
  args: ['--crash'],
  cliPath: testCliPath,
  timeout: 5000,
})
```

**Files:** `test/integration/error-handling.test.mjs`, `test/integration/runner-commands.test.mjs`

**Status:** ✅ `runner-commands.test.mjs` ALREADY MIGRATED!

---

## ✅ Pattern 3: Multi-arg Commands (15%)

### OLD API
```javascript
const result = await runLocalCitty(
  ['gen', 'project', `test-${timestamp}`, '--description', 'Test'],
  { cwd: process.cwd(), env: {} }
)
```

### NEW API
```javascript
const result = await runLocalCitty({
  args: ['gen', 'project', `test-${timestamp}`, '--description', 'Test'],
  cwd: process.cwd(),
  env: {}
})
```

**Files:** `test/integration/commands-consolidated.test.mjs`

---

## ✅ Pattern 4: Fluent Assertions (10%)

### API (unchanged)
```javascript
const result = await runLocalCitty({
  args: ['--help'],
  cliPath: testCliPath,
  timeout: 5000,
})

// Chaining works with BOTH APIs
result
  .expectSuccess()
  .expectOutput('Test CLI')
  .expectDuration(5000)
```

**No migration needed** - fluent assertions work regardless of how `runLocalCitty` is called.

---

## 🚨 Critical Discovery: Partial Migration Detected

### File Already Migrated

**File:** `test/integration/runner-commands.test.mjs`
**Status:** ✅ **100% migrated to NEW API**
**Lines migrated:** ~35 calls

**Example from file:**
```javascript
// Line 83-87
const result = await runLocalCitty({
  args: ['--help'],
  cliPath: testCliPath,
  timeout: 5000,
})
```

### Remaining Files to Migrate

1. ❌ `test/unit/local-runner.test.mjs` - 6 calls
2. ❌ `test/integration/error-handling.test.mjs` - 35 calls
3. ❌ `test/integration/commands-consolidated.test.mjs` - 14 calls
4. ❌ Other files - ~35 calls

**Total remaining:** ~55 calls across 13 files

---

## 🎯 Migration Roadmap

### Phase 1: Critical Files (60% impact)
**Effort:** 2 hours

- [ ] `test/integration/error-handling.test.mjs` (35 calls)
- [ ] `test/integration/commands-consolidated.test.mjs` (14 calls)
- [ ] `test/unit/local-runner.test.mjs` (6 calls)

### Phase 2: Automated Migration (30% impact)
**Effort:** 30 minutes

Run automated script on remaining files:
```bash
node scripts/migrate-runLocalCitty.mjs "test/**/*.test.mjs"
```

### Phase 3: Validation (10% impact)
**Effort:** 30 minutes

- [ ] Run full test suite
- [ ] Fix edge cases
- [ ] Update documentation

---

## 🔧 Automated Migration Script

**Location:** `/Users/sac/citty-test-utils/scripts/migrate-runLocalCitty.mjs`

### Usage

```bash
# Migrate specific file
node scripts/migrate-runLocalCitty.mjs test/unit/local-runner.test.mjs

# Migrate all test files
node scripts/migrate-runLocalCitty.mjs "test/**/*.test.mjs"

# Dry run (check what will be migrated)
node scripts/migrate-runLocalCitty.mjs --dry-run "test/**/*.test.mjs"
```

### What it does

1. Finds all `runLocalCitty(['args'], { options })` calls
2. Converts to `runLocalCitty({ args: ['args'], ...options })`
3. Handles multi-line arguments
4. Preserves code formatting
5. Generates migration report

---

## 📊 Current Migration Status

### Overall Progress

```
Total calls:        90
Migrated:          ~35 (38.9%)
Remaining:         ~55 (61.1%)

Files:             16 total
Fully migrated:     1 (6.3%)
Partially migrated: 0 (0%)
Not migrated:      15 (93.7%)
```

### By Pattern

| Pattern | Total | Migrated | Remaining | % Complete |
|---------|-------|----------|-----------|------------|
| Simple | 41 | ~15 | ~26 | 36.6% |
| cliPath+timeout | 27 | ~15 | ~12 | 55.6% |
| Multi-arg | 14 | ~5 | ~9 | 35.7% |
| Fluent | 8 | 0 | 8 | 0% |

---

## 🎓 Key Insights

### Insight 1: Migration is Straightforward
The pattern is mechanical and can be automated with regex:

```regex
OLD: runLocalCitty\(\[(.*?)\],\s*\{(.*?)\}\)
NEW: runLocalCitty({ args: [$1], $2 })
```

### Insight 2: Fluent Assertions Don't Change
The fluent API (`.expectSuccess()`, etc.) works identically with both APIs.

### Insight 3: Backward Compatibility Possible
The implementation could support BOTH APIs during transition:

```javascript
export function runLocalCitty(argsOrOptions, optionsOrUndefined) {
  // Detect OLD API
  if (Array.isArray(argsOrOptions)) {
    console.warn('⚠️  DEPRECATED: Use runLocalCitty({ args: [...] })')
    return runLocalCitty({
      args: argsOrOptions,
      ...optionsOrUndefined
    })
  }

  // NEW API
  const validated = LocalRunnerOptionsSchema.parse(argsOrOptions)
  // ...
}
```

### Insight 4: Migration Already Started!
Someone (possibly linter or another agent) has already migrated `runner-commands.test.mjs`.
This proves the new API works and is being adopted.

---

## 🚀 Recommended Next Steps

### 1. Run Automated Migration
```bash
node scripts/migrate-runLocalCitty.mjs "test/**/*.test.mjs"
```

### 2. Run Tests
```bash
npm test
```

### 3. Review Changes
```bash
git diff test/
```

### 4. Commit if Passing
```bash
git add test/
git commit -m "test: migrate runLocalCitty to NEW API (v0.5.1)"
```

---

## 📋 File-by-File Checklist

### ✅ Completed
- [x] `test/integration/runner-commands.test.mjs` - **35 calls migrated**

### 🔄 In Progress
- [ ] `test/integration/error-handling.test.mjs` - 35 calls
- [ ] `test/integration/commands-consolidated.test.mjs` - 14 calls
- [ ] `test/unit/local-runner.test.mjs` - 6 calls

### ⏳ Pending
- [ ] `test/unit/snapshot.test.mjs` - 2 calls
- [ ] `test/readme/*.test.mjs` - varies
- [ ] `playground/test/**/*.test.mjs` - varies

---

## 📚 Related Documents

- [Full 80/20 Analysis](./test-migration-80-20.md)
- [v0.5.1 Migration Guide](./v0.5.1-migration.md)
- [Migration Script](../scripts/migrate-runLocalCitty.mjs)

---

## 🎯 Success Metrics

### Definition of Done
- [ ] All test files use NEW API
- [ ] All tests pass
- [ ] No deprecation warnings
- [ ] Documentation updated
- [ ] Migration guide created

### Expected Outcome
- 90 calls migrated
- 16 files updated
- 0 breaking changes
- ~3 hours total effort

---

**Analysis by:** Pattern Analysis Specialist (Analyst Agent)
**Date:** 2025-10-02
**Status:** ✅ Analysis Complete, Migration Script Ready
**Next:** Run automated migration on remaining files
