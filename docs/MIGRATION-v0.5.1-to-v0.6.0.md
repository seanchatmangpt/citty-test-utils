# Migration Guide: v0.5.1 to v0.6.0

## 🎯 Overview

Version 0.6.0 introduces **breaking API changes** to support Zod validation and improved fail-fast behavior. This guide will help you migrate your code.

## 🔄 Breaking Changes

### 1. API Signature Change: `runLocalCitty`

The function signature changed from **positional arguments** to a **single options object**.

#### v0.5.1 (OLD API)
```javascript
import { runLocalCitty } from 'citty-test-utils'

// ❌ OLD: Args as first parameter
const result = await runLocalCitty(['--help'], {
  cwd: './project',
  env: { DEBUG: 'true' }
})
```

#### v0.6.0+ (NEW API)
```javascript
import { runLocalCitty } from 'citty-test-utils'

// ✅ NEW: Single options object with args property
const result = await runLocalCitty({
  args: ['--help'],
  cwd: './project',
  cliPath: 'src/cli.mjs',  // Now REQUIRED
  env: { DEBUG: 'true' }
})
```

### 2. New Required Parameter: `cliPath`

**v0.6.0 requires explicit `cliPath`** to specify which CLI file to execute.

```javascript
// ✅ Always specify cliPath
const result = await runLocalCitty({
  args: ['--help'],
  cliPath: './src/cli.mjs',     // REQUIRED
  cwd: './my-project'
})
```

**Default Fallback** (if not specified):
- Uses `process.env.TEST_CLI_PATH` if set
- Otherwise defaults to `'./src/cli.mjs'`

### 3. Scenario DSL Updates

The Scenario DSL now supports **3 signature types** for backward compatibility:

#### Option 1: String (simplest)
```javascript
await scenario('Test')
  .step('Show help')
  .run('--help')           // ✅ String - auto-splits args
  .expectSuccess()
  .execute('local')
```

#### Option 2: Array + Options (v0.5.1 style)
```javascript
await scenario('Test')
  .step('Show help')
  .run(['--help'], {       // ✅ Array + options object
    cwd: './project',
    env: { TEST: 'true' }
  })
  .expectSuccess()
  .execute('local')
```

#### Option 3: Object (v0.6.0 style)
```javascript
await scenario('Test')
  .step('Show help')
  .run({                   // ✅ Single options object
    args: ['--help'],
    cwd: './project',
    cliPath: 'src/cli.mjs'
  })
  .expectSuccess()
  .execute('local')
```

## 🔧 Migration Steps

### Step 1: Update `runLocalCitty` Calls

Find all instances:
```bash
grep -r "runLocalCitty(\[" . --include="*.js" --include="*.mjs" --include="*.ts"
```

Replace pattern:
```diff
- await runLocalCitty(['--help'], { cwd: './path' })
+ await runLocalCitty({
+   args: ['--help'],
+   cwd: './path',
+   cliPath: 'src/cli.mjs'
+ })
```

### Step 2: Update Scenario DSL (Optional)

Your old scenarios **still work** due to backward compatibility, but you can optionally modernize:

```diff
- .run('--help', { cwd: './path' })
+ .run({
+   args: ['--help'],
+   cwd: './path',
+   cliPath: 'src/cli.mjs'
+ })
```

### Step 3: Add Default CLI Path

Set environment variable for consistent defaults:

```bash
# In your test setup or package.json
export TEST_CLI_PATH="./src/cli.mjs"
```

Or in `package.json`:
```json
{
  "scripts": {
    "test": "TEST_CLI_PATH=./src/cli.mjs vitest run"
  }
}
```

### Step 4: Update Type Definitions (TypeScript)

If using TypeScript, update imports:

```typescript
import { runLocalCitty, RunLocalCittyOptions } from 'citty-test-utils'

const options: RunLocalCittyOptions = {
  args: ['--help'],
  cliPath: './src/cli.mjs',
  cwd: './project'
}

const result = await runLocalCitty(options)
```

## 📊 Quick Reference

### API Comparison

| Feature | v0.5.1 | v0.6.0 |
|---------|--------|--------|
| **Signature** | `runLocalCitty(args, options)` | `runLocalCitty(options)` |
| **Args position** | First parameter (array) | `options.args` property |
| **cliPath** | Optional | **Required** (with fallback) |
| **Validation** | Runtime checks | **Zod schema validation** |
| **Error handling** | Try-catch | **Fail-fast** |
| **Backward compat** | N/A | Scenario DSL only |

### Common Patterns

#### Pattern 1: Simple Command
```javascript
// v0.5.1
runLocalCitty(['--help'])

// v0.6.0
runLocalCitty({
  args: ['--help'],
  cliPath: 'src/cli.mjs'
})
```

#### Pattern 2: With Options
```javascript
// v0.5.1
runLocalCitty(['test', '--verbose'], {
  cwd: './my-app',
  env: { DEBUG: '1' }
})

// v0.6.0
runLocalCitty({
  args: ['test', '--verbose'],
  cwd: './my-app',
  cliPath: 'src/cli.mjs',
  env: { DEBUG: '1' }
})
```

#### Pattern 3: Monorepo
```javascript
// v0.5.1
runLocalCitty(['build'], {
  cwd: './packages/cli'
})

// v0.6.0
runLocalCitty({
  args: ['build'],
  cwd: './packages/cli',
  cliPath: './packages/cli/src/index.mjs'
})
```

## ⚠️ Known Issues

### Issue: Zod v4 Compatibility

v0.6.0 ships with **Zod 4.1.11**, which is fully compatible. Previous validation reports incorrectly identified Zod as the issue.

**No action needed** - Zod 4.1.11 works correctly.

### Issue: Missing `runCitty` Export

**Fixed in v0.6.1** - `runCitty` is now properly exported from `local-runner.js`:

```javascript
// v0.6.1+
import { runLocalCitty, runCitty } from 'citty-test-utils'
```

## 🚀 Benefits of v0.6.0

1. **Type Safety**: Zod validation catches errors at runtime
2. **Clear Errors**: Better error messages with actionable suggestions
3. **Explicit Configuration**: `cliPath` makes CLI execution transparent
4. **Backward Compatibility**: Scenario DSL supports old patterns
5. **Fail-Fast**: Errors surface immediately, not hidden

## 📝 Checklist

- [ ] Update all `runLocalCitty()` calls to use options object
- [ ] Add `cliPath` to all runner calls (or set `TEST_CLI_PATH`)
- [ ] Test scenarios still work (backward compatible)
- [ ] Update TypeScript types if applicable
- [ ] Run full test suite to verify migration
- [ ] Update documentation/examples in your project

## 🆘 Need Help?

**Common Errors:**

### Error: "Invalid input: expected object, received array"
```javascript
// ❌ Using old API
runLocalCitty(['--help'], { cwd: './path' })

// ✅ Fix: Use new API
runLocalCitty({
  args: ['--help'],
  cwd: './path',
  cliPath: 'src/cli.mjs'
})
```

### Error: "CLI file not found"
```javascript
// ❌ Missing cliPath
runLocalCitty({ args: ['--help'] })

// ✅ Fix: Add cliPath
runLocalCitty({
  args: ['--help'],
  cliPath: './src/cli.mjs'
})
```

### Error: "does not provide an export named 'runCitty'"
**Upgrade to v0.6.1** - This export was missing in v0.6.0 but is fixed in v0.6.1.

## 📚 Additional Resources

- [API Documentation](./api/README.md)
- [Testing Guide](./guides/best-practices.md)
- [Troubleshooting](./guides/troubleshooting.md)
- [GitHub Issues](https://github.com/seanchatmangpt/citty-test-utils/issues)

---

**Migration completed?** Run your tests and verify everything works! 🎉
