# Vitest Configuration Implementation

## Overview
Comprehensive Vitest configuration for citty-test-utils with optimized performance, coverage tracking, and Docker integration support.

## Files Created

### 1. vitest.config.js
**Location**: `/vitest.config.js`

**Key Features**:
- Thread-based parallel execution with isolation
- V8 coverage provider for faster performance
- 80% coverage thresholds (lines, functions, statements)
- 75% branch coverage threshold
- 30s test timeout for Docker operations
- Concurrent test execution enabled
- Snapshot path resolution
- Comprehensive exclusion patterns

**Configuration Highlights**:
```javascript
{
  pool: 'threads',
  coverage: {
    provider: 'v8',
    thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 }
  },
  testTimeout: 30000, // Docker-friendly timeout
  sequence: { concurrent: true }
}
```

### 2. Test Utilities (test/helpers/test-utils.mjs)
**Purpose**: Shared test utilities for common operations

**Functions**:
- `isDockerAvailable()` - Check Docker availability
- `cleanupDockerContainers(label)` - Clean up test containers
- `createTestTimeout(ms)` - Promise-based delays
- `generateTestId(prefix)` - Unique test identifiers
- `commandExists(command)` - Check command availability
- `retryWithBackoff(fn, maxAttempts, initialDelay)` - Retry with exponential backoff
- `createTempDir(prefix)` - Create isolated temp directories
- `cleanupTempDir(dirPath)` - Clean up temp directories
- `waitForCondition(condition, timeout, interval)` - Polling helper
- `skipIf(condition, reason)` - Conditional test skipping
- `createMockResult(overrides)` - Mock CLI results

### 3. Docker Utilities (test/helpers/docker-utils.mjs)
**Purpose**: Docker-specific test helpers

**Functions**:
- `isDockerRunning()` - Check Docker daemon status
- `getContainersByLabel(label)` - Find containers by label
- `cleanupContainersByLabel(label)` - Cleanup labeled containers
- `waitForContainer(containerId, timeout)` - Wait for container ready
- `isContainerHealthy(containerId)` - Check container health
- `getContainerLogs(containerId, lines)` - Retrieve container logs
- `execInContainer(containerId, command)` - Execute commands in container
- `copyToContainer(containerId, src, dest)` - Copy files to container
- `copyFromContainer(containerId, src, dest)` - Copy files from container
- `isDockerComposeAvailable()` - Check Docker Compose availability

### 4. Index Export (test/helpers/index.mjs)
**Purpose**: Centralized export of all test utilities

## Package.json Updates

### Simplified Test Scripts
```json
{
  "test": "vitest run",
  "test:unit": "vitest run test/unit",
  "test:integration": "vitest run test/integration",
  "test:cleanroom": "vitest run test/integration/cleanroom*.test.mjs",
  "test:docker": "vitest run test/integration/cleanroom*.test.mjs",
  "test:coverage": "vitest run --coverage",
  "test:watch": "vitest watch",
  "test:ui": "vitest --ui",
  "test:snapshot": "vitest run --update",
  "test:changed": "vitest run --changed",
  "test:failed": "vitest run --reporter=verbose --bail"
}
```

## Best Practices Implemented

### 1. Performance Optimization
- Thread pool for parallel execution
- V8 coverage provider (faster than Istanbul)
- Concurrent test execution
- Isolated test runs prevent interference

### 2. Docker Integration
- 30s test timeout for container operations
- Docker availability checks
- Container cleanup utilities
- Health check helpers
- Log retrieval functions

### 3. Test Organization
```
test/
├── unit/           # Fast unit tests
├── integration/    # Integration tests (including Docker)
├── readme/         # Documentation tests
├── bdd/           # BDD-style tests
├── helpers/       # Shared test utilities
│   ├── test-utils.mjs    # General utilities
│   ├── docker-utils.mjs  # Docker-specific
│   └── index.mjs         # Exports
└── setup/         # Test setup files
```

### 4. Coverage Configuration
- **Targets**: 80% lines, functions, statements; 75% branches
- **Reports**: text, json, html, lcov
- **Exclusions**: node_modules, test files, config files, snapshots
- **Clean**: Automatic cleanup on rerun

### 5. Test Execution
- **Deterministic**: No shuffling by default
- **Concurrent**: Enabled for parallel execution
- **Isolated**: Each test runs in isolation
- **Retry**: Disabled by default (manual opt-in)

## Usage Examples

### Using Test Utilities
```javascript
import { describe, it, expect } from 'vitest'
import {
  isDockerAvailable,
  generateTestId,
  retryWithBackoff
} from '../helpers/index.mjs'

describe('My Test Suite', () => {
  it('should test with utilities', async () => {
    if (!await isDockerAvailable()) {
      console.log('⏭️ Skipping - Docker not available')
      return
    }

    const testId = generateTestId('test')

    await retryWithBackoff(async () => {
      // Your test code
    }, 3, 1000)
  })
})
```

### Using Docker Utilities
```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  waitForContainer,
  cleanupContainersByLabel,
  getContainerLogs
} from '../helpers/docker-utils.mjs'

describe('Docker Tests', () => {
  let containerId

  afterAll(async () => {
    await cleanupContainersByLabel('test-label')
  })

  it('should work with containers', async () => {
    await waitForContainer(containerId, 30000)
    const logs = await getContainerLogs(containerId, 100)
    expect(logs).toBeTruthy()
  })
})
```

## Migration Guide

### Updating Existing Tests

**Before**:
```javascript
describe('Test', () => {
  it('test', async () => {
    // Manual Docker checks
    try {
      await exec('docker info')
    } catch {
      return
    }
  })
})
```

**After**:
```javascript
import { isDockerAvailable } from '../helpers/index.mjs'

describe('Test', () => {
  it('test', async () => {
    if (!await isDockerAvailable()) {
      console.log('⏭️ Skipping - Docker not available')
      return
    }
  })
})
```

## Performance Benefits

### Before Configuration
- Ad-hoc test execution
- Manual Docker checks
- Inconsistent timeouts
- No coverage thresholds
- Sequential execution

### After Configuration
- Optimized thread pool execution
- Standardized Docker utilities
- Appropriate timeouts (30s for Docker)
- 80%/75% coverage targets
- Concurrent test execution

### Expected Improvements
- **Faster test runs**: Thread pool + concurrency
- **Better reliability**: Proper timeouts + retry logic
- **Easier maintenance**: Shared utilities
- **Higher quality**: Coverage thresholds
- **Better DX**: Simplified scripts

## Next Steps

1. **Review existing tests** for utility opportunities
2. **Update tests** to use new helpers
3. **Run coverage** to identify gaps: `npm run test:coverage`
4. **Add setup files** if needed for global test configuration
5. **Enable watch mode** during development: `npm run test:watch`

## Troubleshooting

### Docker Tests Timing Out
- Increase timeout in specific tests: `{ timeout: 60000 }`
- Check Docker daemon: `await isDockerRunning()`
- Review container logs: `await getContainerLogs(containerId)`

### Coverage Below Threshold
- Run: `npm run test:coverage`
- Check HTML report: `open coverage/index.html`
- Add missing tests for uncovered branches

### Tests Failing Intermittently
- Use `retryWithBackoff` for flaky operations
- Increase timeouts for slow operations
- Check for race conditions in concurrent tests

## Configuration Maintenance

### Adjusting Thresholds
Edit `vitest.config.js`:
```javascript
coverage: {
  thresholds: {
    lines: 85,      // Increase gradually
    functions: 85,
    branches: 80,
    statements: 85
  }
}
```

### Adding Exclusions
```javascript
coverage: {
  exclude: [
    'experimental/**',  // Add patterns
    '**/generated/**'
  ]
}
```

### Changing Timeouts
```javascript
test: {
  testTimeout: 45000,  // Increase for slower operations
  hookTimeout: 15000
}
```

## References

- [Vitest Configuration](https://vitest.dev/config/)
- [Coverage Options](https://vitest.dev/guide/coverage.html)
- [Test API](https://vitest.dev/api/)
- [Mocking Guide](https://vitest.dev/guide/mocking.html)
