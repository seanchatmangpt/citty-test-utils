# Test Helpers - Utility Library

Shared test utilities for citty-test-utils testing framework.

## Import

```javascript
// Import all utilities
import * from '../helpers/index.mjs'

// Or import specific utilities
import { isDockerAvailable, generateTestId } from '../helpers/index.mjs'
import { waitForContainer, getContainerLogs } from '../helpers/docker-utils.mjs'
```

## General Utilities (`test-utils.mjs`)

### `isDockerAvailable(): Promise<boolean>`
Check if Docker daemon is available on the system.

```javascript
if (!await isDockerAvailable()) {
  console.log('⏭️ Skipping - Docker not available')
  return
}
```

### `cleanupDockerContainers(label: string): Promise<void>`
Clean up Docker containers by label. Safe to call even if no containers exist.

```javascript
await cleanupDockerContainers('ctu-test')
```

### `createTestTimeout(ms: number): Promise<void>`
Create a promise that resolves after specified milliseconds.

```javascript
await createTestTimeout(5000) // Wait 5 seconds
```

### `generateTestId(prefix: string): string`
Generate a unique test identifier using timestamp and random string.

```javascript
const testId = generateTestId('my-test')
// Returns: 'my-test-1696789012345-a7b3c2d'
```

### `commandExists(command: string): Promise<boolean>`
Check if a command exists in PATH.

```javascript
const hasDocker = await commandExists('docker')
```

### `retryWithBackoff(fn: Function, maxAttempts: number, initialDelay: number): Promise<any>`
Retry a function with exponential backoff.

```javascript
const result = await retryWithBackoff(
  async () => await unreliableOperation(),
  3,      // max attempts
  1000    // initial delay in ms (will be 1s, 2s, 4s)
)
```

### `createTempDir(prefix: string): Promise<string>`
Create a temporary directory for test isolation.

```javascript
const tempDir = await createTempDir('my-test')
// Returns: '/tmp/my-test-abc123'
```

### `cleanupTempDir(dirPath: string): Promise<void>`
Clean up temporary directory. Safe to call even if directory doesn't exist.

```javascript
await cleanupTempDir(tempDir)
```

### `waitForCondition(condition: Function, timeout: number, interval: number): Promise<boolean>`
Wait for a condition to be true with timeout.

```javascript
const isReady = await waitForCondition(
  async () => {
    const status = await checkStatus()
    return status === 'ready'
  },
  5000,   // timeout (ms)
  100     // check interval (ms)
)
```

### `skipIf(condition: boolean, reason: string): void`
Skip test if condition is met. Logs reason to console.

```javascript
skipIf(!process.env.CI, 'Only run in CI')
```

### `createMockResult(overrides: object): object`
Create a mock CLI result object.

```javascript
const mockResult = createMockResult({
  exitCode: 1,
  stderr: 'Error message'
})
```

## Docker Utilities (`docker-utils.mjs`)

### `isDockerRunning(): Promise<boolean>`
Check if Docker daemon is running.

```javascript
if (!await isDockerRunning()) {
  throw new Error('Docker is not running')
}
```

### `getContainersByLabel(label: string): Promise<string[]>`
Get running Docker containers by label.

```javascript
const containers = await getContainersByLabel('test-suite')
// Returns: ['abc123', 'def456']
```

### `cleanupContainersByLabel(label: string): Promise<void>`
Stop and remove Docker containers by label.

```javascript
afterAll(async () => {
  await cleanupContainersByLabel('test-label')
})
```

### `waitForContainer(containerId: string, timeout: number): Promise<boolean>`
Wait for container to be ready.

```javascript
const isReady = await waitForContainer(containerId, 30000)
if (!isReady) {
  throw new Error('Container failed to start')
}
```

### `isContainerHealthy(containerId: string): Promise<boolean>`
Check if container is healthy (requires HEALTHCHECK in Dockerfile).

```javascript
const healthy = await isContainerHealthy(containerId)
```

### `getContainerLogs(containerId: string, lines: number): Promise<string>`
Get container logs.

```javascript
const logs = await getContainerLogs(containerId, 100)
console.log(logs)
```

### `execInContainer(containerId: string, command: string): Promise<object>`
Execute command in container.

```javascript
const result = await execInContainer(containerId, 'ls -la /app')
console.log(result.stdout)
// Returns: { stdout, stderr, exitCode }
```

### `copyToContainer(containerId: string, sourcePath: string, destPath: string): Promise<boolean>`
Copy file to container.

```javascript
const success = await copyToContainer(
  containerId,
  './test-file.txt',
  '/app/test-file.txt'
)
```

### `copyFromContainer(containerId: string, sourcePath: string, destPath: string): Promise<boolean>`
Copy file from container.

```javascript
const success = await copyFromContainer(
  containerId,
  '/app/output.txt',
  './output.txt'
)
```

### `isDockerComposeAvailable(): Promise<boolean>`
Check if Docker Compose is available (checks both `docker compose` and `docker-compose`).

```javascript
if (!await isDockerComposeAvailable()) {
  console.log('⏭️ Skipping - Docker Compose not available')
  return
}
```

## Usage Examples

### Complete Unit Test
```javascript
import { describe, it, expect, vi } from 'vitest'
import { generateTestId, createMockResult } from '../helpers/index.mjs'

describe('My Feature', () => {
  it('should generate unique IDs', () => {
    const id1 = generateTestId('test')
    const id2 = generateTestId('test')
    expect(id1).not.toBe(id2)
  })

  it('should create mock results', () => {
    const mock = createMockResult({ exitCode: 1 })
    expect(mock.exitCode).toBe(1)
    expect(mock.stdout).toBe('')
  })
})
```

### Complete Integration Test
```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  isDockerAvailable,
  generateTestId,
  retryWithBackoff,
  createTempDir,
  cleanupTempDir
} from '../helpers/index.mjs'

describe('Integration Test', () => {
  let tempDir
  let testId

  beforeAll(async () => {
    if (!await isDockerAvailable()) {
      console.log('⏭️ Skipping suite - Docker not available')
      return
    }

    tempDir = await createTempDir('integration')
    testId = generateTestId('integration')
  })

  afterAll(async () => {
    await cleanupTempDir(tempDir)
  })

  it('should test with retry', async () => {
    const result = await retryWithBackoff(
      async () => {
        // Potentially flaky operation
        return await someApiCall()
      },
      3,
      1000
    )

    expect(result).toBeTruthy()
  })
})
```

### Complete Docker Test
```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  isDockerAvailable,
  generateTestId
} from '../helpers/index.mjs'
import {
  cleanupContainersByLabel,
  waitForContainer,
  getContainerLogs,
  execInContainer,
  isContainerHealthy
} from '../helpers/docker-utils.mjs'

describe('Docker Integration', () => {
  const label = 'test-suite'
  let containerId

  beforeAll(async () => {
    if (!await isDockerAvailable()) {
      console.log('⏭️ Skipping suite - Docker not available')
      return
    }
  })

  afterAll(async () => {
    await cleanupContainersByLabel(label)
  })

  it('should start and test container', async () => {
    // Assume container created with label
    // containerId = ...

    // Wait for container
    const isReady = await waitForContainer(containerId, 30000)
    expect(isReady).toBe(true)

    // Check health
    const healthy = await isContainerHealthy(containerId)
    expect(healthy).toBe(true)

    // Execute command
    const result = await execInContainer(containerId, 'echo "test"')
    expect(result.stdout).toContain('test')
    expect(result.exitCode).toBe(0)

    // Get logs
    const logs = await getContainerLogs(containerId, 50)
    expect(logs).toBeTruthy()
  })
}, { timeout: 60000 })
```

### Waiting for Conditions
```javascript
import { waitForCondition } from '../helpers/index.mjs'

it('should wait for service to be ready', async () => {
  const isReady = await waitForCondition(
    async () => {
      try {
        const response = await fetch('http://localhost:3000/health')
        return response.status === 200
      } catch {
        return false
      }
    },
    10000,  // 10 second timeout
    500     // check every 500ms
  )

  expect(isReady).toBe(true)
})
```

### Temporary Directory Usage
```javascript
import { beforeEach, afterEach } from 'vitest'
import { createTempDir, cleanupTempDir } from '../helpers/index.mjs'
import { writeFile } from 'fs/promises'

let testDir

beforeEach(async () => {
  testDir = await createTempDir('file-test')
})

afterEach(async () => {
  await cleanupTempDir(testDir)
})

it('should work with temp files', async () => {
  const filePath = join(testDir, 'test.txt')
  await writeFile(filePath, 'test content')

  // Test code...
  // Files automatically cleaned up in afterEach
})
```

## Best Practices

1. **Always cleanup**: Use `afterEach`/`afterAll` for cleanup
2. **Check availability**: Use `isDockerAvailable()` before Docker tests
3. **Use unique IDs**: Generate test IDs to avoid conflicts
4. **Retry flaky operations**: Use `retryWithBackoff` for unreliable operations
5. **Set timeouts**: Docker tests need longer timeouts (30s+)
6. **Isolate tests**: Use temp directories for file operations
7. **Wait for conditions**: Use `waitForCondition` instead of fixed delays
8. **Handle failures gracefully**: Cleanup even when tests fail

## Performance Tips

1. **Reuse containers**: Share containers across tests when possible
2. **Parallel execution**: Tests using these utilities work concurrently
3. **Appropriate timeouts**: Don't use excessive timeouts
4. **Efficient polling**: Use reasonable intervals in `waitForCondition`
5. **Cleanup eagerly**: Don't wait until the end to cleanup resources

## Troubleshooting

### Docker utilities failing
```javascript
// Check Docker is running
const running = await isDockerRunning()
console.log('Docker running:', running)

// Check containers
const containers = await getContainersByLabel('test')
console.log('Test containers:', containers)

// Get container logs for debugging
const logs = await getContainerLogs(containerId, 200)
console.log('Container logs:', logs)
```

### Tests timing out
```javascript
// Increase timeout for specific test
it('slow test', async () => {
  // ...
}, { timeout: 60000 })

// Or use retry with backoff
const result = await retryWithBackoff(
  async () => await slowOperation(),
  5,      // more attempts
  2000    // longer initial delay
)
```

### Flaky tests
```javascript
// Use waitForCondition instead of fixed delays
await waitForCondition(
  async () => await checkCondition(),
  10000,
  100
)

// Use retry for operations that might fail temporarily
const result = await retryWithBackoff(
  async () => await unstableOperation(),
  3,
  1000
)
```

## Contributing

To add new utilities:

1. Add function to appropriate file (`test-utils.mjs` or `docker-utils.mjs`)
2. Export from `index.mjs`
3. Add JSDoc documentation
4. Add usage example to this README
5. Add tests for the utility

## Files

- `test-utils.mjs` - General test utilities
- `docker-utils.mjs` - Docker-specific utilities
- `index.mjs` - Exports all utilities
- `README.md` - This file
