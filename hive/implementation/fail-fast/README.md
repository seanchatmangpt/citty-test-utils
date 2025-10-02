# Fail-Fast Implementation

## Mission Statement

**Remove ALL graceful recovery. Let errors crash IMMEDIATELY with ACTIONABLE messages.**

## The Problem

Current codebase has graceful recovery EVERYWHERE:

1. **file-utils.js**: Returns `null` on errors (hides failures)
2. **enhanced-ast-cli-analyzer.js**: Creates fake "unknown" commands on parse failures
3. **Analysis commands**: Exit with code 0 even when they fail
4. **Test discovery**: Continues when test files fail to parse

**Result**: Coverage reports are LIES. Tests run with garbage data. Users have NO IDEA things failed.

## The Solution

**Fail-fast philosophy**:
- ❌ NO graceful recovery
- ❌ NO "safe" wrappers that hide errors
- ❌ NO default fallbacks
- ❌ NO "return null" on errors
- ❌ NO "continue on error" loops
- ✅ ALWAYS throw with actionable messages
- ✅ ALWAYS exit(1) on failure
- ✅ ALWAYS provide 3-5 specific fixes

## Files Provided

### 1. ANALYSIS.md
Complete analysis of current graceful recovery patterns and what needs to change.

**Key sections**:
- Current state analysis
- Critical issues found (with line numbers)
- Impact assessment
- What needs to change
- Expected behavior before/after

### 2. file-utils-fail-fast.js
**Complete replacement** for `src/core/utils/file-utils.js`

**Changes**:
- ❌ DELETED `safeReadFile()` → ✅ ADDED `readFile()` that throws
- ❌ DELETED `throwOnError` flag → ✅ Always throws now
- ❌ DELETED `safeExists()` → ✅ ADDED `pathExists()` that throws on invalid path
- ❌ DELETED `safeStatSync()` → ✅ ADDED `getFileStats()` that throws
- ✅ KEPT custom error classes (improved with actionable messages)
- ✅ ADDED detailed error messages with 5 specific fixes each

**Usage**:
```javascript
// Before (graceful):
const content = safeReadFile(path, { throwOnError: false })
if (!content) {
  // error hidden
}

// After (fail-fast):
try {
  const content = readFile(path)
  // use content
} catch (error) {
  // specific error types
  if (error instanceof FileNotFoundError) {
    // handle file not found
  }
}
```

### 3. enhanced-ast-cli-analyzer-fail-fast.js
**Partial replacement** for `src/core/coverage/enhanced-ast-cli-analyzer.js`

**Shows critical changes**:
- ❌ DELETED `parseJavaScriptFileSafe()` → ✅ ADDED `parseJavaScript()` that throws
- ❌ DELETED fake "unknown command" fallback
- ❌ DELETED "continue on test file failure"
- ✅ ADDED `ParseError` class with line/column info
- ✅ ADDED `CLIStructureError` class
- ✅ ADDED `TestDiscoveryError` class
- ✅ All errors include actionable fixes

**Note**: This file shows the pattern. Full implementation would update all methods.

### 4. analysis-commands-fail-fast.js
**Example implementation** for analysis commands with proper error handling.

**Shows**:
- How to add `process.exit(1)` to catch blocks
- How to write errors to stderr (not stdout)
- How to add actionable error messages
- Pattern for all 8 analysis commands

### 5. IMPLEMENTATION-PLAN.md
**Step-by-step guide** for implementing fail-fast behavior.

**Includes**:
- Phase-by-phase rollout plan
- Exact code changes needed (with diffs)
- Files to modify (with line numbers)
- Test cases to verify
- Rollout strategies (big bang vs gradual)
- Success criteria

### 6. This README.md
Overview and quick reference.

## Quick Start

### Option 1: Big Bang Replacement (Fast but Risky)

```bash
cd /Users/sac/citty-test-utils

# Backup originals
cp src/core/utils/file-utils.js src/core/utils/file-utils.js.backup
cp src/core/coverage/enhanced-ast-cli-analyzer.js src/core/coverage/enhanced-ast-cli-analyzer.js.backup

# Replace with fail-fast versions
cp hive/implementation/fail-fast/file-utils-fail-fast.js src/core/utils/file-utils.js
# Then manually update enhanced-ast-cli-analyzer.js using the patterns shown

# Update all imports
# (sed commands or manual find/replace)

# Test thoroughly
npm test

# If tests fail, revert:
# mv src/core/utils/file-utils.js.backup src/core/utils/file-utils.js
```

### Option 2: Gradual Migration (Safer)

See IMPLEMENTATION-PLAN.md Phase 1-7 for detailed steps.

## Testing

### Critical Test Cases

1. **File not found**:
   ```bash
   ctu analysis analyze --cli-path /does/not/exist.js
   # Expected: Exit 1, error with path and fixes
   ```

2. **Parse failure**:
   ```bash
   echo "function broken() {" > broken.js
   ctu analysis analyze --cli-path broken.js
   # Expected: Exit 1, parse error with line/column and fixes
   ```

3. **Permission denied**:
   ```bash
   touch noperm.js && chmod 000 noperm.js
   ctu analysis analyze --cli-path noperm.js
   # Expected: Exit 1, permission error with fixes
   ```

4. **Valid analysis**:
   ```bash
   ctu analysis analyze --cli-path src/cli.mjs
   # Expected: Exit 0, coverage report
   ```

### Verify Exit Codes

```bash
# Should fail (exit 1)
ctu analysis analyze --cli-path invalid.js
echo "Exit code: $?"  # Must be 1

# Should succeed (exit 0)
ctu analysis analyze --cli-path src/cli.mjs
echo "Exit code: $?"  # Must be 0
```

## Expected Impact

### Before (Current):
```bash
$ ctu analysis analyze --cli-path invalid.js
⚠️ Skipping invalid.js: Unexpected token
📊 Coverage: 0/5 (0%)
$ echo $?
0  # ❌ SUCCESS even though it failed!
```

### After (Fail-Fast):
```bash
$ ctu analysis analyze --cli-path invalid.js

❌ Analysis failed

Failed to parse JavaScript file: invalid.js

Parse Error: Unexpected token (10:5)
Location: Line 10, Column 5

Problematic line:
  function broken() {

Possible fixes:
  1. Check if file contains valid JavaScript/TypeScript syntax
  2. Ensure all imports are correctly resolved
  3. Run linter: npx eslint invalid.js
  4. Check for missing/extra brackets, parentheses, or braces
  5. Verify all function declarations are complete
  6. Enable --verbose flag for detailed AST error output

$ echo $?
1  # ✅ FAILURE as expected!
```

## Breaking Changes

### API Changes (v0.6.0)

1. **file-utils.js**:
   - `safeReadFile(path, { throwOnError })` → `readFile(path, options)` (always throws)
   - `safeExists(path)` → `pathExists(path)` (throws on invalid path)
   - `safeStatSync(path)` → `getFileStats(path)` (throws on error)

2. **enhanced-ast-cli-analyzer.js**:
   - `parseJavaScriptFileSafe()` → `parseJavaScript()` (always throws)
   - No more fake "unknown command" structures
   - Throws `ParseError`, `CLIStructureError`, `TestDiscoveryError`

3. **All analysis commands**:
   - Now exit with code 1 on failure
   - Errors written to stderr (not stdout)

### Migration Guide

```javascript
// Old code (graceful):
import { safeReadFile } from './file-utils.js'

const content = safeReadFile(path, { throwOnError: false })
if (!content) {
  console.warn('Could not read file')
  return
}

// New code (fail-fast):
import { readFile, FileNotFoundError } from './file-utils.js'

try {
  const content = readFile(path)
  // use content
} catch (error) {
  if (error instanceof FileNotFoundError) {
    console.error('File not found:', error.path)
    // handle appropriately
  }
  throw error  // or process.exit(1)
}
```

## Success Criteria

- ✅ No "return null" on errors
- ✅ No "continue on error" loops
- ✅ All errors throw with actionable messages
- ✅ All analysis commands exit(1) on failure
- ✅ All errors include 3-5 specific fixes
- ✅ Exit codes match actual result (0=success, 1=failure)
- ✅ Errors written to stderr
- ✅ No silent failures

## Rollback Plan

If fail-fast causes problems:

```bash
# Restore backups
mv src/core/utils/file-utils.js.backup src/core/utils/file-utils.js
mv src/core/coverage/enhanced-ast-cli-analyzer.js.backup src/core/coverage/enhanced-ast-cli-analyzer.js

# Or add feature flag
export CTU_FAIL_FAST=false
```

## Questions?

Read the implementation plan:
- `IMPLEMENTATION-PLAN.md` - Step-by-step guide
- `ANALYSIS.md` - Detailed analysis of current code
- `*.js` files - Working examples of fail-fast code

## Next Steps

1. Read `ANALYSIS.md` to understand current problems
2. Read `IMPLEMENTATION-PLAN.md` to see rollout strategy
3. Review `file-utils-fail-fast.js` for pattern examples
4. Choose rollout strategy (big bang vs gradual)
5. Execute plan phase by phase
6. Test thoroughly with all test cases
7. Update documentation
8. Bump version to 0.6.0-beta.1 or 1.0.0
9. Monitor for increased error reports (expected!)

---

**Remember**: The goal is NOT to have fewer errors. The goal is to EXPOSE errors that were HIDDEN. Users will thank you for honest failures over silent lies.
