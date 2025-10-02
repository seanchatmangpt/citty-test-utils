# Quick Reference: New runLocalCitty API

## TL;DR

**Old**: `runLocalCitty(arrayArgs, options)`
**New**: `runLocalCitty({ args: arrayArgs, ...options })`

---

## Common Patterns

### Basic Command
```javascript
// ✅ NEW
await runLocalCitty({ args: ['--help'] })

// ❌ OLD
await runLocalCitty(['--help'], { cwd: process.cwd() })
```

### With Environment Variables
```javascript
// ✅ NEW
await runLocalCitty({
  args: ['--version'],
  env: { DEBUG: 'true' }
})

// ❌ OLD
await runLocalCitty(['--version'], {
  cwd: process.cwd(),
  env: { DEBUG: 'true' }
})
```

### Custom CLI Path
```javascript
// ✅ NEW
await runLocalCitty({
  args: ['--help'],
  cliPath: './custom/cli.js',
  timeout: 5000
})

// ❌ OLD
await runLocalCitty(['--help'], {
  cliPath: './custom/cli.js',
  timeout: 5000
})
```

### Concurrent Execution
```javascript
// ✅ NEW
const promises = commands.map(cmd =>
  runLocalCitty({ args: cmd.args })
)
await Promise.all(promises)

// ❌ OLD
const promises = commands.map(cmd =>
  runLocalCitty(cmd.args, { cwd: process.cwd() })
)
await Promise.all(promises)
```

### With Custom Working Directory
```javascript
// ✅ NEW
await runLocalCitty({
  args: ['test'],
  cwd: '/custom/path'
})

// ❌ OLD
await runLocalCitty(['test'], {
  cwd: '/custom/path'
})
```

---

## API Options

```typescript
interface RunLocalCittyOptions {
  args?: string[]           // CLI arguments (default: [])
  cliPath?: string         // Path to CLI (default: TEST_CLI_PATH or './src/cli.mjs')
  cwd?: string             // Working directory (default: TEST_CWD or process.cwd())
  env?: Record<string, string>  // Environment variables (default: {})
  timeout?: number         // Timeout in ms (default: 30000)
}
```

---

## Return Value

```typescript
interface CliResult {
  success: boolean      // Command succeeded
  exitCode: number      // Process exit code
  stdout: string        // Standard output
  stderr: string        // Standard error
  args: string[]        // Arguments passed
  cliPath: string       // CLI path used
  cwd: string           // Working directory used
  durationMs: number    // Execution time
  command: string       // Full command executed
}
```

---

## Fluent Assertions

```javascript
const result = await runLocalCitty({ args: ['--help'] })

result
  .expectSuccess()              // exitCode === 0
  .expectOutput('Usage')        // stdout contains 'Usage'
  .expectOutput(/version/)      // stdout matches regex
  .expectNoStderr()             // stderr is empty
  .expectDuration(1000)         // durationMs < 1000
```

---

## Migration Checklist

- [ ] Replace `runLocalCitty([...], {...})` with `runLocalCitty({ args: [...], ... })`
- [ ] Remove `cwd: process.cwd()` (it's the default)
- [ ] Keep `env`, `timeout`, `cliPath` when needed
- [ ] Test the refactored file
- [ ] Commit changes

---

## Examples from Real Tests

### From citty-integration.test.mjs
```javascript
// Test version command
const result = await runLocalCitty({
  args: ['--show-version']
})
expect(result.exitCode).toBe(0)
expect(result.stdout).toMatch(/0\.5\.0/)
```

### From runner-commands.test.mjs
```javascript
// Execute with custom CLI
const result = await runLocalCitty({
  args: ['--help'],
  cliPath: testCliPath,
  timeout: 5000
})
expect(result.result.exitCode).toBe(0)
```

### From commands-consolidated.test.mjs
```javascript
// JSON output test
const result = await runLocalCitty({
  args: ['info', 'version', '--json']
})
expect(result.json).toBeDefined()
expect(result.json.version).toBe('0.5.0')
```

---

## Need Help?

- **Full documentation**: `REFACTORING_REPORT.md`
- **Examples**: Any refactored test file
- **Status**: `STATUS.md`
