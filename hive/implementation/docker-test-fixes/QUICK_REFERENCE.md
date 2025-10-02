# Docker Test Fixes - Quick Reference

## 🚀 Quick Integration (3 Steps)

```bash
# 1. Replace core files
cp hive/implementation/docker-test-fixes/cleanroom-runner-improved.js src/core/runners/cleanroom-runner.js
cp hive/implementation/docker-test-fixes/shared-cleanroom-improved.mjs test/setup/shared-cleanroom.mjs

# 2. Add to vitest.config.js
echo "globalSetup: './hive/implementation/docker-test-fixes/vitest-docker-setup.mjs'"

# 3. Test
npm run test:cleanroom
```

## 📋 Test Pattern Template

```javascript
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { getSharedCleanroom, isCleanroomAvailable } from '../setup/shared-cleanroom.mjs'
import { runCitty } from '../../index.js'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

describe('My Tests', () => {
  let dockerAvailable = false

  beforeAll(async () => {
    dockerAvailable = await execAsync('docker info').then(() => true).catch(() => false)
    if (!dockerAvailable) return
    await execAsync('docker rm -f $(docker ps -aq --filter "label=ctu-test") 2>/dev/null || true')
    await getSharedCleanroom()
  }, 60000)

  afterEach(async () => {
    if (!dockerAvailable) return
    await execAsync('docker rm -f $(docker ps -aq --filter "label=ctu-test") 2>/dev/null || true')
  })

  afterAll(async () => {
    if (!dockerAvailable) return
    await execAsync('docker rm -f $(docker ps -aq --filter "label=ctu-test") 2>/dev/null || true')
  }, 30000)

  it('my test', async () => {
    if (!dockerAvailable || !isCleanroomAvailable()) {
      console.log('⏭️ Skipping test - Docker/cleanroom not available')
      return
    }

    const result = await runCitty(['--version'])
    expect(result.exitCode).toBe(0)
  })
})
```

## 🔧 Common Commands

### Docker Management
```bash
# Check Docker is running
docker info

# List test containers
docker ps -a --filter "label=ctu-test"

# Clean up test containers
docker rm -f $(docker ps -aq --filter "label=ctu-test")

# Start Docker Desktop (macOS)
open -a Docker
```

### Testing
```bash
# Run all tests (skips Docker tests if unavailable)
npm test

# Run only cleanroom tests
npm run test:cleanroom

# Run integration tests
npm run test:integration

# Watch mode
npm run test:watch
```

### Debugging
```bash
# Check for container leaks
docker ps -a --filter "label=ctu-test" | wc -l

# View container logs
docker logs <container-id>

# Inspect container
docker inspect <container-id>
```

## 🐛 Troubleshooting

### Tests Failing with Docker Not Available
```bash
# Start Docker
open -a Docker  # macOS
sudo systemctl start docker  # Linux

# Wait for Docker to start
docker info
```

### Containers Not Being Cleaned Up
```bash
# Manual cleanup
docker rm -f $(docker ps -aq --filter "label=ctu-test")

# Check cleanup hooks in test file
grep -A 3 "afterEach\|afterAll" test/path/to/test.mjs
```

### Tests Timing Out
```javascript
// Increase timeout in beforeAll/afterAll
beforeAll(async () => {
  // ...
}, 90000)  // Increase from 60000
```

## 📊 Key Improvements

| Issue | Before | After |
|-------|--------|-------|
| Docker unavailable | ❌ Tests fail | ✅ Tests skip gracefully |
| Container cleanup | ❌ Manual | ✅ Automatic |
| Transient errors | ❌ Test fails | ✅ Retry with backoff |
| Resource leaks | ❌ Containers accumulate | ✅ Clean after each test |
| Error messages | ❌ Cryptic | ✅ Clear and actionable |

## 🎯 Files Changed

### Core Implementation (Replace)
- `src/core/runners/cleanroom-runner.js`
- `test/setup/shared-cleanroom.mjs`

### Configuration (Add)
- `vitest.config.js` (add globalSetup)

### Test Files (Update)
- All files using `runCitty()` or cleanroom

## ✅ Validation Checklist

- [ ] Docker availability check in beforeAll
- [ ] Cleanup in afterEach
- [ ] Final cleanup in afterAll
- [ ] Skip logic in each test
- [ ] Timeouts set (60s setup, 30s teardown)
- [ ] Clear skip messages
- [ ] No try-catch in test logic (only Docker availability check)

## 🚦 Test Execution Flow

```
1. beforeAll
   ├─ Check Docker availability
   ├─ Clean up existing containers
   └─ Setup shared cleanroom

2. beforeEach (if needed)
   └─ Additional setup per test

3. it('test')
   ├─ Skip if Docker unavailable
   └─ Run test logic

4. afterEach
   └─ Clean up containers

5. afterAll
   └─ Final cleanup
```

## 📚 Documentation

| File | Purpose |
|------|---------|
| `README.md` | Comprehensive documentation |
| `INTEGRATION_GUIDE.md` | Step-by-step integration |
| `TESTING_SUMMARY.md` | Investigation and results |
| `QUICK_REFERENCE.md` | This file - quick commands |

## 🔗 Related Files

### Implementation
- `/Users/sac/citty-test-utils/hive/implementation/docker-test-fixes/cleanroom-runner-improved.js`
- `/Users/sac/citty-test-utils/hive/implementation/docker-test-fixes/shared-cleanroom-improved.mjs`
- `/Users/sac/citty-test-utils/hive/implementation/docker-test-fixes/vitest-docker-setup.mjs`

### Examples
- `/Users/sac/citty-test-utils/hive/implementation/docker-test-fixes/cleanroom-test-improved.test.mjs`

### Documentation
- `/Users/sac/citty-test-utils/hive/implementation/docker-test-fixes/README.md`
- `/Users/sac/citty-test-utils/hive/implementation/docker-test-fixes/INTEGRATION_GUIDE.md`
- `/Users/sac/citty-test-utils/hive/implementation/docker-test-fixes/TESTING_SUMMARY.md`

## 💡 Pro Tips

1. **Always check Docker availability** in beforeAll
2. **Use afterEach for cleanup** to prevent test interference
3. **Set appropriate timeouts** (60s for setup, 30s for teardown)
4. **Add skip logic to all tests** that use cleanroom
5. **Monitor container count** during development
6. **Use container labels** for easy cleanup

## 🎓 Learn More

- Review `README.md` for detailed explanations
- Check `INTEGRATION_GUIDE.md` for integration steps
- See `cleanroom-test-improved.test.mjs` for examples
- Read `TESTING_SUMMARY.md` for investigation results
