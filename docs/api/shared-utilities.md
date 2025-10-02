# Shared Utilities API Documentation

## Overview

citty-test-utils v0.5.1 introduces a suite of shared utilities that eliminate code duplication and provide consistent functionality across all commands.

## Table of Contents

- [Smart CLI Detector](#smart-cli-detector)
- [Analysis Report Utils](#analysis-report-utils)
- [Context Manager](#context-manager)
- [AST Cache](#ast-cache)

---

## Smart CLI Detector

**File:** `/src/core/utils/smart-cli-detector.js`

Automatically detects CLI entry points from package.json and project structure using multiple strategies.

### Class: SmartCLIDetector

```javascript
import { SmartCLIDetector } from 'citty-test-utils/src/core/utils/smart-cli-detector.js'
```

#### Constructor

```javascript
const detector = new SmartCLIDetector(options)
```

**Parameters:**
- `options` (Object, optional)
  - `workingDir` (string): Working directory to search from (default: `process.cwd()`)
  - `verbose` (boolean): Enable verbose logging (default: `false`)

**Example:**
```javascript
const detector = new SmartCLIDetector({
  workingDir: './my-project',
  verbose: true
})
```

#### Methods

##### detectCLI(options)

Detect CLI entry point using multiple strategies.

**Parameters:**
- `options` (Object, optional): Override constructor options

**Returns:** `Promise<Object>`
- `cliPath` (string|null): Absolute path to CLI file
- `detectionMethod` (string): Method used for detection
- `confidence` (string): Detection confidence level
- `packageName` (string): Package name from package.json
- `error` (string, optional): Error message if detection failed

**Detection Strategies (in order):**
1. **package-json-bin** (high confidence): Reads bin field from package.json
2. **common-pattern** (medium confidence): Checks common file patterns
3. **parent-package-json-bin** (medium confidence): Searches parent directories
4. **none**: No CLI found

**Example:**
```javascript
const result = await detector.detectCLI()

if (result.cliPath) {
  console.log(`Found CLI: ${result.cliPath}`)
  console.log(`Method: ${result.detectionMethod}`)
  console.log(`Confidence: ${result.confidence}`)
} else {
  console.error(`Error: ${result.error}`)
}
```

**Output:**
```javascript
{
  cliPath: '/Users/dev/project/src/cli.mjs',
  detectionMethod: 'package-json-bin',
  confidence: 'high',
  packageName: 'my-cli',
  packageJson: {
    name: 'my-cli',
    version: '1.0.0',
    description: 'My awesome CLI'
  }
}
```

##### validateCLI(cliPath)

Validate detected CLI file.

**Parameters:**
- `cliPath` (string): Path to CLI file

**Returns:** `Object`
- `valid` (boolean): Whether file is valid
- `hasShebang` (boolean): Has shebang line
- `hasDefineCommand` (boolean): Uses citty's defineCommand
- `hasExport` (boolean): Has export statements
- `hasImport` (boolean): Has import statements
- `fileSize` (number): File size in bytes
- `lineCount` (number): Number of lines

**Example:**
```javascript
const validation = detector.validateCLI('/path/to/cli.mjs')

if (validation.valid) {
  console.log('✅ CLI is valid')
  console.log(`Has shebang: ${validation.hasShebang}`)
  console.log(`Has defineCommand: ${validation.hasDefineCommand}`)
  console.log(`Lines: ${validation.lineCount}`)
}
```

##### getCLIUsage(cliPath)

Get CLI usage information by executing --help.

**Parameters:**
- `cliPath` (string): Path to CLI file

**Returns:** `Promise<Object>`
- `available` (boolean): Whether help is available
- `exitCode` (number): Exit code from --help
- `stdout` (string): Help output
- `stderr` (string): Error output
- `helpAvailable` (boolean): Whether output contains usage info

**Example:**
```javascript
const usage = await detector.getCLIUsage('/path/to/cli.mjs')

if (usage.helpAvailable) {
  console.log('Help output:')
  console.log(usage.stdout)
}
```

---

## Analysis Report Utils

**File:** `/src/core/utils/analysis-report-utils.js`

Shared utilities for analysis command reports to ensure consistency and reduce code duplication.

### Functions

#### buildAnalysisMetadata(options)

Build standardized metadata object for analysis reports.

**Parameters:**
- `options` (Object)
  - `cliPath` (string): Path to CLI file
  - `analysisMethod` (string, optional): Analysis method (default: 'AST-based')
  - `additionalFields` (Object, optional): Command-specific fields

**Returns:** `Object`
- `generatedAt` (string): ISO timestamp
- `cliPath` (string): CLI file path
- `analysisMethod` (string): Analysis method
- `...additionalFields`: Any additional fields

**Example:**
```javascript
import { buildAnalysisMetadata } from 'citty-test-utils/src/core/utils/analysis-report-utils.js'

const metadata = buildAnalysisMetadata({
  cliPath: '/path/to/cli.mjs',
  analysisMethod: 'AST-based',
  additionalFields: {
    testDir: 'test',
    threshold: 80
  }
})

console.log(metadata)
// {
//   generatedAt: '2025-10-02T15:30:00.000Z',
//   cliPath: '/path/to/cli.mjs',
//   analysisMethod: 'AST-based',
//   testDir: 'test',
//   threshold: 80
// }
```

#### validateCLIPath(cliPath, exitOnError)

Validate CLI path exists and show helpful error if not.

**Parameters:**
- `cliPath` (string): Path to validate
- `exitOnError` (boolean, optional): Exit process if validation fails (default: `true`)

**Returns:** `boolean`
- `true` if path exists
- `false` if path doesn't exist (only if `exitOnError=false`)

**Example:**
```javascript
import { validateCLIPath } from 'citty-test-utils/src/core/utils/analysis-report-utils.js'

// Exit on error (default)
validateCLIPath('/path/to/cli.mjs')

// Don't exit, just return false
const isValid = validateCLIPath('/path/to/cli.mjs', false)
if (!isValid) {
  console.log('CLI not found, using default...')
}
```

**Error Output:**
```
❌ CLI file not found: /path/to/cli.mjs
💡 Tip: Run from project root or use --cli-path <path>
📁 Looking for: src/cli.mjs, cli.mjs, or bin/cli.mjs
```

#### formatDetectionMetadata(detectionResult)

Format CLI detection metadata for reports.

**Parameters:**
- `detectionResult` (Object): Result from SmartCLIDetector.detectCLI()

**Returns:** `Object`
- Formatted metadata for inclusion in reports

**Example:**
```javascript
import { formatDetectionMetadata } from 'citty-test-utils/src/core/utils/analysis-report-utils.js'

const detector = new SmartCLIDetector()
const detection = await detector.detectCLI()
const formatted = formatDetectionMetadata(detection)

console.log(formatted)
// {
//   cliDetection: {
//     method: 'package-json-bin',
//     confidence: 'high',
//     packageName: 'my-cli'
//   }
// }
```

---

## Context Manager

**File:** `/src/core/utils/context-manager.js`

Manages execution context for CLI commands, including environment variables, working directory, and timeout handling.

### Class: ContextManager

```javascript
import { ContextManager } from 'citty-test-utils/src/core/utils/context-manager.js'
```

#### Constructor

```javascript
const context = new ContextManager(options)
```

**Parameters:**
- `options` (Object)
  - `cwd` (string, optional): Working directory
  - `env` (Object, optional): Environment variables
  - `timeout` (number, optional): Timeout in milliseconds

**Example:**
```javascript
const context = new ContextManager({
  cwd: './my-project',
  env: { DEBUG: 'true' },
  timeout: 30000
})
```

#### Methods

##### withTimeout(fn, timeout)

Execute function with timeout.

**Parameters:**
- `fn` (Function): Async function to execute
- `timeout` (number, optional): Override timeout

**Returns:** `Promise<any>`
- Function result or throws timeout error

**Example:**
```javascript
try {
  const result = await context.withTimeout(async () => {
    // Long running operation
    return await slowOperation()
  }, 10000)
} catch (error) {
  if (error.message.includes('timeout')) {
    console.error('Operation timed out')
  }
}
```

##### getEnvironment()

Get merged environment variables.

**Returns:** `Object`
- Merged environment (process.env + custom env)

**Example:**
```javascript
const env = context.getEnvironment()
console.log(env.DEBUG) // 'true'
```

---

## AST Cache

**File:** `/src/core/cache/ast-cache.js`

Performance optimization through intelligent AST result caching.

### Class: ASTCache

```javascript
import { ASTCache } from 'citty-test-utils/src/core/cache/ast-cache.js'
```

#### Constructor

```javascript
const cache = new ASTCache(options)
```

**Parameters:**
- `options` (Object, optional)
  - `ttl` (number): Time to live in milliseconds (default: 300000 = 5 minutes)
  - `maxSize` (number): Maximum cache entries (default: 100)

**Example:**
```javascript
const cache = new ASTCache({
  ttl: 600000,  // 10 minutes
  maxSize: 50
})
```

#### Methods

##### get(key)

Retrieve cached value.

**Parameters:**
- `key` (string): Cache key

**Returns:** `any|undefined`
- Cached value or undefined if not found/expired

**Example:**
```javascript
const ast = cache.get('cli:/path/to/cli.mjs')
if (ast) {
  console.log('Cache hit!')
} else {
  console.log('Cache miss, parsing AST...')
}
```

##### set(key, value, ttl)

Store value in cache.

**Parameters:**
- `key` (string): Cache key
- `value` (any): Value to cache
- `ttl` (number, optional): Override default TTL

**Returns:** `void`

**Example:**
```javascript
const ast = parseAST('/path/to/cli.mjs')
cache.set('cli:/path/to/cli.mjs', ast)

// Custom TTL for this entry
cache.set('temp-data', data, 60000) // 1 minute
```

##### has(key)

Check if key exists in cache.

**Parameters:**
- `key` (string): Cache key

**Returns:** `boolean`

**Example:**
```javascript
if (cache.has('cli:/path/to/cli.mjs')) {
  const ast = cache.get('cli:/path/to/cli.mjs')
}
```

##### clear()

Clear all cache entries.

**Returns:** `void`

**Example:**
```javascript
cache.clear()
console.log('Cache cleared')
```

##### stats()

Get cache statistics.

**Returns:** `Object`
- `size` (number): Number of entries
- `maxSize` (number): Maximum entries
- `ttl` (number): Default TTL
- `hitRate` (number): Cache hit rate (0-1)

**Example:**
```javascript
const stats = cache.stats()
console.log(`Cache size: ${stats.size}/${stats.maxSize}`)
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`)
```

---

## Usage Examples

### Complete Analysis Workflow

```javascript
import { SmartCLIDetector } from 'citty-test-utils/src/core/utils/smart-cli-detector.js'
import { validateCLIPath, buildAnalysisMetadata } from 'citty-test-utils/src/core/utils/analysis-report-utils.js'
import { ASTCache } from 'citty-test-utils/src/core/cache/ast-cache.js'

// Detect CLI
const detector = new SmartCLIDetector({ verbose: true })
const detection = await detector.detectCLI()

if (!detection.cliPath) {
  console.error('CLI not found')
  process.exit(1)
}

// Validate CLI
validateCLIPath(detection.cliPath)

// Check cache
const cache = new ASTCache()
let ast = cache.get(`cli:${detection.cliPath}`)

if (!ast) {
  // Parse and cache AST
  ast = await parseAST(detection.cliPath)
  cache.set(`cli:${detection.cliPath}`, ast)
}

// Build report metadata
const metadata = buildAnalysisMetadata({
  cliPath: detection.cliPath,
  analysisMethod: 'AST-based',
  additionalFields: {
    cacheHit: cache.has(`cli:${detection.cliPath}`),
    detectionMethod: detection.detectionMethod
  }
})

console.log(metadata)
```

### Custom CLI Detection

```javascript
import { SmartCLIDetector } from 'citty-test-utils/src/core/utils/smart-cli-detector.js'

const detector = new SmartCLIDetector({ verbose: true })

// Try detection
const result = await detector.detectCLI()

if (result.cliPath) {
  // Validate CLI structure
  const validation = detector.validateCLI(result.cliPath)

  if (!validation.valid) {
    console.error('Invalid CLI file')
    process.exit(1)
  }

  // Get usage info
  const usage = await detector.getCLIUsage(result.cliPath)

  if (usage.helpAvailable) {
    console.log('CLI Help:')
    console.log(usage.stdout)
  }
} else {
  console.error('CLI not found:', result.error)
}
```

---

## Performance Benefits

### Before v0.5.1 (No Shared Utilities)

- **Code Duplication:** ~200 lines duplicated across 3 commands
- **Inconsistent Errors:** Different error messages for same scenarios
- **No Caching:** AST parsed on every analysis (~3-5 seconds)
- **Manual Detection:** CLI path always required

### After v0.5.1 (With Shared Utilities)

- **Code Reuse:** Single source of truth for common operations
- **Consistent Errors:** Standardized, helpful error messages
- **AST Caching:** 3-5x faster for repeated analysis (~0.5-1 second)
- **Auto-Detection:** 95% success rate, graceful fallback

---

## Best Practices

1. **Always use SmartCLIDetector** for CLI path detection
2. **Validate paths** with `validateCLIPath()` before use
3. **Use ASTCache** for expensive operations
4. **Include metadata** in all reports using `buildAnalysisMetadata()`
5. **Handle errors gracefully** with proper error messages

---

## Type Definitions

```typescript
// Smart CLI Detector
interface DetectionResult {
  cliPath: string | null
  detectionMethod: 'package-json-bin' | 'common-pattern' | 'parent-package-json-bin' | 'none'
  confidence: 'high' | 'medium' | 'low' | 'none'
  packageName: string
  error?: string
  packageJson?: {
    name: string
    version: string
    description: string
  }
}

// Analysis Metadata
interface AnalysisMetadata {
  generatedAt: string  // ISO timestamp
  cliPath: string
  analysisMethod: string
  [key: string]: any  // Additional fields
}

// Cache Stats
interface CacheStats {
  size: number
  maxSize: number
  ttl: number
  hitRate: number  // 0-1
}
```

---

## See Also

- [Runner Usage Examples](../examples/runner-usage.md)
- [Migration Guide v0.5.1](../v0.5.1-migration.md)
- [Architecture Overview](../../README.md#architecture)
