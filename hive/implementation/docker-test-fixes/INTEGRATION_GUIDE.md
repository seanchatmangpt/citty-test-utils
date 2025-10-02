# Docker Test Fixes Integration Guide

## Quick Start

Follow these steps to integrate the Docker test fixes into your project.

## Step 1: Backup Current Files

```bash
# Create backup directory
mkdir -p hive/backups/docker-fixes-backup

# Backup current implementation
cp src/core/runners/cleanroom-runner.js hive/backups/docker-fixes-backup/
cp test/setup/shared-cleanroom.mjs hive/backups/docker-fixes-backup/
```

## Step 2: Replace Core Files

```bash
# Replace cleanroom runner with improved version
cp hive/implementation/docker-test-fixes/cleanroom-runner-improved.js src/core/runners/cleanroom-runner.js

# Replace shared cleanroom setup
cp hive/implementation/docker-test-fixes/shared-cleanroom-improved.mjs test/setup/shared-cleanroom.mjs
```

## Step 3: Add Global Setup to Vitest

Edit `vitest.config.js` (create if it doesn't exist):

```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Add global setup for Docker cleanup
    globalSetup: './hive/implementation/docker-test-fixes/vitest-docker-setup.mjs',

    // Recommended test timeout
    testTimeout: 30000,

    // Allow concurrent tests
    maxConcurrency: 5,

    // Improved error reporting
    reporter: ['verbose'],
  }
})
```

## Step 4: Update Test Files

### Pattern 1: Basic Test with Docker Check

```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getSharedCleanroom, isCleanroomAvailable } from '../setup/shared-cleanroom.mjs'
import { runCitty } from '../../index.js'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

describe('My Cleanroom Tests', () => {
  let dockerAvailable = false

  beforeAll(async () => {
    // Check Docker availability
    dockerAvailable = await execAsync('docker info')
      .then(() => true)
      .catch(() => false)

    if (!dockerAvailable) {
      console.warn('⚠️ Docker not available, tests will be skipped')
      return
    }

    // Setup cleanroom
    await getSharedCleanroom()
  }, 60000)

  afterAll(async () => {
    if (!dockerAvailable) return

    // Cleanup
    await execAsync('docker rm -f $(docker ps -aq --filter "label=ctu-test") 2>/dev/null || true')
  }, 30000)

  it('should run in cleanroom', async () => {
    if (!dockerAvailable || !isCleanroomAvailable()) {
      console.log('⏭️ Skipping test - Docker/cleanroom not available')
      return
    }

    const result = await runCitty(['--version'])
    expect(result.exitCode).toBe(0)
  })
})
```

### Pattern 2: Concurrent Tests with Cleanup

```javascript
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'

describe.concurrent('Concurrent Cleanroom Tests', () => {
  let dockerAvailable = false

  beforeAll(async () => {
    dockerAvailable = await execAsync('docker info')
      .then(() => true)
      .catch(() => false)

    if (!dockerAvailable) return

    // Clean up existing containers
    await execAsync('docker rm -f $(docker ps -aq --filter "label=ctu-test") 2>/dev/null || true')

    await getSharedCleanroom()
  }, 60000)

  afterEach(async () => {
    if (!dockerAvailable) return

    // Clean up after each test
    await execAsync('docker rm -f $(docker ps -aq --filter "label=ctu-test") 2>/dev/null || true')
  })

  afterAll(async () => {
    if (!dockerAvailable) return

    // Final cleanup
    await execAsync('docker rm -f $(docker ps -aq --filter "label=ctu-test") 2>/dev/null || true')
  }, 30000)

  it('test 1', async () => {
    if (!dockerAvailable || !isCleanroomAvailable()) {
      console.log('⏭️ Skipping test')
      return
    }
    // Test code
  })

  it('test 2', async () => {
    if (!dockerAvailable || !isCleanroomAvailable()) {
      console.log('⏭️ Skipping test')
      return
    }
    // Test code
  })
})
```

## Step 5: Update Existing Test Files

Find all test files that use cleanroom:

```bash
# List all cleanroom tests
find test -name "*.test.mjs" -exec grep -l "cleanroom" {} \;
```

For each file:

1. Add Docker availability check in `beforeAll`
2. Add cleanup in `afterEach` and `afterAll`
3. Add skip logic in each test
4. Increase timeouts if needed

## Step 6: Verify Integration

```bash
# Test with Docker running
npm test

# Test with Docker stopped (should skip gracefully)
# Stop Docker first, then:
npm test
```

## Step 7: Update CI/CD (if applicable)

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Check Docker availability
        run: docker info || echo "Docker not available, tests will skip"

      - name: Run tests
        run: npm test
```

## Common Migration Issues

### Issue 1: Import Paths Changed

**Error:** `Cannot find module '../setup/shared-cleanroom.mjs'`

**Fix:** Update import path to match your directory structure:
```javascript
import { getSharedCleanroom } from '../setup/shared-cleanroom.mjs'
// or
import { getSharedCleanroom } from '../../test/setup/shared-cleanroom.mjs'
```

### Issue 2: Tests Still Failing Without Docker

**Error:** Tests fail instead of skipping

**Fix:** Ensure all tests have skip logic:
```javascript
if (!dockerAvailable || !isCleanroomAvailable()) {
  console.log('⏭️ Skipping test')
  return
}
```

### Issue 3: Containers Not Being Cleaned Up

**Error:** `docker ps` shows many test containers

**Fix:** Add cleanup to all lifecycle hooks:
```javascript
afterEach(async () => {
  await execAsync('docker rm -f $(docker ps -aq --filter "label=ctu-test") 2>/dev/null || true')
})
```

### Issue 4: Timeout Errors

**Error:** `Test timed out`

**Fix:** Increase timeouts in lifecycle hooks:
```javascript
beforeAll(async () => {
  // ... setup code
}, 90000) // Increase from 60000 to 90000

afterAll(async () => {
  // ... cleanup code
}, 45000) // Increase from 30000 to 45000
```

## Rollback Plan

If you need to rollback:

```bash
# Restore original files
cp hive/backups/docker-fixes-backup/cleanroom-runner.js src/core/runners/
cp hive/backups/docker-fixes-backup/shared-cleanroom.mjs test/setup/

# Revert vitest.config.js changes
git checkout vitest.config.js
```

## Testing Checklist

- [ ] Tests skip gracefully when Docker is not running
- [ ] Tests pass when Docker is running
- [ ] Containers are cleaned up after tests (`docker ps -a --filter "label=ctu-test"` shows nothing)
- [ ] Concurrent tests don't interfere with each other
- [ ] CI/CD pipeline passes (if applicable)
- [ ] No timeout errors
- [ ] Clear skip messages in test output

## Performance Validation

Run this to verify performance:

```bash
# Sequential timing
time npm run test:integration

# Check container cleanup
docker ps -a --filter "label=ctu-test"

# Should show 0 containers after tests
```

## Next Steps

After integration:

1. Monitor test runs for issues
2. Adjust timeouts if needed
3. Consider adding more skip patterns for other environment checks
4. Update documentation with new patterns

## Support

If you encounter issues:

1. Check Docker is running: `docker info`
2. Check container cleanup: `docker ps -a --filter "label=ctu-test"`
3. Review test output for skip messages
4. Check `hive/implementation/docker-test-fixes/README.md` for troubleshooting

## Summary

After integration, your tests will:
- ✅ Skip gracefully when Docker is unavailable
- ✅ Clean up containers properly
- ✅ Handle transient Docker errors
- ✅ Provide clear error messages
- ✅ Run faster with proper resource management
