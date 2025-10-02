# runLocalCitty Migration Quick Reference

## 🚀 One-Page Cheat Sheet

---

## The 4 Patterns (80/20 Rule)

### Pattern 1: Simple Command (45% of usage)

```javascript
// ❌ OLD API
const result = await runLocalCitty(['--help'], {
  env: { TEST_CLI: 'true' }
})

// ✅ NEW API
const result = await runLocalCitty({
  args: ['--help'],
  env: { TEST_CLI: 'true' }
})
```

---

### Pattern 2: cliPath + timeout (30% of usage)

```javascript
// ❌ OLD API
const result = await runLocalCitty(['--crash'], {
  cliPath: testCliPath,
  timeout: 5000,
})

// ✅ NEW API
const result = await runLocalCitty({
  args: ['--crash'],
  cliPath: testCliPath,
  timeout: 5000,
})
```

---

### Pattern 3: Multi-arg Commands (15% of usage)

```javascript
// ❌ OLD API
const result = await runLocalCitty(
  ['gen', 'project', 'name', '--description', 'Test'],
  { cwd: process.cwd(), env: {} }
)

// ✅ NEW API
const result = await runLocalCitty({
  args: ['gen', 'project', 'name', '--description', 'Test'],
  cwd: process.cwd(),
  env: {}
})
```

---

### Pattern 4: Fluent Assertions (10% of usage)

```javascript
// ✅ Works with BOTH APIs - no changes needed!
const result = await runLocalCitty({
  args: ['--help'],
  cliPath: testCliPath,
  timeout: 5000,
})

result
  .expectSuccess()
  .expectOutput('Usage:')
  .expectDuration(5000)
```

---

## Quick Migration Steps

### Manual Migration (per file)

1. Find: `runLocalCitty([`
2. Check if options follow: `], {`
3. Transform:
   - Move array into options object
   - Add `args:` key
   - Keep all other options

### Automated Migration

```bash
# Migrate all test files
node scripts/migrate-runLocalCitty.mjs "test/**/*.test.mjs"

# Migrate specific file
node scripts/migrate-runLocalCitty.mjs test/unit/local-runner.test.mjs

# Verify changes
git diff test/
```

---

## Regex Patterns

### Pattern 1: With Options
```regex
# Find:
runLocalCitty\(\[(.*?)\],\s*\{([^}]*)\}\)

# Replace:
runLocalCitty({ args: [$1], $2 })
```

### Pattern 2: Without Options
```regex
# Find:
runLocalCitty\(\[(.*?)\]\)

# Replace:
runLocalCitty({ args: [$1] })
```

---

## Examples by Use Case

### Testing CLI Help

```javascript
// ❌ OLD
await runLocalCitty(['--help'])

// ✅ NEW
await runLocalCitty({ args: ['--help'] })
```

### Testing with Environment

```javascript
// ❌ OLD
await runLocalCitty(['test'], { env: { DEBUG: '1' } })

// ✅ NEW
await runLocalCitty({
  args: ['test'],
  env: { DEBUG: '1' }
})
```

### Testing Custom CLI

```javascript
// ❌ OLD
await runLocalCitty(['--version'], {
  cliPath: './custom-cli.mjs',
  cwd: '/tmp',
  timeout: 5000
})

// ✅ NEW
await runLocalCitty({
  args: ['--version'],
  cliPath: './custom-cli.mjs',
  cwd: '/tmp',
  timeout: 5000
})
```

### Testing with JSON Output

```javascript
// ❌ OLD
const result = await runLocalCitty(['--json'], {
  json: true,
  timeout: 5000
})

// ✅ NEW
const result = await runLocalCitty({
  args: ['--json'],
  json: true,
  timeout: 5000
})
```

### Fluent Assertions (unchanged)

```javascript
// ✅ Same for both APIs
const result = await runLocalCitty({
  args: ['--help']
})

result
  .expectSuccess()
  .expectOutput(/Usage/)
  .expectDuration(1000)
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Forgetting `args` key

```javascript
// ❌ WRONG
await runLocalCitty({ ['--help'], env: {} })

// ✅ CORRECT
await runLocalCitty({ args: ['--help'], env: {} })
```

### ❌ Mistake 2: Mixing OLD and NEW APIs

```javascript
// ❌ WRONG
await runLocalCitty(['--help'], { args: ['--version'] })

// ✅ CORRECT
await runLocalCitty({ args: ['--help'] })
```

### ❌ Mistake 3: Nested arrays

```javascript
// ❌ WRONG
await runLocalCitty({ args: [['--help']] })

// ✅ CORRECT
await runLocalCitty({ args: ['--help'] })
```

---

## Migration Checklist

### Per File
- [ ] Find all `runLocalCitty(` calls
- [ ] Convert array-first to object-based
- [ ] Add `args:` key
- [ ] Keep all other options
- [ ] Run tests
- [ ] Fix any errors

### Per Project
- [ ] Run automated migration script
- [ ] Review all changes with `git diff`
- [ ] Run full test suite
- [ ] Fix edge cases
- [ ] Commit changes
- [ ] Update documentation

---

## Testing Your Migration

```javascript
// Before running tests, verify syntax:
describe('Migration test', () => {
  it('should use NEW API', async () => {
    // ✅ This should work
    const result = await runLocalCitty({
      args: ['--help']
    })

    expect(result.exitCode).toBe(0)
  })
})
```

---

## Quick Stats

| Metric | Value |
|--------|-------|
| Total calls to migrate | 90 |
| Test files affected | 16 |
| Estimated time | 3 hours |
| Automation rate | 80% |
| Breaking changes | 0 |

---

## Support

- Full Analysis: [docs/test-migration-80-20.md](./test-migration-80-20.md)
- Migration Guide: [docs/v0.5.1-migration.md](./v0.5.1-migration.md)
- Migration Script: [scripts/migrate-runLocalCitty.mjs](../scripts/migrate-runLocalCitty.mjs)

---

**Quick Reference** | **v0.5.0 → v0.5.1** | **Created: 2025-10-02**
