# CLI Entry Point Selection

## Overview

The Citty Test Utils now supports **flexible CLI entry point selection**, allowing you to test ANY JavaScript/TypeScript file as a CLI entry point, not just files defined in package.json or conventional locations.

## Features

✅ **Explicit File Selection** - Use `--entry-file` to specify any CLI file
✅ **Auto-Detection Fallback** - Automatically finds CLI from package.json or common paths
✅ **Monorepo Support** - Test CLIs in nested packages or workspaces
✅ **Multiple CLI Support** - Test different CLI entry points in the same project
✅ **Comprehensive Validation** - Clear error messages with helpful suggestions

## Usage

### Basic Usage

```bash
# Test a specific CLI file
ctu analyze --entry-file ./src/my-cli.mjs

# Alternative syntax (both work the same)
ctu analyze --cli-file ./bin/custom-cli.js

# Test nested CLI in monorepo
ctu analyze --entry-file ./packages/cli/src/index.mjs

# Test with verbose output
ctu analyze --entry-file ./cli.js --verbose
```

### All Commands Support --entry-file

The `--entry-file` flag works with ALL analysis commands:

```bash
# Coverage analysis
ctu coverage --entry-file ./my-cli.js --threshold 80

# Statistics summary
ctu stats --entry-file ./custom-cli.mjs

# CLI structure discovery
ctu discover --entry-file ./nested/cli.js --format json

# Test recommendations
ctu recommend --entry-file ./cli.mjs --priority high

# Generate reports
ctu report --entry-file ./bin/cli.js --format json --output report.json

# Export coverage data
ctu export --entry-file ./src/cli.mjs --format json --output coverage.json
```

## Resolution Priority

The CLI entry point is resolved in the following order:

### 1. Explicit `--entry-file` or `--cli-file` (Highest Priority)

If you specify either flag, that file is used directly:

```bash
ctu analyze --entry-file ./my-custom-cli.js
```

**Validation:**
- File must exist
- File must be a JavaScript/TypeScript file (`.js`, `.mjs`, `.cjs`, `.ts`, `.mts`, `.cts`)
- File must be readable

**Error Example:**
```
❌ CLI entry file not found: /path/to/missing-file.js

Suggestion: Use --entry-file with a valid path:
  $ ctu analyze --entry-file ./path/to/your/cli.js
```

### 2. Legacy `--cli-path` (Medium Priority)

If `--cli-path` is provided and not the default, it's treated as explicit:

```bash
ctu analyze --cli-path ./src/main-cli.mjs
```

### 3. Auto-Detection (Lowest Priority)

If no explicit path is provided, auto-detection attempts to find the CLI:

**Detection Methods:**

1. **package.json bin field** (highest confidence)
   ```json
   {
     "bin": {
       "my-cli": "./bin/cli.js"
     }
   }
   ```

2. **Common file patterns** (medium confidence)
   - `src/cli.mjs`
   - `src/cli.js`
   - `bin/cli.js`
   - `cli.js`
   - etc.

3. **Parent directory search** (lower confidence)
   - Searches up to 5 levels for package.json with bin field

**Auto-Detection Failure:**
```
❌ No CLI entry point found via auto-detection.

Suggestions:
1. Use --entry-file to specify the CLI file explicitly:
   $ ctu analyze --entry-file ./path/to/your/cli.js

2. Add a "bin" field to your package.json:
   "bin": {
     "your-cli": "./path/to/cli.js"
   }

3. Use a conventional CLI file location:
   - src/cli.mjs
   - bin/cli.js
   - cli.js
```

## Examples

### Example 1: Monorepo with Multiple CLIs

```bash
# Test the main CLI
ctu analyze --entry-file ./packages/cli/src/index.mjs

# Test the admin CLI
ctu analyze --entry-file ./packages/admin-cli/src/cli.js

# Test a development CLI
ctu analyze --entry-file ./tools/dev-cli.mjs
```

### Example 2: Testing Different Environments

```bash
# Test production CLI
ctu coverage --entry-file ./dist/cli.js --threshold 90

# Test development CLI
ctu coverage --entry-file ./src/cli.mjs --verbose

# Test experimental features CLI
ctu coverage --entry-file ./experimental/cli.js
```

### Example 3: CI/CD Integration

```bash
#!/bin/bash
# test-all-clis.sh

# Test each CLI entry point
ctu analyze --entry-file ./src/cli.mjs --format json --output cli-coverage.json
ctu analyze --entry-file ./admin/cli.js --format json --output admin-coverage.json
ctu analyze --entry-file ./tools/cli.mjs --format json --output tools-coverage.json

# Fail if coverage below threshold
ctu coverage --entry-file ./src/cli.mjs --threshold 80 || exit 1
```

### Example 4: Package.json Scripts

```json
{
  "scripts": {
    "test:cli": "ctu analyze --entry-file ./src/cli.mjs",
    "test:cli:coverage": "ctu coverage --entry-file ./src/cli.mjs --threshold 80",
    "test:cli:stats": "ctu stats --entry-file ./src/cli.mjs --verbose",
    "test:admin-cli": "ctu analyze --entry-file ./admin/cli.js",
    "test:all-clis": "npm run test:cli && npm run test:admin-cli"
  }
}
```

## File Validation

The resolver validates CLI entry files:

### Valid Extensions
- `.js` - CommonJS or ES Module
- `.mjs` - ES Module
- `.cjs` - CommonJS
- `.ts` - TypeScript
- `.mts` - TypeScript Module
- `.cts` - TypeScript CommonJS

### Invalid Extensions
```
❌ CLI entry file must be JavaScript/TypeScript: /path/to/cli.py
Found extension: .py
Valid extensions: .js, .mjs, .cjs, .ts, .mts, .cts

Suggestion: Provide a .js, .mjs, or .ts file:
  $ ctu analyze --entry-file ./src/cli.mjs
```

## Verbose Mode

Use `--verbose` to see detailed resolution information:

```bash
ctu analyze --entry-file ./my-cli.js --verbose
```

**Output:**
```
🔍 Resolving explicit CLI entry: ./my-cli.js
✅ Resolved CLI entry: /absolute/path/to/my-cli.js
🚀 Starting AST-based CLI coverage analysis...
CLI Path: /absolute/path/to/my-cli.js
Test Directory: test
Format: text
```

## Migration from --cli-path

The old `--cli-path` flag still works but is deprecated:

```bash
# Old (still works)
ctu analyze --cli-path ./src/cli.mjs

# New (recommended)
ctu analyze --entry-file ./src/cli.mjs
```

## Troubleshooting

### File Not Found

```bash
❌ CLI entry file not found: /path/to/missing.js

# Solution: Check the path is correct
ls -la /path/to/missing.js

# Or use absolute path
ctu analyze --entry-file /absolute/path/to/cli.js
```

### Not a File

```bash
❌ CLI entry path is not a file: /path/to/directory

# Solution: Provide a file, not a directory
ctu analyze --entry-file /path/to/directory/cli.js
```

### Invalid Extension

```bash
❌ CLI entry file must be JavaScript/TypeScript: /path/to/file.py

# Solution: Use a .js, .mjs, or .ts file
ctu analyze --entry-file /path/to/file.js
```

### Auto-Detection Failed

```bash
❌ No CLI entry point found via auto-detection.

# Solution 1: Use --entry-file
ctu analyze --entry-file ./path/to/cli.js

# Solution 2: Add bin to package.json
{
  "bin": {
    "my-cli": "./src/cli.mjs"
  }
}

# Solution 3: Move CLI to common location
mv ./custom-path/cli.js ./src/cli.mjs
```

## Advanced Usage

### Custom Test Directories

```bash
ctu analyze \
  --entry-file ./packages/cli/src/index.mjs \
  --test-dir ./packages/cli/tests \
  --verbose
```

### Multiple Output Formats

```bash
# JSON for CI/CD
ctu analyze --entry-file ./cli.mjs --format json --output coverage.json

# HTML for viewing
ctu coverage --entry-file ./cli.mjs --format html --output coverage.html

# Text for terminal
ctu stats --entry-file ./cli.mjs
```

### Programmatic Usage

```javascript
import { resolveCLIEntry } from 'citty-test-utils'

// Resolve CLI entry point
const cliPath = await resolveCLIEntry({
  entryFile: './my-cli.js',
  verbose: true
})

console.log('Resolved CLI:', cliPath)
```

## API Reference

### `resolveCLIEntry(options)`

Resolves CLI entry point from various sources.

**Parameters:**
- `options.entryFile` (string, optional) - Explicit CLI entry file path
- `options.cliFile` (string, optional) - Alias for entryFile
- `options.cliPath` (string, optional) - Legacy CLI path
- `options.verbose` (boolean, optional) - Enable verbose output

**Returns:**
- Promise<string> - Absolute path to resolved CLI file

**Throws:**
- Error if file not found, invalid, or auto-detection fails

### `getCLIEntryArgs()`

Returns CLI entry argument definitions for citty command.

**Returns:**
- Object with `entry-file`, `cli-file`, and `cli-path` argument definitions

## Related Documentation

- [Smart CLI Detection](./smart-cli-detection.md)
- [Coverage Analysis](./coverage-analysis.md)
- [Test Recommendations](./test-recommendations.md)
- [CI/CD Integration](./ci-cd-integration.md)
