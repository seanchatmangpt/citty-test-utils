# Test Migration Guide: Old Tests → New Noun-Verb CLI Structure

## Overview

The old tests were designed for a simple CLI with direct commands like `greet`, `math`, etc. The new CLI uses a noun-verb structure: `ctu <noun> <verb>`.

## Key Changes Required

### 1. Command Structure Changes

**Old Structure:**
```javascript
// Direct commands
await runLocalCitty(['greet', 'John'])
await runLocalCitty(['math', 'add', '5', '3'])
await runLocalCitty(['--help'])
```

**New Structure:**
```javascript
// Noun-verb commands
await runLocalCitty(['info', 'version'])
await runLocalCitty(['gen', 'project', 'my-project'])
await runLocalCitty(['runner', 'execute', 'node --version'])
await runLocalCitty(['--help']) // Still works
```

### 2. Test CLI Usage

**Old Tests:**
- Used `TEST_CLI: 'true'` to run against `test-cli.mjs`
- Expected simple commands like `greet`, `math`, `error`

**New Tests:**
- Still use `TEST_CLI: 'true'` but now runs against `src/cli.mjs`
- Must use noun-verb command structure
- Domain discovery runs (expected behavior)

### 3. Expected Output Changes

**Old Expected Output:**
```javascript
expect(result.stdout).toContain('Hello, John!')
expect(result.stdout).toContain('Result: 8')
```

**New Expected Output:**
```javascript
expect(result.stdout).toContain('Version: 1.0.0')
expect(result.stdout).toContain('Generated complete project: my-project')
expect(result.stdout).toContain('Command: node --version')
```

### 4. Error Handling Changes

**Old Error Tests:**
```javascript
// Expected specific error messages
expect(result.stderr).toContain('Invalid argument')
```

**New Error Tests:**
```javascript
// New CLI has different error messages
expect(result.stderr).toContain('Unknown command')
expect(result.stderr).toContain('Missing required argument')
```

## Migration Strategy

### Phase 1: Update Command Structure
- Replace old commands with equivalent noun-verb commands
- Update expected output patterns
- Keep the same test structure and assertions

### Phase 2: Update Expected Outputs
- Map old expected outputs to new CLI outputs
- Update error message expectations
- Handle domain discovery output (it's expected)

### Phase 3: Add New Test Cases
- Test new noun-verb commands
- Test new features like `gen project`, `runner execute`
- Test JSON output with `--json` flag

## Example Migrations

### Basic Help Test
```javascript
// OLD
const result = await runLocalCitty(['--help'])
expect(result.stdout).toContain('test-cli')
expect(result.stdout).toContain('USAGE')

// NEW
const result = await runLocalCitty(['--help'])
expect(result.stdout).toContain('ctu')
expect(result.stdout).toContain('USAGE')
// Note: Domain discovery output is expected
```

### Version Test
```javascript
// OLD
const result = await runLocalCitty(['--version'])
expect(result.stdout).toMatch(/1\.0\.0/)

// NEW
const result = await runLocalCitty(['--show-version'])
expect(result.stdout).toMatch(/1\.0\.0/)
```

### Command Execution Test
```javascript
// OLD
const result = await runLocalCitty(['greet', 'John'])
expect(result.stdout).toContain('Hello, John!')

// NEW
const result = await runLocalCitty(['info', 'version'])
expect(result.stdout).toContain('Version: 1.0.0')
```

### JSON Output Test
```javascript
// OLD
const result = await runLocalCitty(['math', 'add', '5', '3', '--json'])
expect(result.json.result).toBe(8)

// NEW
const result = await runLocalCitty(['info', 'version', '--json'])
expect(result.json.version).toBe('1.0.0')
```

## Key Principles

1. **Use `runCitty` and `runLocalCitty`** - This is the core purpose of the library
2. **Test the actual CLI behavior** - Don't mock or work around the CLI
3. **Accept domain discovery output** - It's part of the CLI's normal operation
4. **Test noun-verb structure** - This is the new CLI architecture
5. **Maintain test coverage** - Ensure all functionality is tested

## Common Pitfalls

1. **Don't try to disable domain discovery** - It's part of the CLI
2. **Don't change the test runners** - Use `runCitty` and `runLocalCitty` as intended
3. **Don't expect old command outputs** - The CLI has changed
4. **Don't ignore the noun-verb structure** - This is the new architecture

## Next Steps

1. Update integration tests to use noun-verb commands
2. Update expected outputs to match new CLI
3. Add tests for new features (gen, runner, etc.)
4. Ensure all tests use `runCitty` and `runLocalCitty` properly
