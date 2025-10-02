# Flexible CLI Entry Point Selection - Implementation Summary

## Overview

This implementation adds **flexible CLI entry point selection** to Citty Test Utils, allowing users to test ANY JavaScript/TypeScript file as a CLI entry point.

## Implementation Date

2025-10-02

## User Requirement

> Users should be able to choose ANY file as the CLI to test
> - Not limited to package.json bin field
> - Not limited to conventional locations
> - Support for nested CLIs, monorepo CLIs, etc.

## What Was Implemented

### 1. Core Resolver (`src/core/utils/cli-entry-resolver.js`)

**New File**: `src/core/utils/cli-entry-resolver.js`

Features:
- ✅ `CLIEntryResolver` class for flexible CLI resolution
- ✅ `resolveCLIEntry()` convenience function
- ✅ `getCLIEntryArgs()` for command argument definitions
- ✅ Three-tier resolution priority system
- ✅ Comprehensive validation with helpful error messages
- ✅ Support for .js, .mjs, .cjs, .ts, .mts, .cts files

### 2. Updated Commands

All analysis commands now support `--entry-file` flag:

**Updated Files:**
- ✅ `src/commands/analysis/analyze.js`
- ✅ `src/commands/analysis/coverage.js`
- ✅ `src/commands/analysis/stats.js`
- ✅ `src/commands/analysis/discover.js`
- ✅ `src/commands/analysis/recommend.js`
- ✅ `src/commands/analysis/report.js`
- ✅ `src/commands/analysis/export.js`

**Integration:**
- All commands use `getCLIEntryArgs()` for consistent argument definitions
- All commands use `resolveCLIEntry()` for CLI path resolution
- Backwards compatible with existing `--cli-path` flag

### 3. Helper Updates

**Modified File**: `src/core/utils/analysis-helpers.js`

Changes:
- ✅ Added `resolveCliPath()` function
- ✅ Updated `parseCliOptions()` to include entry-file options
- ✅ Integrated with new resolver

### 4. Documentation

**New Files:**
- ✅ `docs/cli-entry-selection.md` - Complete user guide
- ✅ `docs/examples/entry-file-examples.md` - Practical examples
- ✅ `docs/implementation-summary.md` - This file

**Documentation Includes:**
- Usage examples for all commands
- Resolution priority explanation
- Monorepo examples
- CI/CD integration examples
- Troubleshooting guide
- API reference

### 5. Tests

**New File**: `test/integration/cli-entry-resolver.test.mjs`

Test Coverage:
- ✅ Argument definitions
- ✅ Resolver instance creation
- ✅ Explicit path resolution
- ✅ Error message validation
- ✅ Extension validation
- ✅ Resolution priority
- ✅ Integration with commands

## Resolution Priority System

The implementation uses a three-tier priority system:

### Priority 1: Explicit `--entry-file` or `--cli-file` (HIGHEST)

```bash
ctu analyze --entry-file ./my-custom-cli.js
```

- Direct file specification
- Full validation (exists, is file, valid extension)
- Clear error messages with suggestions
- Highest confidence

### Priority 2: Legacy `--cli-path` (MEDIUM)

```bash
ctu analyze --cli-path ./src/main-cli.mjs
```

- Backwards compatibility
- Treated as explicit if not default value
- Falls back to auto-detection if default

### Priority 3: Auto-Detection (LOWEST)

```bash
ctu analyze  # No path specified
```

- package.json bin field (highest confidence)
- Common file patterns (medium confidence)
- Parent directory search (lower confidence)
- Helpful error with suggestions if fails

## Error Handling

All errors include:
- ✅ Clear description of the problem
- ✅ Suggestions for resolution
- ✅ Example commands
- ✅ Related documentation links

**Example Error:**

```
❌ CLI entry file not found: /path/to/missing.js

Suggestion: Use --entry-file with a valid path:
  $ ctu analyze --entry-file ./path/to/your/cli.js
```

## Usage Examples

### Basic Usage

```bash
# Explicit CLI file
ctu analyze --entry-file ./src/my-cli.mjs

# Alternative syntax
ctu analyze --cli-file ./bin/custom-cli.js

# Nested CLI
ctu analyze --entry-file ./packages/cli/src/index.mjs
```

### All Commands

```bash
# Coverage analysis
ctu coverage --entry-file ./my-cli.js --threshold 80

# Statistics
ctu stats --entry-file ./custom-cli.mjs

# Discovery
ctu discover --entry-file ./nested/cli.js --format json

# Recommendations
ctu recommend --entry-file ./cli.mjs --priority high

# Reports
ctu report --entry-file ./bin/cli.js --format json

# Export
ctu export --entry-file ./src/cli.mjs --format json
```

### Monorepo Example

```bash
# Test each CLI in a monorepo
ctu analyze --entry-file ./packages/cli/src/index.mjs
ctu analyze --entry-file ./packages/admin-cli/src/cli.js
ctu analyze --entry-file ./apps/api-cli/dist/main.js
```

## Benefits

1. **Maximum Flexibility** - Test any file, anywhere in the project
2. **Monorepo Support** - Easy testing of multiple CLIs
3. **Clear Errors** - Helpful messages guide users to solutions
4. **Backwards Compatible** - Existing `--cli-path` still works
5. **Well Documented** - Comprehensive docs and examples
6. **Type Safety** - Full TypeScript support
7. **Tested** - Integration tests ensure reliability

## Migration Path

Users can migrate gradually:

```bash
# Old (still works)
ctu analyze --cli-path ./src/cli.mjs

# New (recommended)
ctu analyze --entry-file ./src/cli.mjs
```

## API Reference

### `resolveCLIEntry(options)`

**Purpose**: Resolve CLI entry point from various sources

**Parameters:**
- `options.entryFile` (string, optional) - Explicit CLI entry file
- `options.cliFile` (string, optional) - Alias for entryFile
- `options.cliPath` (string, optional) - Legacy CLI path
- `options.verbose` (boolean, optional) - Enable verbose output

**Returns**: `Promise<string>` - Absolute path to resolved CLI

**Throws**: Error with helpful message if resolution fails

### `getCLIEntryArgs()`

**Purpose**: Get argument definitions for citty commands

**Returns**: Object with argument definitions:
- `entry-file` - CLI entry file path
- `cli-file` - Alias for entry-file
- `cli-path` - Legacy CLI path (deprecated)

### `CLIEntryResolver`

**Purpose**: Class for advanced CLI resolution

**Methods:**
- `resolveCLIEntry(options)` - Resolve from options
- `resolveExplicitPath(path, verbose)` - Resolve explicit path
- `autoDetectCLI(verbose)` - Auto-detect CLI
- `validateCLI(path)` - Validate CLI file

## File Structure

```
src/
├── core/
│   └── utils/
│       ├── cli-entry-resolver.js    ← NEW
│       └── analysis-helpers.js      ← MODIFIED
├── commands/
│   └── analysis/
│       ├── analyze.js               ← MODIFIED
│       ├── coverage.js              ← MODIFIED
│       ├── stats.js                 ← MODIFIED
│       ├── discover.js              ← MODIFIED
│       ├── recommend.js             ← MODIFIED
│       ├── report.js                ← MODIFIED
│       └── export.js                ← MODIFIED

docs/
├── cli-entry-selection.md           ← NEW
├── examples/
│   └── entry-file-examples.md       ← NEW
└── implementation-summary.md        ← NEW (this file)

test/
└── integration/
    └── cli-entry-resolver.test.mjs  ← NEW
```

## Testing

All functionality is tested:

```bash
# Run integration tests
npm run test:integration

# Run specific test
npm run test -- cli-entry-resolver
```

## Validation Rules

### File Must Exist

```javascript
if (!existsSync(path)) {
  throw new Error('CLI entry file not found: ' + path)
}
```

### Must Be a File

```javascript
const stat = statSync(path)
if (!stat.isFile()) {
  throw new Error('CLI entry path is not a file: ' + path)
}
```

### Must Have Valid Extension

```javascript
const validExtensions = ['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts']
if (!validExtensions.includes(ext)) {
  throw new Error('CLI entry file must be JavaScript/TypeScript')
}
```

## Future Enhancements

Potential improvements for future versions:

1. **Pattern Matching** - Support glob patterns
2. **Multi-File Testing** - Test multiple CLIs in one command
3. **Configuration File** - Store CLI paths in config
4. **CLI Registry** - Register named CLIs for quick access
5. **Watch Mode** - Re-run tests when CLI changes

## Conclusion

This implementation provides a robust, flexible, and well-documented solution for CLI entry point selection. Users can now test ANY file as a CLI entry point with clear validation and helpful error messages.

## Related Documentation

- [CLI Entry Selection Guide](./cli-entry-selection.md)
- [Usage Examples](./examples/entry-file-examples.md)
- [Smart CLI Detection](./smart-cli-detection.md)
- [Coverage Analysis](./coverage-analysis.md)

## Support

For issues or questions:
- Check [CLI Entry Selection Guide](./cli-entry-selection.md)
- Review [Examples](./examples/entry-file-examples.md)
- Open an issue on GitHub
