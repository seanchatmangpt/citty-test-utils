# Fail-Fast Quick Reference Card

## 🚀 One-Minute Overview

**Problem**: Code returns `null` on errors → false coverage reports
**Solution**: Throw immediately with actionable error messages
**Files**: 8 files (74 KB) with complete implementation
**Impact**: Breaking changes, but necessary for correctness

---

## 📖 Which File Do I Read?

| I want to... | Read this file |
|--------------|----------------|
| Understand the why | EXECUTIVE-SUMMARY.md |
| Get started coding | README.md |
| See what's wrong now | ANALYSIS.md |
| Follow step-by-step plan | IMPLEMENTATION-PLAN.md |
| Replace file-utils.js | file-utils-fail-fast.js |
| Update analyzer | enhanced-ast-cli-analyzer-fail-fast.js |
| Update commands | analysis-commands-fail-fast.js |
| Navigate all files | INDEX.md |

---

## 🔥 Common Code Patterns

### Pattern 1: File Reading

```javascript
// ❌ OLD (graceful recovery):
import { safeReadFile } from './file-utils.js'
const content = safeReadFile(path, { throwOnError: false })
if (!content) {
  console.warn('Could not read file')
  return
}

// ✅ NEW (fail-fast):
import { readFile, FileNotFoundError } from './file-utils.js'
try {
  const content = readFile(path)
  // use content
} catch (error) {
  if (error instanceof FileNotFoundError) {
    console.error(error.message)  // Includes fixes!
  }
  throw error
}
```

### Pattern 2: Parsing

```javascript
// ❌ OLD (returns null):
const ast = parseJavaScriptFileSafe(content, filePath)
if (!ast) {
  return { commands: new Map() }  // Fake data!
}

// ✅ NEW (throws):
try {
  const ast = parseJavaScript(content, filePath)
  // use ast
} catch (error) {
  // error includes line/column and fixes
  throw error
}
```

### Pattern 3: Commands

```javascript
// ❌ OLD (exits 0 on error):
try {
  await analyzer.analyze()
} catch (error) {
  console.log(`Error: ${error.message}`)
}

// ✅ NEW (exits 1 on error):
try {
  await analyzer.analyze()
  process.exit(0)
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
```

---

## 🧪 Quick Testing

```bash
# Test 1: Invalid path
ctu analysis analyze --cli-path /invalid.js
# Expected: Exit 1, error with fixes

# Test 2: Parse error
echo "function broken() {" > broken.js
ctu analysis analyze --cli-path broken.js
# Expected: Exit 1, line/column shown

# Test 3: Success
ctu analysis analyze --cli-path src/cli.mjs
# Expected: Exit 0, coverage report

# Check exit codes
echo $?  # 0 = success, 1 = failure
```

---

## 🎯 Key Changes Summary

### file-utils.js
- `safeReadFile()` → `readFile()` (always throws)
- `safeExists()` → `pathExists()` (throws on invalid)
- `safeStatSync()` → `getFileStats()` (always throws)

### enhanced-ast-cli-analyzer.js
- `parseJavaScriptFileSafe()` → `parseJavaScript()` (always throws)
- No more fake "unknown command" structures
- Throws on any test file parse failure

### All analysis commands
- Exit 1 on failure (not 0)
- Errors to stderr (not stdout)
- Include actionable fixes

---

## ⚡ Implementation Steps

### Fastest Path (Big Bang)
```bash
# 1. Backup
cp src/core/utils/file-utils.js{,.backup}

# 2. Replace
cp hive/implementation/fail-fast/file-utils-fail-fast.js \
   src/core/utils/file-utils.js

# 3. Update imports (find/replace)
#    safeReadFile → readFile
#    throwOnError → (remove)

# 4. Test
npm test

# 5. Ship or rollback
```

### Safest Path (Gradual)
See IMPLEMENTATION-PLAN.md phases 1-7

---

## 🚨 Breaking Changes

| Old API | New API | Change |
|---------|---------|--------|
| `safeReadFile(path, { throwOnError: false })` | `readFile(path)` | Always throws |
| `safeExists(path)` returns `boolean` | `pathExists(path)` | Throws on invalid path |
| `safeStatSync(path)` returns `null` | `getFileStats(path)` | Always throws |
| `parseJavaScriptFileSafe()` returns `null` | `parseJavaScript()` | Always throws |
| Commands exit 0 on failure | Commands exit 1 on failure | Exit codes fixed |

---

## ✅ Success Checklist

After implementation, verify:
- [ ] No `return null` on errors
- [ ] No `continue` on parse failures
- [ ] Commands exit 1 on failure
- [ ] Errors show 3+ fixes
- [ ] Line/column shown in parse errors
- [ ] Errors to stderr, data to stdout
- [ ] Coverage reports accurate or absent

---

## 🔧 Common Issues & Fixes

### Issue: Tests failing after update
**Fix**: Update test expectations - errors should throw now

### Issue: CI/CD pipeline fails
**Fix**: Good! It was passing with bad data. Fix the actual problem.

### Issue: "Too many errors now"
**Fix**: Not new errors - just visible now. This is progress!

### Issue: Need old behavior temporarily
**Fix**: Use feature flag:
```bash
export CTU_FAIL_FAST=false  # Until migrated
```

---

## 📊 Error Message Anatomy

Every error includes:

```
❌ Operation failed

Failed to [WHAT]: [FILE/PATH]

Error: [SPECIFIC ERROR MESSAGE]
Location: [LINE/COLUMN if applicable]

Possible fixes:
  1. [Specific fix #1]
  2. [Specific fix #2]
  3. [Specific fix #3]
  4. [Specific fix #4]
  5. [Specific fix #5]
```

Example:
```
❌ Analysis failed

Failed to parse JavaScript file: src/cli.mjs

Parse Error: Unexpected token (45:12)
Location: Line 45, Column 12

Problematic line:
  function broken() {

Possible fixes:
  1. Check if file contains valid JavaScript syntax
  2. Run linter: npx eslint src/cli.mjs
  3. Fix missing closing brace on line 45
  4. Verify all imports are resolved
  5. Enable --verbose flag for AST details
```

---

## 🎓 Philosophy

### Don't
- ❌ Hide errors with try/catch that returns null
- ❌ Continue processing after failures
- ❌ Return fake/default data on errors
- ❌ Exit 0 when operation failed
- ❌ Write errors to stdout

### Do
- ✅ Throw immediately with clear message
- ✅ Stop processing on any error
- ✅ Provide actionable fixes (3-5 items)
- ✅ Exit 1 when operation failed
- ✅ Write errors to stderr

### Remember
> "Silent failures are worse than loud errors.
> Users will thank you for honest failures over misleading success."

---

## 📞 Getting Help

1. **Quick question?** → Check this QUICK-REFERENCE.md
2. **Need overview?** → Read EXECUTIVE-SUMMARY.md
3. **Ready to code?** → Read README.md
4. **Need details?** → Read IMPLEMENTATION-PLAN.md
5. **Confused about current code?** → Read ANALYSIS.md

---

## 🔗 File Paths

All files in: `hive/implementation/fail-fast/`

```
├── QUICK-REFERENCE.md          ← You are here
├── INDEX.md                    ← Navigation
├── EXECUTIVE-SUMMARY.md        ← TL;DR
├── README.md                   ← Quick start
├── ANALYSIS.md                 ← Current code analysis
├── IMPLEMENTATION-PLAN.md      ← Step-by-step
├── file-utils-fail-fast.js     ← Replacement file
├── enhanced-ast-cli-analyzer-fail-fast.js  ← Pattern reference
└── analysis-commands-fail-fast.js          ← Command template
```

---

## 📅 Timeline Estimate

| Rollout Type | Duration | Risk |
|--------------|----------|------|
| Big Bang | 1-2 days | High |
| Gradual | 4-6 weeks | Low |
| Feature Flag | 2-3 weeks | Medium |

**Recommended**: Gradual rollout over 4-6 weeks

---

## 🎯 One-Command Implementation

```bash
# Nuclear option (use with caution):
cd /Users/sac/citty-test-utils && \
cp src/core/utils/file-utils.js{,.backup} && \
cp hive/implementation/fail-fast/file-utils-fail-fast.js \
   src/core/utils/file-utils.js && \
npm test && \
echo "✅ Success - review changes and commit" || \
(mv src/core/utils/file-utils.js.backup \
    src/core/utils/file-utils.js && \
 echo "❌ Failed - rolled back")
```

**Better approach**: Follow IMPLEMENTATION-PLAN.md phase by phase!

---

## 💡 Remember

- **Goal**: Expose hidden failures, not hide them
- **Impact**: Breaking changes for correctness
- **Users**: Will thank you for honesty
- **CI/CD**: Will correctly detect failures
- **Reports**: Will be accurate or absent (no lies)

**Ship it with confidence!** 🚀
