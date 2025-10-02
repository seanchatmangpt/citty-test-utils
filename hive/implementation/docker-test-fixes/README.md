# Docker Test Fixes Implementation

This directory contains improved Docker test implementations that fix reconnection issues and provide proper resource management.

## Key Improvements

### 1. Docker Availability Checking

**Before:**
```javascript
// Tests would fail if Docker wasn't running
await setupCleanroom()
```

**After:**
```javascript
// Tests skip gracefully if Docker is unavailable
const available = await isDockerRunning().catch(() => false)
if (!available) {
  console.warn('⚠️ Docker not available, cleanroom tests will be skipped')
  return null
}
```

### 2. Container Cleanup with Labels

**Before:**
```javascript
// No container labels, hard to clean up
const container = await new GenericContainer(nodeImage).start()
```

**After:**
```javascript
// Containers labeled for easy cleanup
const container = await new GenericContainer(nodeImage)
  .withLabels({ 'ctu-test': 'true' })
  .start()

// Cleanup all test containers
await execAsync('docker rm -f $(docker ps -aq --filter "label=ctu-test") 2>/dev/null || true')
```

### 3. Proper Test Lifecycle Management

**Before:**
```javascript
// No cleanup between tests
beforeAll(async () => {
  await setupCleanroom()
})
```

**After:**
```javascript
beforeAll(async () => {
  // Check Docker availability
  const available = await execAsync('docker info').then(() => true).catch(() => false)
  if (!available) return

  // Clean up existing containers
  await cleanupTestContainers()

  // Setup cleanroom
  await getSharedCleanroom()
})

afterEach(async () => {
  // Clean up after each test
  await cleanupTestContainers()
})

afterAll(async () => {
  // Final cleanup
  await cleanupTestContainers()
})
```

### 4. Retry Logic for Transient Errors

**Before:**
```javascript
// Single attempt, fails on transient errors
const container = await new GenericContainer(nodeImage).start()
```

**After:**
```javascript
// Retry with exponential backoff
const container = await retryWithBackoff(async () => {
  return await new GenericContainer(nodeImage)
    .withLabels({ 'ctu-test': 'true' })
    .start()
}, MAX_RETRIES, RETRY_DELAY)
```

### 5. Skip Logic for Missing Docker

**Before:**
```javascript
// Tests fail with cryptic errors
it('should run in cleanroom', async () => {
  await runCitty(['--version'])
})
```

**After:**
```javascript
// Tests skip gracefully with clear messages
it('should run in cleanroom', async () => {
  if (!dockerAvailable || !isCleanroomAvailable()) {
    console.log('⏭️ Skipping test - Docker/cleanroom not available')
    return
  }

  await runCitty(['--version'])
})
```

## Common Docker Test Issues Fixed

### Issue 1: Docker Daemon Not Running
**Solution:** Check Docker availability before running tests and skip gracefully if unavailable.

### Issue 2: Containers Not Being Cleaned Up
**Solution:** Use container labels (`ctu-test`) and clean up in `beforeAll`, `afterEach`, and `afterAll` hooks.

### Issue 3: Port Conflicts
**Solution:** Clean up all test containers before starting new tests.

### Issue 4: Transient Docker Errors
**Solution:** Implement retry logic with exponential backoff (3 retries by default).

### Issue 5: Resource Leaks
**Solution:** Proper cleanup in test lifecycle hooks and global teardown.

## Files in This Directory

### cleanroom-runner-improved.js
Improved cleanroom runner with:
- Docker availability checking
- Container labeling for cleanup
- Retry logic for transient errors
- Health check verification
- Proper resource cleanup

### shared-cleanroom-improved.mjs
Improved shared cleanroom setup with:
- Docker availability detection
- Skip logic when Docker is unavailable
- Proper cleanup of shared resources

### cleanroom-test-improved.test.mjs
Example test file demonstrating:
- Docker availability checking
- Container cleanup in lifecycle hooks
- Skip logic for missing Docker
- Concurrent test execution
- Resource management validation

### vitest-docker-setup.mjs
Global setup/teardown for Vitest:
- Pre-test Docker cleanup
- Post-test Docker cleanup
- Docker availability logging

## Usage

### Integration Steps

1. **Replace cleanroom-runner.js:**
   ```bash
   cp hive/implementation/docker-test-fixes/cleanroom-runner-improved.js src/core/runners/cleanroom-runner.js
   ```

2. **Replace shared-cleanroom.mjs:**
   ```bash
   cp hive/implementation/docker-test-fixes/shared-cleanroom-improved.mjs test/setup/shared-cleanroom.mjs
   ```

3. **Add global setup to vitest.config.js:**
   ```javascript
   export default defineConfig({
     test: {
       globalSetup: './hive/implementation/docker-test-fixes/vitest-docker-setup.mjs'
     }
   })
   ```

4. **Update test files:**
   Use the pattern from `cleanroom-test-improved.test.mjs` in your test files.

### Testing

```bash
# Run tests (will skip Docker tests if Docker is unavailable)
npm test

# Run only cleanroom tests
npm run test:readme:cleanroom

# Run integration tests
npm run test:integration
```

## Best Practices

1. **Always check Docker availability** in `beforeAll` hook
2. **Always clean up containers** in `afterEach` and `afterAll` hooks
3. **Use container labels** for easy cleanup (`ctu-test`)
4. **Implement skip logic** when Docker is unavailable
5. **Set reasonable timeouts** (60s for setup, 30s for teardown)
6. **Add retry logic** for transient Docker errors
7. **Verify container health** before executing commands

## Troubleshooting

### Docker not starting
```bash
# Check Docker status
docker info

# Start Docker Desktop (macOS)
open -a Docker

# Start Docker daemon (Linux)
sudo systemctl start docker
```

### Containers not being cleaned up
```bash
# Manual cleanup
docker rm -f $(docker ps -aq --filter "label=ctu-test")

# Check running containers
docker ps -a --filter "label=ctu-test"
```

### Tests timing out
- Increase timeout in `beforeAll` (default: 60s)
- Check Docker daemon performance
- Reduce concurrent test count

## Performance Tips

1. **Use shared cleanroom** across tests to avoid container startup overhead
2. **Run tests concurrently** with `describe.concurrent`
3. **Clean up only when necessary** (after each test vs after all tests)
4. **Set appropriate timeouts** based on operation complexity
5. **Use Alpine images** for smaller container size

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Check Docker availability
  run: docker info || echo "Docker not available"

- name: Run tests (skip Docker if unavailable)
  run: npm test
```

### Skip Docker tests in CI
```javascript
const isCI = process.env.CI === 'true'
const skipDocker = isCI && !dockerAvailable

it.skipIf(skipDocker)('should run in cleanroom', async () => {
  // Test code
})
```

## Summary

These improvements ensure:
- ✅ Tests skip gracefully when Docker is unavailable
- ✅ Containers are properly labeled and cleaned up
- ✅ Transient Docker errors are retried
- ✅ Resources are properly managed across test lifecycle
- ✅ Clear error messages when Docker is missing
- ✅ No container leaks or port conflicts
