# v0.6.1 Quick Fix Checklist

**Total Time**: 3-4 hours | **Priority**: P1 CRITICAL

## ✅ Phase 1: Critical Fixes (2.5 hours)

### 1. Fix Zod Dependency (30 min) 🔴

```bash
# Update package.json
sed -i '' 's/"zod": "^4.1.11"/"zod": "^3.23.8"/' package.json

# Install
npm install

# Verify
npm list zod
# Should show: zod@3.23.8

# Test
npm run test:unit
npm test -- playground/test/readme-validation/01-quick-start.test.mjs
```

**Files Changed**: `package.json`

### 2. Fix Missing runCitty Export (15 min) 🔴

```bash
# First, check if cleanroom-runner exists
find src -name "*cleanroom*"
```

**If cleanroom-runner.js exists**:
```javascript
// Add to end of src/core/runners/local-runner.js
export { runCitty } from './cleanroom-runner.js'
```

**If cleanroom-runner.js does NOT exist**:
```javascript
// Add to end of src/core/runners/local-runner.js
/**
 * Alias for runLocalCitty for backward compatibility
 * @deprecated Use runLocalCitty instead
 */
export const runCitty = runLocalCitty
```

**Test**:
```bash
node -e "import('citty-test-utils').then(m => console.log('runCitty:', typeof m.runCitty))"
# Should output: runCitty: function
```

**Files Changed**: `src/core/runners/local-runner.js`, possibly `index.js`

### 3. Fix Scenario DSL run() Method (2 hours) 🟡

**Replace the run() method in `src/core/scenarios/scenario-dsl.js` (around line 43-50)**:

```javascript
/**
 * Execute a command in this step
 * @param {string|string[]|Object} argsOrOptions - Command args or full options object
 * @param {Object} [options={}] - Additional options (if first param is args)
 *
 * Supports three signatures:
 * 1. .run('--help')                                    // String args
 * 2. .run(['--help'], { cwd: './path' })              // Array args + options
 * 3. .run({ args: ['--help'], cwd: './path' })        // v0.6.0 style
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
    commandArgs = argsOrOptions.args
    commandOptions = { ...argsOrOptions }
    delete commandOptions.args
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

**Test**:
```bash
npm test -- playground/test/readme-validation/03-scenario-dsl.test.mjs
```

**Files Changed**: `src/core/scenarios/scenario-dsl.js`

---

## ✅ Phase 2: Documentation (1 hour)

### 4. Update README Examples (1 hour) 📚

**Find and replace pattern**:

**OLD (v0.5.1)**:
```javascript
runLocalCitty(['--help'], { cwd: './project' })
```

**NEW (v0.6.0)**:
```javascript
runLocalCitty({
  args: ['--help'],
  cwd: './project',
  cliPath: 'src/cli.mjs'
})
```

**Sections to update**:
- Quick Start (lines ~76-88)
- Multi-step Scenario (lines ~91-103)
- Local Runner (lines ~302-314)
- All testing examples (lines ~423-906)

**Add Migration Guide**:
```markdown
## Migration Guide: v0.5.1 → v0.6.0

### API Signature Change

**Before**:
```javascript
runLocalCitty(['--help'], { cwd: './project' })
```

**After**:
```javascript
runLocalCitty({
  args: ['--help'],
  cwd: './project',
  cliPath: 'src/cli.mjs'  // Now required
})
```

### Why?
- Type safety with Zod validation
- Fail-fast error detection
- Explicit configuration
```

**Files Changed**: `README.md`

---

## ✅ Phase 3: Validation (30 min)

### 5. Run All Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# README validation
cd playground
npm test -- test/readme-validation

# Should see: 6/6 tests passed
```

### 6. Manual Quick Start Test

```bash
# Create test project
mkdir /tmp/test-v0.6.1
cd /tmp/test-v0.6.1
npm init -y
npm install /path/to/citty-test-utils  # Install local build

# Test import
node -e "import('citty-test-utils').then(m => console.log(Object.keys(m)))"

# Test basic usage (create test.mjs)
cat > test.mjs << 'EOF'
import { runLocalCitty } from 'citty-test-utils'

const result = await runLocalCitty({
  args: ['--version'],
  cliPath: 'node'
})

console.log('✅ Success:', result.stdout)
EOF

node test.mjs
```

---

## ✅ Phase 4: Release (30 min)

### 7. Update Version and Changelog

```bash
# Update version
npm version patch  # 0.6.0 → 0.6.1

# Update CHANGELOG.md
cat >> CHANGELOG.md << 'EOF'

## [0.6.1] - 2025-10-02

### Fixed
- 🔴 Critical: Downgraded Zod to v3.23.8 for compatibility
- 🔴 Critical: Added missing `runCitty` export for cleanroom testing
- 🟡 Fixed: Scenario DSL now supports multiple run() signatures
- 📚 Updated: All README examples to match v0.6.0 API
- 📚 Added: Migration guide for v0.5.1 → v0.6.0 upgrade

### Breaking Changes
None (patch release maintains v0.6.0 API)

### Migration
No migration needed from v0.6.0. If upgrading from v0.5.1, see README Migration Guide.
EOF
```

### 8. Publish

```bash
# Commit changes
git add .
git commit -m "v0.6.1: Fix critical Zod compatibility, missing export, and README examples"

# Create tag
git tag v0.6.1

# Publish to npm
npm publish

# Push to GitHub
git push origin master
git push origin v0.6.1
```

### 9. Post-Release Verification

```bash
# Wait 1-2 minutes for npm propagation
npm install -g citty-test-utils@0.6.1

# Test globally
node -e "import('citty-test-utils').then(m => console.log('✅ v0.6.1 exports:', Object.keys(m).join(', ')))"
```

---

## 📋 Pre-Release Checklist

- [ ] Zod downgraded to v3.23.8
- [ ] `npm list zod` shows v3.23.8
- [ ] `runCitty` export exists and works
- [ ] Scenario DSL supports all three signatures
- [ ] All unit tests pass (100%)
- [ ] All integration tests pass (100%)
- [ ] README validation tests pass (6/6)
- [ ] Manual Quick Start test successful
- [ ] README examples updated
- [ ] Migration guide added
- [ ] CHANGELOG.md updated
- [ ] Version bumped to 0.6.1
- [ ] Git committed and tagged
- [ ] Published to npm
- [ ] Post-release verification passed

---

## 🚨 Rollback Procedure

If issues are found:

### Within 72 hours:
```bash
# Unpublish (if possible)
npm unpublish citty-test-utils@0.6.1

# Revert git changes
git revert HEAD
git push origin master
```

### After 72 hours:
```bash
# Fix and publish v0.6.2
# Cannot unpublish after 72 hours
```

---

## 📊 Success Metrics

**Expected Results**:
- ✅ All tests pass (100%)
- ✅ No Zod validation errors
- ✅ All exports available
- ✅ README examples work
- ✅ Quick Start test successful
- ✅ npm install works
- ✅ User reports: POSITIVE

**Monitoring**:
- Watch npm download stats
- Monitor GitHub issues
- Check user feedback
- Review error reports

---

## 🎯 Summary

**4 Critical Issues Fixed**:
1. ✅ Zod v4 incompatibility → Downgraded to v3.23.8
2. ✅ Missing runCitty export → Added export/alias
3. ✅ Scenario DSL mismatch → Flexible signatures
4. ✅ README outdated → Updated to v0.6.0 API

**Time**: 3-4 hours
**Risk**: LOW
**Impact**: HIGH
**Ready**: YES

---

**Execute this checklist sequentially. Each phase must complete before moving to next.**
