# Refactored Playground Tests

## Beautiful, Documentation-Ready Examples

All tests have been refactored to use the new clean API:

```javascript
// Clean, minimal API
const result = await runLocalCitty({
  args: ['--help']
})
result.expectSuccess().expectOutput('Usage')
```

## File Organization

### Core Playground Tests
- `playground.test.mjs` - Basic command testing examples
- `fluent-assertions.test.mjs` - Demonstrates wrapWithAssertions and fluent API
- `cli-path-selection.test.mjs` - Shows cliPath usage for testing different CLIs
- `snapshot-testing.test.mjs` - Snapshot testing patterns
- `analysis-tools.test.mjs` - CLI analysis and coverage commands
- `concurrent-scenarios.test.mjs` - Parallel test execution

### Project Tests
- `project-tests/demo-local.test.mjs` - Simple project example
- `project-tests/snapshot-test-project.test.mjs` - Snapshot testing example
- `project-tests/fluent-test.test.mjs` - Fluent API example

## Key Features Demonstrated

### 1. Clean API
```javascript
const result = await runLocalCitty({
  args: ['greet', 'Alice']
})
```

### 2. Custom CLI Paths
```javascript
const result = await runLocalCitty({
  cliPath: './my-custom-cli.js',
  args: ['test', '--verbose']
})
```

### 3. Fluent Assertions
```javascript
result
  .expectSuccess()
  .expectOutput(/Hello/)
  .expectNoStderr()
```

### 4. Environment Variables
```javascript
const result = await runLocalCitty({
  args: ['test'],
  env: { DEBUG: '1' }
})
```

### 5. Concurrent Testing
```javascript
const [r1, r2, r3] = await Promise.all([
  runLocalCitty({ args: ['cmd1'] }),
  runLocalCitty({ args: ['cmd2'] }),
  runLocalCitty({ args: ['cmd3'] })
])
```

## Copy-Paste Ready

All examples are:
- Clean and minimal
- Well-documented
- Production-ready
- Copy-paste ready for documentation
- Demonstrate best practices

## Migration Notes

### Old API
```javascript
const result = await runLocalCitty(['--help'], {
  cwd: playgroundDir
})
```

### New API
```javascript
const result = await runLocalCitty({
  args: ['--help']
})
```

The new API is:
- More explicit (named parameters)
- More flexible (easy to add options)
- More maintainable (clear what each option does)
- Better for documentation (self-documenting code)
