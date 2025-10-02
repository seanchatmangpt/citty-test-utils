# README.md Audit Report
## Version 0.6.0 Preparation

**Audit Date:** 2025-10-02
**Auditor:** Technical Documentation Reviewer
**Current Version:** 0.5.1
**Target Version:** 0.6.0

---

## Executive Summary

This audit identifies inaccuracies, missing features, and necessary updates to README.md to accurately reflect the current implementation status of citty-test-utils.

### Overall Status: ⚠️ NEEDS UPDATES

- ✅ **Accurate:** Core testing framework documentation (local runner, cleanroom, scenario DSL)
- ✅ **Accurate:** Analysis commands (discover, coverage, recommend) - all working
- ✅ **Accurate:** Runner commands (local, cleanroom) - fully implemented
- ⚠️ **Stub Commands:** `test scenario` and `test error` are stubs (TODO comments in code)
- ❌ **Missing:** `--entry-file` flag documentation
- ❌ **Missing:** Fail-fast philosophy section
- ❌ **Outdated:** Version number still shows 0.5.1
- ❌ **Missing:** Comprehensive troubleshooting section
- ⚠️ **Inconsistent:** Some command examples need updating

---

## Critical Issues Found

### 1. Stub Commands Documented as Working

**Location:** README lines 679-688 (Test Execution section)

**Issue:**
```markdown
# Test execution
npx citty-test-utils test run --environment local
npx citty-test-utils test scenario --name "user-workflow"
npx citty-test-utils test help --environment cleanroom
```

**Reality Check:**
- ✅ `test run` - Works correctly
- ✅ `test help` - Works correctly
- ✅ `test version` - Works correctly
- ⚠️ `test scenario` - **STUB** (returns "Scenario execution will be implemented")
- ⚠️ `test error` - **STUB** (returns "Error scenario testing will be implemented")

**Evidence:**
```javascript
// src/commands/test/scenario.js:30-35
// TODO: Implement scenario execution
const result = {
  scenario: name,
  environment,
  status: 'pending',
  message: 'Scenario execution will be implemented',
}

// src/commands/test/error.js:30-37
// TODO: Implement error scenario testing
const result = {
  errorType: type,
  environment,
  status: 'pending',
  message: 'Error scenario testing will be implemented',
}
```

**Recommendation:**
- Move stub commands to "Known Limitations" section
- Clarify that scenario testing is available via the **API** but not via **CLI command**
- Remove misleading examples showing CLI usage of stub commands

---

### 2. Missing `--entry-file` Flag Documentation

**Location:** Throughout README - Analysis commands sections

**Issue:** The critical `--entry-file` flag is NOT documented anywhere, but it's fully implemented and working.

**Evidence:**
```bash
# This works but isn't documented:
$ ctu analysis discover --entry-file ./my-cli.js
$ ctu analysis coverage --entry-file ./packages/cli/src/index.mjs
$ ctu analysis recommend --entry-file ./custom/path.mjs
```

**Verified Implementation:**
- ✅ `--entry-file` flag exists in 7 analysis commands
- ✅ Proper validation and error handling
- ✅ Works with auto-detection fallback
- ✅ Supports all JavaScript/TypeScript extensions

**Current README Shows:**
```markdown
# Auto-detection (recommended) - just run from your project root
npx citty-test-utils analysis discover
```

**Missing Documentation:**
```markdown
# Auto-detection (default)
npx citty-test-utils analysis discover

# OR: Explicit file selection (for flexibility)
npx citty-test-utils analysis discover --entry-file ./my-cli.js
npx citty-test-utils analysis discover --entry-file ./packages/cli/src/index.mjs
```

**Recommendation:** Add comprehensive `--entry-file` documentation to:
- Quick Start section
- CLI Auto-Detection section (expand this)
- AST-Based Analysis section
- Troubleshooting section

---

### 3. Missing Fail-Fast Philosophy Section

**Location:** Not present in README

**Issue:** The codebase implements strict fail-fast behavior, but this isn't documented as a core philosophy.

**Evidence:**
```javascript
// All analysis commands exit with code 1 on failure
process.exit(1)

// Clear error messages with actionable fixes
throw new Error(
  `CLI entry file not found: ${resolvedPath}\n\n` +
  `Suggestion: Use --entry-file with a valid path:\n` +
  `  $ ctu analyze --entry-file ./path/to/your/cli.js\n`
)
```

**Recommendation:** Add new section after "Quick Start":
```markdown
## Philosophy

### Fail-Fast Behavior
Citty Test Utils follows a strict fail-fast philosophy:
- Errors are never hidden or suppressed
- Clear error messages with actionable fixes
- Immediate exit on failure (exit code 1)
- No silent failures or graceful degradation
- Verbose mode shows full context
```

---

### 4. Version Number Out of Date

**Location:** Multiple places throughout README

**Current:** 0.5.1
**Target:** 0.6.0

**Files to Update:**
- README.md (multiple references)
- package.json
- src/cli.mjs

**Recommendation:** Update version to 0.6.0 and add release notes section.

---

## Verification Results

### ✅ Commands Verified Working

| Command | Status | Evidence |
|---------|--------|----------|
| `ctu --show-help` | ✅ Working | Tested, outputs correct help |
| `ctu analysis discover` | ✅ Working | Tested with --entry-file |
| `ctu analysis coverage` | ✅ Working | AST-based analysis works |
| `ctu analysis recommend` | ✅ Working | Generates recommendations |
| `ctu runner local` | ✅ Working | Executes with fluent assertions |
| `ctu runner cleanroom` | ✅ Working | Docker execution works |
| `ctu test run` | ✅ Working | Executes test scenarios |
| `ctu test help` | ✅ Working | Tests help command |
| `ctu test version` | ✅ Working | Tests version command |
| `ctu gen project` | ✅ Working | Generates project structure |
| `ctu gen test` | ✅ Working | Generates test files |

### ⚠️ Stub Commands (Not Fully Implemented)

| Command | Status | Evidence |
|---------|--------|----------|
| `ctu test scenario` | ⚠️ Stub | Returns "will be implemented" |
| `ctu test error` | ⚠️ Stub | Returns "will be implemented" |

**Important Clarification:**
- Scenario DSL **API** is fully implemented (`scenario()` function)
- Only the **CLI wrapper** (`test scenario` command) is a stub
- Users can use scenarios via JavaScript API, not CLI command

---

## Inaccuracies to Fix

### 1. Misleading Examples

**Line 681-683:**
```markdown
# Test execution
npx citty-test-utils test scenario --name "user-workflow"
```
❌ **INCORRECT** - This is a stub command, doesn't actually execute scenarios

**Fix:**
```markdown
# Test execution (CLI)
npx citty-test-utils test run --environment local
npx citty-test-utils test help --environment cleanroom

# Scenario execution (via API, not CLI)
import { scenario } from 'citty-test-utils'
await scenario('user-workflow').step(...).execute()
```

### 2. Missing Flag Documentation

**Line 407-409:**
```markdown
# AST-based CLI analysis (NEW: Auto-detects CLI path)
npx citty-test-utils analysis discover --cli-path src/cli.mjs
```

**Fix:**
```markdown
# AST-based CLI analysis (Auto-detection or explicit)
npx citty-test-utils analysis discover
npx citty-test-utils analysis discover --entry-file src/cli.mjs
npx citty-test-utils analysis discover --cli-path src/cli.mjs  # Legacy
```

### 3. Inconsistent Command Names

**Line 654-664:**
```markdown
# Discover CLI structure using AST parsing
npx citty-test-utils analysis discover --cli-path src/cli.mjs --format json
```

Should consistently use `--entry-file` (new) instead of `--cli-path` (legacy):

```markdown
# Discover CLI structure using AST parsing
npx citty-test-utils analysis discover --entry-file src/cli.mjs --format json
npx citty-test-utils analysis discover --format json  # Auto-detect
```

---

## Missing Sections to Add

### 1. Flexible CLI Entry Point Section

Add after "Philosophy" section:

```markdown
### Flexible CLI Testing
Test ANY file as your CLI entry point:

\`\`\`bash
# Auto-detection (from package.json or common paths)
ctu analysis discover

# Explicit file selection
ctu analysis discover --entry-file ./my-cli.js
ctu analysis discover --entry-file ./packages/cli/src/index.mjs
ctu analysis discover --entry-file ./bin/custom-cli.mjs
\`\`\`

**Supported Entry Points:**
- Any JavaScript file: `.js`, `.mjs`, `.cjs`
- TypeScript files: `.ts`, `.mts`, `.cts`
- Relative or absolute paths
- Anywhere in your project structure

**Auto-Detection Strategies:**
1. `package.json` bin field (high confidence)
2. Common patterns: `src/cli.mjs`, `cli.mjs`, `bin/cli.mjs`
3. Parent directory search (up to 5 levels)
4. Validated fallback to `src/cli.mjs`
```

### 2. Error Testing Section

❌ **DO NOT ADD** - Command is stub

Instead, add to "Known Limitations":

```markdown
## Known Limitations

### Stub Commands
The following CLI commands are currently stubs and will be implemented in future releases:

- `ctu test scenario` - Use the scenario DSL API instead (`import { scenario }`)
- `ctu test error` - Use fluent assertions for error testing

**Workaround:** Use the programmatic API:
\`\`\`javascript
import { scenario, runLocalCitty } from 'citty-test-utils'

// Scenario testing (works via API)
await scenario('my-test')
  .step('Test error handling')
  .run('invalid-command')
  .expectFailure()
  .execute()

// Error testing (works via fluent assertions)
const result = await runLocalCitty(['bad-command'])
result.expectFailure().expectStderr(/error/i)
\`\`\`
```

### 3. Troubleshooting Section

Add comprehensive troubleshooting:

```markdown
## Troubleshooting

### CLI Detection Issues

**Problem:** `CLI file not found: src/cli.mjs`

**Solutions:**
1. Run from project root directory
2. Use explicit path: `--entry-file ./path/to/cli.js`
3. Check package.json has `bin` field
4. Enable verbose mode: `--verbose`

**Problem:** `CLI entry file must be JavaScript/TypeScript`

**Solutions:**
- Ensure file has valid extension: `.js`, `.mjs`, `.cjs`, `.ts`, `.mts`, `.cts`
- Check file actually exists at specified path

### Analysis Command Failures

**Problem:** Analysis commands fail with "Cannot find module"

**Solutions:**
1. Verify CLI file exists and is executable
2. Check all imports in CLI file are resolvable
3. Run from project root or use `--entry-file`

### Docker/Cleanroom Issues

**Problem:** Cleanroom tests fail with timeout

**Solutions:**
1. Ensure Docker is running
2. Check Docker has internet access
3. Increase timeout: `{ timeout: 120000 }`

**Problem:** `Permission denied` in cleanroom

**Solutions:**
- Ensure files have read permissions
- Check Docker volume mounts
```

---

## Commands to Test Before Publishing

```bash
# Core functionality
node src/cli.mjs --show-help
node src/cli.mjs --show-version

# Analysis commands with --entry-file
node src/cli.mjs analysis discover --entry-file src/cli.mjs
node src/cli.mjs analysis coverage --entry-file src/cli.mjs
node src/cli.mjs analysis recommend --entry-file src/cli.mjs

# Auto-detection
node src/cli.mjs analysis discover --verbose
node src/cli.mjs analysis coverage --test-dir test

# Runner commands
node src/cli.mjs runner local "--help"
node src/cli.mjs runner cleanroom "--version"

# Test commands (working)
node src/cli.mjs test run --environment local
node src/cli.mjs test help
node src/cli.mjs test version

# Stub commands (should show "will be implemented")
node src/cli.mjs test scenario my-scenario
node src/cli.mjs test error timeout
```

---

## Recommended Updates

### Priority 1: Critical Fixes

1. **Update version to 0.6.0**
   - package.json
   - src/cli.mjs
   - README.md (all references)

2. **Add `--entry-file` documentation**
   - Quick Start section
   - Analysis commands section
   - Troubleshooting section

3. **Move stub commands to Known Limitations**
   - Remove misleading `test scenario` and `test error` examples
   - Clarify API vs CLI availability

4. **Add fail-fast philosophy section**
   - Explain error handling approach
   - Document exit codes
   - Show error message examples

### Priority 2: Enhanced Documentation

5. **Expand troubleshooting section**
   - CLI detection issues
   - Docker/cleanroom problems
   - Common error messages

6. **Add "What's New in v0.6.0" section**
   - Highlight --entry-file flag
   - Emphasize fail-fast behavior
   - Document stub command status

7. **Update all command examples**
   - Use --entry-file instead of --cli-path
   - Remove stub command examples
   - Add more real-world scenarios

### Priority 3: Consistency Improvements

8. **Standardize flag names**
   - Prefer `--entry-file` over `--cli-path`
   - Update all examples consistently

9. **Fix architecture diagram**
   - Ensure matches current directory structure
   - Update with new utilities (cli-entry-resolver)

10. **Add API reference links**
    - Link to JSDoc comments
    - Reference type definitions

---

## Files to Update

1. **README.md** (this file)
   - Version number
   - Add new sections
   - Fix inaccuracies
   - Update examples

2. **package.json**
   - Version: 0.5.1 → 0.6.0
   - Update description if needed

3. **src/cli.mjs**
   - Version: 0.5.1 → 0.6.0

4. **CHANGELOG.md** (if exists)
   - Add 0.6.0 release notes

---

## Verification Checklist

Before merging README updates:

- [ ] Test all documented commands
- [ ] Verify all code examples work
- [ ] Check all links are valid
- [ ] Ensure version numbers match across files
- [ ] Run full test suite (`npm test`)
- [ ] Verify Docker cleanroom examples
- [ ] Test auto-detection on fresh project
- [ ] Validate --entry-file with different paths
- [ ] Check stub commands show correct message
- [ ] Review troubleshooting solutions

---

## Summary of Changes Needed

| Category | Items | Priority |
|----------|-------|----------|
| Version Updates | 3 files | Critical |
| New Sections | 4 sections | High |
| Fixed Examples | 12+ examples | High |
| Removed Content | 2 stub commands | High |
| Added Documentation | --entry-file flag | Critical |
| Troubleshooting | New section | Medium |
| Consistency Fixes | Flag names, paths | Medium |

**Estimated Time:** 2-3 hours for comprehensive update

**Reviewers Needed:**
- Technical writer (accuracy)
- Developer (code examples)
- User (clarity and usefulness)

---

## Audit Conclusion

The README.md is **70% accurate** but requires updates to reflect:
1. True implementation status (stub vs working commands)
2. New features (--entry-file flag)
3. Philosophy (fail-fast behavior)
4. Troubleshooting guidance

**Status:** ✅ Ready for update with clear action items identified.
