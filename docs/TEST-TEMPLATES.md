# Test Templates for citty-test-utils

**Purpose**: Reusable test templates and patterns for comprehensive testing

## README Example Validation Template

```javascript
import { describe, it, expect } from 'vitest'
import { runLocalCitty, scenario } from 'citty-test-utils'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const playgroundDir = join(__dirname, '../..')

describe('README Section: [SECTION_NAME]', () => {
  it('[DESCRIPTION] (lines X-Y)', async () => {
    // Copy EXACT code from README
    const result = await runLocalCitty({
      args: ['--help'],
      cwd: playgroundDir,
      cliPath: 'src/cli.mjs',
      env: { TEST_CLI: 'true' }
    })

    // Validate as shown in README
    result.expectSuccess().expectOutput('USAGE')

    // Additional assertions
    expect(result.result.exitCode).toBe(0)
  })
})
```

## Export Validation Template

```javascript
import { describe, it, expect } from 'vitest'

describe('Package Export Validation', () => {
  it('should export all documented functions', async () => {
    // Dynamic import to test published package
    const pkg = await import('citty-test-utils')

    const requiredExports = [
      'runLocalCitty',
      'runCitty',
      'scenario',
      'scenarios',
      // Add all documented exports
    ]

    requiredExports.forEach(name => {
      expect(pkg[name], `Export ${name} should exist`).toBeDefined()
      expect(typeof pkg[name], `${name} should be a function`).toBe('function')
    })
  })

  it('should have correct function signatures', () => {
    const { runLocalCitty } = require('citty-test-utils')

    // Test function accepts correct parameters
    expect(runLocalCitty.length).toBeLessThanOrEqual(1) // Single options object
  })
})
```

## API Contract Validation Template

```javascript
import { describe, it, expect } from 'vitest'
import { z } from 'zod'

describe('API Contract: [FUNCTION_NAME]', () => {
  const optionsSchema = z.object({
    args: z.array(z.string()),
    cwd: z.string().optional(),
    cliPath: z.string(),
    env: z.record(z.string()).optional(),
    timeout: z.number().optional()
  })

  it('should accept valid options object', () => {
    const validOptions = {
      args: ['--help'],
      cliPath: 'src/cli.mjs'
    }

    expect(() => optionsSchema.parse(validOptions)).not.toThrow()
  })

  it('should reject invalid options', () => {
    const invalidOptions = {
      args: 'not-an-array', // Should be array
      cliPath: 'cli.mjs'
    }

    expect(() => optionsSchema.parse(invalidOptions))
      .toThrow(/expected array/)
  })

  it('should handle optional fields', () => {
    const minimalOptions = {
      args: ['--help'],
      cliPath: 'cli.mjs'
    }

    expect(() => optionsSchema.parse(minimalOptions)).not.toThrow()
  })

  it('should validate required fields', () => {
    const missingRequired = {
      args: ['--help']
      // Missing cliPath
    }

    expect(() => optionsSchema.parse(missingRequired))
      .toThrow(/required/i)
  })
})
```

## Zod Schema Validation Template

```javascript
import { describe, it, expect } from 'vitest'
import { runLocalCittyOptionsSchema } from '../src/core/runners/schemas.js'

describe('Zod Schema: [SCHEMA_NAME]', () => {
  it('should parse valid input', () => {
    const valid = {
      args: ['--help'],
      cwd: './project',
      cliPath: 'src/cli.mjs',
      env: { DEBUG: 'true' },
      timeout: 30000
    }

    const result = runLocalCittyOptionsSchema.parse(valid)
    expect(result).toEqual(valid)
  })

  it('should apply defaults', () => {
    const minimal = {
      args: ['--help'],
      cliPath: 'cli.mjs'
    }

    const result = runLocalCittyOptionsSchema.parse(minimal)
    expect(result.timeout).toBeDefined() // Should have default
  })

  it('should reject invalid types', () => {
    const invalid = {
      args: 'not-an-array',
      cliPath: 'cli.mjs'
    }

    expect(() => runLocalCittyOptionsSchema.parse(invalid))
      .toThrow()
  })

  it('should provide clear error messages', () => {
    const invalid = {
      args: 123,
      cliPath: 'cli.mjs'
    }

    try {
      runLocalCittyOptionsSchema.parse(invalid)
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error.message).toMatch(/args/)
      expect(error.message).toMatch(/array/i)
    }
  })
})
```

## Scenario DSL Test Template

```javascript
import { describe, it, expect } from 'vitest'
import { scenario, scenarios } from 'citty-test-utils'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const playgroundDir = join(__dirname, '../..')

describe('Scenario DSL: [METHOD_NAME]', () => {
  it('should accept options object', async () => {
    const result = await scenario('Test scenario')
      .step('Test step')
      .run({
        args: ['--help'],
        cwd: playgroundDir,
        cliPath: 'src/cli.mjs'
      })
      .expectSuccess()
      .execute('local')

    expect(result.success).toBe(true)
  })

  it('should accept string args (backward compatibility)', async () => {
    const result = await scenario('Test scenario')
      .step('Test step')
      .run('--help', {
        cwd: playgroundDir,
        cliPath: 'src/cli.mjs'
      })
      .expectSuccess()
      .execute('local')

    expect(result.success).toBe(true)
  })

  it('should chain multiple steps', async () => {
    const result = await scenario('Multi-step test')
      .step('First')
      .run({ args: ['--help'], cwd: playgroundDir, cliPath: 'src/cli.mjs' })
      .expectSuccess()
      .step('Second')
      .run({ args: ['--version'], cwd: playgroundDir, cliPath: 'src/cli.mjs' })
      .expectSuccess()
      .execute('local')

    expect(result.success).toBe(true)
    expect(result.steps).toHaveLength(2)
  })
})
```

## Dependency Compatibility Test Template

```javascript
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('Dependency Compatibility: [PACKAGE_NAME]', () => {
  it('should use correct version', () => {
    const pkgPath = join(process.cwd(), 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

    const version = pkg.dependencies['zod']
    expect(version).toMatch(/^\^4\./) // Or whatever version required
  })

  it('should work with installed version', async () => {
    const { z } = await import('zod')

    // Test that our usage works with this version
    const schema = z.object({ test: z.string() })
    expect(() => schema.parse({ test: 'value' })).not.toThrow()
  })

  it('should handle version-specific behavior', () => {
    // Test any version-specific behavior
    // For Zod v4, test that parse() works as expected
  })
})
```

## Error Handling Test Template

```javascript
import { describe, it, expect } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'

describe('Error Handling: [SCENARIO]', () => {
  it('should handle [ERROR_TYPE] gracefully', async () => {
    const result = await runLocalCitty({
      args: ['invalid-command'],
      cwd: './nonexistent',
      cliPath: 'src/cli.mjs'
    })

    // Should return result, not throw
    expect(result).toBeDefined()
    expect(result.result.exitCode).not.toBe(0)
  })

  it('should provide clear error message', async () => {
    const result = await runLocalCitty({
      args: ['invalid-command'],
      cwd: playgroundDir,
      cliPath: 'src/cli.mjs'
    })

    expect(result.result.stderr).toMatch(/error|invalid|unknown/i)
  })

  it('should include error context', async () => {
    const result = await runLocalCitty({
      args: ['invalid-command'],
      cwd: playgroundDir,
      cliPath: 'src/cli.mjs'
    })

    expect(result.result.stderr.length).toBeGreaterThan(0)
  })
})
```

## CLI Command Test Template

```javascript
import { describe, it, expect } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const mainProject = join(__dirname, '../../..')

describe('CLI Command: [COMMAND_NAME]', () => {
  it('should show help', async () => {
    const result = await runLocalCitty({
      args: ['[command]', '--help'],
      cwd: mainProject,
      cliPath: 'src/cli.mjs'
    })

    result.expectSuccess()
    expect(result.result.stdout).toMatch(/usage|help|description/i)
  })

  it('should handle valid input', async () => {
    const result = await runLocalCitty({
      args: ['[command]', 'valid-arg'],
      cwd: mainProject,
      cliPath: 'src/cli.mjs'
    })

    result.expectSuccess()
  })

  it('should reject invalid input', async () => {
    const result = await runLocalCitty({
      args: ['[command]', 'invalid-arg'],
      cwd: mainProject,
      cliPath: 'src/cli.mjs'
    })

    result.expectFailure()
  })

  it('should support all documented flags', async () => {
    const flags = ['--flag1', '--flag2', '--flag3']

    for (const flag of flags) {
      const result = await runLocalCitty({
        args: ['[command]', flag],
        cwd: mainProject,
        cliPath: 'src/cli.mjs'
      })

      expect(result.result.exitCode).toBe(0)
    }
  })
})
```

## Integration Test Template

```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { runLocalCitty, scenario } from 'citty-test-utils'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('Integration: [FEATURE_NAME]', () => {
  let tempDir

  beforeAll(async () => {
    // Setup test environment
    tempDir = await mkdtemp(join(tmpdir(), 'test-'))
  })

  afterAll(async () => {
    // Cleanup
    await rm(tempDir, { recursive: true, force: true })
  })

  it('should work end-to-end', async () => {
    // 1. Setup
    // 2. Execute
    const result = await runLocalCitty({
      args: ['command'],
      cwd: tempDir,
      cliPath: 'src/cli.mjs'
    })

    // 3. Verify
    result.expectSuccess()

    // 4. Cleanup (if needed)
  })

  it('should handle complex workflow', async () => {
    const workflow = await scenario('Complex workflow')
      .step('Initialize')
      .run({ args: ['init'], cwd: tempDir, cliPath: 'src/cli.mjs' })
      .expectSuccess()
      .step('Build')
      .run({ args: ['build'], cwd: tempDir, cliPath: 'src/cli.mjs' })
      .expectSuccess()
      .step('Test')
      .run({ args: ['test'], cwd: tempDir, cliPath: 'src/cli.mjs' })
      .expectSuccess()
      .execute('local')

    expect(workflow.success).toBe(true)
  })
})
```

## Snapshot Test Template

```javascript
import { describe, it, expect } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'

describe('Snapshot: [OUTPUT_TYPE]', () => {
  it('should match output snapshot', async () => {
    const result = await runLocalCitty({
      args: ['command'],
      cwd: playgroundDir,
      cliPath: 'src/cli.mjs'
    })

    result.expectSuccess()

    // Snapshot the output
    expect(result.result.stdout).toMatchSnapshot()
  })

  it('should match JSON snapshot', async () => {
    const result = await runLocalCitty({
      args: ['command', '--json'],
      cwd: playgroundDir,
      cliPath: 'src/cli.mjs'
    })

    result.expectSuccess().expectJson()

    // Snapshot the parsed JSON
    expect(result.json).toMatchSnapshot()
  })
})
```

## Performance Test Template

```javascript
import { describe, it, expect } from 'vitest'
import { runLocalCitty } from 'citty-test-utils'

describe('Performance: [OPERATION]', () => {
  it('should complete within timeout', async () => {
    const start = Date.now()

    const result = await runLocalCitty({
      args: ['command'],
      cwd: playgroundDir,
      cliPath: 'src/cli.mjs',
      timeout: 5000
    })

    const duration = Date.now() - start

    result.expectSuccess()
    expect(duration).toBeLessThan(5000)
  }, 10000) // Vitest timeout

  it('should handle large input efficiently', async () => {
    const largeInput = Array(1000).fill('item').join('\n')

    const result = await runLocalCitty({
      args: ['command'],
      cwd: playgroundDir,
      cliPath: 'src/cli.mjs',
      env: { INPUT: largeInput }
    })

    result.expectSuccess()
  })
})
```

## Usage Examples

### 1. Creating a README Validation Test

```javascript
// Copy template
// Replace [SECTION_NAME] with "Quick Start"
// Replace [DESCRIPTION] with "Drive bundled playground"
// Copy exact README code
// Update line numbers
// Add specific assertions
```

### 2. Creating an Export Test

```javascript
// Copy export validation template
// List all exports from index.js
// Add to requiredExports array
// Run test
```

### 3. Creating an API Contract Test

```javascript
// Copy API contract template
// Define Zod schema for function
// Add valid/invalid test cases
// Test edge cases
```

## Best Practices

1. **Use Templates as Starting Point** - Customize for specific needs
2. **Copy Exact README Code** - Don't modify examples
3. **Test Against Published Package** - Import from 'citty-test-utils'
4. **Include Line Numbers** - Reference README sections
5. **Test Valid AND Invalid** - Cover both success and failure cases
6. **Clear Descriptions** - Explain what each test validates
7. **Cleanup After Tests** - Remove temp files
8. **Use Descriptive Names** - Test name explains purpose

## Anti-Patterns to Avoid

❌ **Testing Local Source Instead of Package**
```javascript
// WRONG
import { runLocalCitty } from '../../../src/core/runners/local-runner.js'

// RIGHT
import { runLocalCitty } from 'citty-test-utils'
```

❌ **Modifying README Examples**
```javascript
// WRONG - Modified from README
const result = await runLocalCitty({ args: ['--help'] }) // Missing cliPath

// RIGHT - Exact from README
const result = await runLocalCitty({
  args: ['--help'],
  cliPath: 'src/cli.mjs'
})
```

❌ **Vague Test Descriptions**
```javascript
// WRONG
it('should work', async () => {})

// RIGHT
it('should execute --help command and show usage (README lines 76-88)', async () => {})
```

❌ **Missing Error Cases**
```javascript
// WRONG - Only test success
it('should run command', () => {})

// RIGHT - Test success AND failure
it('should run valid command', () => {})
it('should reject invalid command', () => {})
```

## Maintenance

Update templates when:
- API changes
- New patterns emerge
- Better practices identified
- Common bugs found

---

**Remember**: Templates are starting points. Customize for your specific test needs while maintaining consistency.
