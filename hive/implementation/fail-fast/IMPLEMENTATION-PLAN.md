# Fail-Fast Implementation Plan

## Phase 1: Replace file-utils.js (HIGH PRIORITY)

### Steps:
1. **Backup original file**:
   ```bash
   cp src/core/utils/file-utils.js src/core/utils/file-utils.js.backup-graceful
   ```

2. **Replace with fail-fast version**:
   ```bash
   cp hive/implementation/fail-fast/file-utils-fail-fast.js src/core/utils/file-utils.js
   ```

3. **Update imports** in files that use it:
   - Change `safeReadFile` → `readFile`
   - Remove `throwOnError` option (now always throws)
   - Wrap calls in try/catch if specific handling needed

### Files to update:
- `src/core/coverage/enhanced-ast-cli-analyzer.js`
- `src/core/utils/analysis-report-utils.js`
- `src/core/runners/local-runner.js`
- `src/core/runners/cleanroom-runner.js`
- Any other files using `safeReadFile`, `safeExists`, `safeStatSync`

## Phase 2: Update enhanced-ast-cli-analyzer.js (HIGH PRIORITY)

### Changes needed:

1. **Remove parseJavaScriptFileSafe()** (lines 502-544):
   ```diff
   - parseJavaScriptFileSafe(content, filePath) {
   -   try {
   -     return parse(cleanContent, {...})
   -   } catch (error) {
   -     console.warn(`⚠️ Skipping ${filePath}: ${error.message}`)
   -     return null
   -   }
   - }
   ```

2. **Add parseJavaScript()** that throws:
   ```javascript
   parseJavaScript(content, filePath) {
     try {
       return parse(cleanContent, {...})
     } catch (error) {
       throw new ParseError(filePath, error, cleanContent)
     }
   }
   ```

3. **Remove fake "unknown command" fallback** (lines 98-112):
   ```diff
   - if (!ast) {
   -   return {
   -     mainCommand: { name: 'unknown', description: 'Parse failed' }
   -   }
   - }
   + // If no AST, throw error (handled by parseJavaScript)
   ```

4. **Update discoverCLIStructureEnhanced()** (lines 77-129):
   ```diff
   - const content = safeReadFile(cliPath, {
   -   throwOnError: false,
   - })
   - if (!content) {
   -   throw new Error(`Could not read CLI file: ${cliPath}`)
   - }
   + const content = readFile(cliPath, {
   +   encoding: 'utf8',
   +   maxSize: 10 * 1024 * 1024,
   + })

   - const ast = this.parseJavaScriptFileSafe(content, cliPath)
   + const ast = this.parseJavaScript(content, cliPath)
   ```

5. **Update discoverTestPatternsAST()** (lines 566-617):
   ```diff
   - const content = safeReadFile(testFile, {...})
   - if (!content) {
   -   console.log(`⚠️ Could not read ${testFile}`)
   -   continue
   - }
   + const content = readFile(testFile, {
   +   encoding: 'utf8',
   +   maxSize: 10 * 1024 * 1024,
   + })

   - const ast = this.parseJavaScriptFileSafe(content, testFile)
   - if (!ast) {
   -   console.log(`⚠️ Could not parse ${testFile}`)
   -   continue
   - }
   + const ast = this.parseJavaScript(content, testFile)
   ```

6. **Add error classes** at top of file:
   ```javascript
   export class ParseError extends Error { /* ... */ }
   export class CLIStructureError extends Error { /* ... */ }
   export class TestDiscoveryError extends Error { /* ... */ }
   ```

## Phase 3: Update all analysis commands (HIGH PRIORITY)

For each command in `src/commands/analysis/`:
- analyze.js
- stats.js
- report.js
- export.js
- ast-analyze.js
- discover.js
- coverage.js
- recommend.js

### Changes for each:

1. **Update error handler**:
   ```diff
   - } catch (error) {
   -   handleAnalysisError(error, ctx.args.verbose, 'analysis')
   - }
   + } catch (error) {
   +   console.error(`\n❌ Analysis failed\n`)
   +   console.error(error.message)
   +   if (ctx.args.verbose) {
   +     console.error(`\nStack trace:\n${error.stack}`)
   +   }
   +   process.exit(1)
   + }
   ```

2. **Add success exit**:
   ```diff
     console.log(message)
   + process.exit(0)
   ```

## Phase 4: Update analysis-helpers.js (MEDIUM PRIORITY)

File: `src/core/utils/analysis-helpers.js`

**Update handleAnalysisError()**:
```javascript
export function handleAnalysisError(error, verbose, operation) {
  console.error(`\n❌ ${operation} failed\n`)

  if (verbose) {
    console.error(`Error type: ${error.name}`)
    console.error(`Stack trace:\n${error.stack}\n`)
  }

  console.error(error.message)

  if (!error.message.includes('Possible fixes:')) {
    console.error('\nPossible fixes:')
    console.error('  1. Enable --verbose flag for details')
    console.error('  2. Check file paths are correct')
    console.error('  3. Verify valid JavaScript syntax')
    console.error('  4. Check file permissions')
  }

  console.error('')
  process.exit(1)  // CRITICAL: Added exit
}
```

## Phase 5: Testing (CRITICAL)

### Test Cases:

1. **Invalid file path**:
   ```bash
   ctu analysis analyze --cli-path /does/not/exist.js
   # Should exit 1 with: File not found: /does/not/exist.js
   ```

2. **Invalid syntax**:
   ```bash
   echo "function broken() { " > broken.js
   ctu analysis analyze --cli-path broken.js
   # Should exit 1 with: Failed to parse... Unexpected token
   ```

3. **Permission denied**:
   ```bash
   touch noperm.js
   chmod 000 noperm.js
   ctu analysis analyze --cli-path noperm.js
   # Should exit 1 with: Permission denied: noperm.js
   ```

4. **Valid analysis**:
   ```bash
   ctu analysis analyze --cli-path src/cli.mjs
   # Should exit 0 with coverage report
   ```

5. **Test parse failure**:
   ```bash
   echo "function broken() { " > test/broken.test.js
   ctu analysis analyze
   # Should exit 1 with: Failed to parse test file: test/broken.test.js
   ```

### Verify exit codes:
```bash
# Run each test and check exit code
ctu analysis analyze --cli-path invalid.js
echo "Exit code: $?"  # Should be 1

ctu analysis analyze --cli-path src/cli.mjs
echo "Exit code: $?"  # Should be 0
```

## Phase 6: Documentation Updates (LOW PRIORITY)

Update docs to reflect:
1. Breaking changes in error handling
2. New error types and messages
3. Migration guide from graceful recovery
4. Examples of proper error handling

Files to update:
- README.md
- docs/API.md (if exists)
- CHANGELOG.md
- Migration guide

## Phase 7: Version Bump (REQUIRED)

Update package.json:
```json
{
  "version": "0.6.0-beta.1"  // or "1.0.0" for major
}
```

Add to CHANGELOG.md:
```markdown
## [0.6.0-beta.1] - 2025-10-02

### BREAKING CHANGES
- Removed graceful error recovery in file operations
- `safeReadFile()` replaced with `readFile()` that always throws
- `throwOnError` option removed (always throws)
- Analysis commands now exit with code 1 on failure
- Parse errors now fail immediately instead of continuing

### Added
- Actionable error messages with 5+ specific fixes
- Custom error classes: ParseError, CLIStructureError, TestDiscoveryError
- File location info in parse errors (line/column)
- Detailed error context in all failures

### Fixed
- Analysis no longer reports false coverage on parse failures
- Exit codes now correctly reflect success/failure
- Errors written to stderr instead of stdout
```

## Rollout Strategy

### Option 1: Big Bang (Risky)
Replace all files at once, test thoroughly, ship.

### Option 2: Gradual (Recommended)
1. **Week 1**: Replace file-utils.js, test internal usage
2. **Week 2**: Update enhanced-ast-cli-analyzer.js
3. **Week 3**: Update analysis commands, add exit codes
4. **Week 4**: Full integration testing
5. **Week 5**: Beta release (0.6.0-beta.1)
6. **Week 6**: Stable release after feedback

### Option 3: Feature Flag
Add environment variable to control behavior:
```javascript
const FAIL_FAST = process.env.CTU_FAIL_FAST === 'true'

if (FAIL_FAST) {
  // New behavior
} else {
  // Old behavior (deprecated)
}
```

Ship with default=true, allow old behavior for migration period.

## Success Criteria

✅ All error cases throw with actionable messages
✅ No "return null" on errors
✅ No "continue on error" loops
✅ All analysis commands exit(1) on failure
✅ All analysis commands exit(0) on success
✅ Test coverage remains same or higher
✅ Documentation updated
✅ Migration guide provided
✅ No silent failures in any code path
✅ All errors include 3+ specific fixes

## Monitoring

After release, monitor for:
- Increased error reports (expected - errors now visible)
- User complaints about "too strict" behavior
- Issues with file permissions
- Parse errors in user code
- Exit code handling in CI/CD pipelines

Expected: 2-3x increase in error reports (not bugs, just visible now!)
