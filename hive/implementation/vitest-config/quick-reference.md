# Vitest Configuration - Quick Reference

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run Docker/cleanroom tests
npm run test:docker

# Run with coverage
npm run test:coverage

# Watch mode (auto-rerun on changes)
npm run test:watch

# UI mode (browser interface)
npm run test:ui

# Update snapshots
npm run test:snapshot

# Run only changed tests
npm run test:changed

# Run with verbose output and bail on first failure
npm run test:failed
```

## 📦 Importing Test Utilities

```javascript
// General utilities
import {
  isDockerAvailable,
  cleanupDockerContainers,
  createTestTimeout,
  generateTestId,
  commandExists,
  retryWithBackoff,
  createTempDir,
  cleanupTempDir,
  waitForCondition,
  skipIf,
  createMockResult
} from '../helpers/index.mjs'

// Docker-specific utilities
import {
  isDockerRunning,
  getContainersByLabel,
  cleanupContainersByLabel,
  waitForContainer,
  isContainerHealthy,
  getContainerLogs,
  execInContainer,
  copyToContainer,
  copyFromContainer,
  isDockerComposeAvailable
} from '../helpers/docker-utils.mjs'
```

## 🔧 Common Patterns

### Skip Test if Docker Not Available
```javascript
it('docker test', async () => {
  if (!await isDockerAvailable()) {
    console.log('⏭️ Skipping - Docker not available')
    return
  }
  // Test code
})
```

### Generate Unique Test ID
```javascript
const testId = generateTestId('my-test')
// Result: 'my-test-1696789012345-a7b3c2d'
```

### Retry Flaky Operations
```javascript
const result = await retryWithBackoff(
  async () => await unreliableOperation(),
  3,      // max attempts
  1000    // initial delay (ms)
)
```

### Wait for Condition
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

### Create Temp Directory
```javascript
import { beforeEach, afterEach } from 'vitest'

let tempDir

beforeEach(async () => {
  tempDir = await createTempDir('my-test')
})

afterEach(async () => {
  await cleanupTempDir(tempDir)
})
```

### Docker Container Cleanup
```javascript
import { afterAll } from 'vitest'

afterAll(async () => {
  await cleanupContainersByLabel('my-test-label')
})
```

### Wait for Container
```javascript
const containerId = 'abc123'
const isReady = await waitForContainer(containerId, 30000)

if (isReady) {
  const logs = await getContainerLogs(containerId, 100)
  console.log(logs)
}
```

## ⚙️ Configuration Highlights

### Coverage Thresholds
- Lines: 80%
- Functions: 80%
- Statements: 80%
- Branches: 75%

### Timeouts
- Test: 30,000ms (30s) - for Docker operations
- Hook: 10,000ms (10s) - for setup/teardown
- Teardown: 5,000ms (5s)

### Test Execution
- Pool: threads
- Concurrent: enabled
- Isolation: enabled
- Globals: disabled (explicit imports)

### Coverage Reports
- text (console output)
- json (./coverage/coverage-final.json)
- html (./coverage/index.html)
- lcov (./coverage/lcov.info)

## 📁 File Organization

```
test/
├── unit/              # Fast unit tests (<100ms)
│   ├── *.test.mjs
│   └── __snapshots__/
├── integration/       # Integration tests (<5s)
│   ├── *.test.mjs
│   └── cleanroom*.test.mjs  # Docker tests (<30s)
├── helpers/          # Shared utilities
│   ├── test-utils.mjs
│   ├── docker-utils.mjs
│   └── index.mjs
└── setup/            # Setup files
```

## 🎯 Test Types

### Unit Test Template
```javascript
import { describe, it, expect, vi } from 'vitest'

describe('Unit Test Suite', () => {
  it('should test pure function', () => {
    const result = myFunction('input')
    expect(result).toBe('expected')
  })

  it('should test with mocks', () => {
    const mock = vi.fn().mockReturnValue('mocked')
    expect(mock()).toBe('mocked')
  })
})
```

### Integration Test Template
```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { isDockerAvailable, generateTestId } from '../helpers/index.mjs'

describe('Integration Test Suite', () => {
  let testId

  beforeAll(async () => {
    if (!await isDockerAvailable()) {
      console.log('⏭️ Skipping suite - Docker not available')
      return
    }
    testId = generateTestId('integration')
  })

  afterAll(async () => {
    // Cleanup
  })

  it('should test integration', async () => {
    // Test code
  })
})
```

### Docker Test Template
```javascript
import { describe, it, expect, afterAll } from 'vitest'
import {
  isDockerAvailable,
  cleanupContainersByLabel,
  waitForContainer
} from '../helpers/index.mjs'

describe('Docker Test Suite', () => {
  const label = 'test-suite'

  afterAll(async () => {
    await cleanupContainersByLabel(label)
  })

  it('should test with docker', async () => {
    if (!await isDockerAvailable()) {
      console.log('⏭️ Skipping - Docker not available')
      return
    }

    // Create container with label
    // const containerId = ...
    
    await waitForContainer(containerId, 30000)
    // Test code
  })
}, { timeout: 60000 })
```

## 🐛 Debugging

### View Coverage Report
```bash
npm run test:coverage
open coverage/index.html
```

### Run Single Test File
```bash
npx vitest run test/unit/my-test.test.mjs
```

### Run Tests Matching Pattern
```bash
npx vitest run --testNamePattern="should handle errors"
```

### Debug with Console Logs
```javascript
it('debug test', () => {
  console.log('Debug info:', someVariable)
  expect(true).toBe(true)
})
```

### Use Vitest UI
```bash
npm run test:ui
# Opens browser at http://localhost:51204/__vitest__/
```

## 📊 Viewing Results

### Console Output
```bash
npm test
# Shows: PASS/FAIL, test names, timing
```

### JSON Results
```bash
cat test-results/results.json | jq
```

### Coverage Report
```bash
npm run test:coverage
open coverage/index.html
```

## 🔍 Troubleshooting

### Tests Hanging
- Check for missing `await` in async tests
- Verify timeouts are appropriate
- Check for unclosed resources

### Docker Tests Failing
```bash
docker info  # Check Docker is running
docker ps    # Check for stale containers
```

### Coverage Too Low
```bash
npm run test:coverage
# Review uncovered lines in HTML report
# Add tests for missing branches
```

### Snapshot Mismatches
```bash
npm run test:snapshot  # Update all snapshots
# Or update specific snapshot in test file
```

## 💡 Tips

1. **Keep tests isolated**: Use beforeEach/afterEach for setup/cleanup
2. **Use descriptive names**: Test names should explain what and why
3. **Avoid test interdependence**: Tests should work in any order
4. **Mock external dependencies**: Keep tests fast and reliable
5. **Use utilities**: Reuse helpers from test/helpers/
6. **Clean up resources**: Always cleanup in afterEach/afterAll
7. **Set appropriate timeouts**: Unit: fast, Integration: medium, Docker: long
8. **Run tests frequently**: Use watch mode during development
9. **Check coverage regularly**: Aim for thresholds
10. **Update snapshots carefully**: Review changes before updating

## 📚 Further Reading

- [Vitest Guide](https://vitest.dev/guide/)
- [API Reference](https://vitest.dev/api/)
- [Coverage Guide](https://vitest.dev/guide/coverage.html)
- [Mocking Guide](https://vitest.dev/guide/mocking.html)
- [Migration from Jest](https://vitest.dev/guide/migration.html)
