# Docker Test Fixes - Implementation Checklist

## Pre-Implementation

- [ ] Review current test failures
- [ ] Backup current implementation files
- [ ] Check Docker installation on development machine
- [ ] Review CI/CD configuration for Docker support

## Core File Updates

### cleanroom-runner.js
- [ ] Replace with `cleanroom-runner-improved.js`
- [ ] Verify import paths are correct
- [ ] Check Docker availability function works
- [ ] Test retry logic with transient errors
- [ ] Validate container labeling works

### shared-cleanroom.mjs
- [ ] Replace with `shared-cleanroom-improved.mjs`
- [ ] Verify Docker availability check
- [ ] Test skip logic when Docker unavailable
- [ ] Validate shared instance management

### vitest.config.js
- [ ] Add globalSetup configuration
- [ ] Set appropriate test timeout (30s+)
- [ ] Configure test concurrency
- [ ] Enable verbose reporter

## Test File Updates

### For Each Cleanroom Test File

- [ ] Add Docker availability check in beforeAll
- [ ] Add container cleanup in afterEach
- [ ] Add final cleanup in afterAll
- [ ] Add skip logic in each test
- [ ] Update timeouts (60s setup, 30s teardown)
- [ ] Remove try-catch from test logic
- [ ] Add clear skip messages

### Test Files to Update

- [ ] test/integration/cleanroom-consolidated.test.mjs
- [ ] test/readme/cleanroom-complete.test.mjs
- [ ] test/integration/analysis-cleanroom.test.mjs
- [ ] test/integration/cleanroom-simple-validation.test.mjs
- [ ] Other cleanroom test files

## Validation

### Unit Testing
- [ ] Run tests with Docker running
- [ ] Run tests with Docker stopped
- [ ] Verify skip messages are clear
- [ ] Check container cleanup with `docker ps -a`

### Integration Testing
- [ ] Run full test suite
- [ ] Check for resource leaks
- [ ] Verify concurrent tests don't interfere
- [ ] Test retry logic with network delays

### Performance Testing
- [ ] Measure test execution time
- [ ] Check container startup overhead
- [ ] Validate cleanup performance
- [ ] Monitor memory usage

## CI/CD Updates

### GitHub Actions (if applicable)
- [ ] Add Docker availability check
- [ ] Configure skip behavior for missing Docker
- [ ] Update workflow timeouts
- [ ] Add cleanup step

### GitLab CI (if applicable)
- [ ] Add Docker service
- [ ] Configure cleanup
- [ ] Update timeout settings

## Documentation

- [ ] Update README with Docker requirements
- [ ] Document skip behavior
- [ ] Add troubleshooting section
- [ ] Create Docker setup guide
- [ ] Update contribution guidelines

## Rollback Plan

- [ ] Create backup directory
- [ ] Copy original files to backup
- [ ] Document rollback commands
- [ ] Test rollback procedure

## Post-Implementation

### Immediate Validation
- [ ] Run `npm test` with Docker running
- [ ] Run `npm test` with Docker stopped
- [ ] Check for container leaks
- [ ] Review test output for warnings

### Long-term Monitoring
- [ ] Monitor test execution time
- [ ] Track skip rate
- [ ] Monitor resource usage
- [ ] Collect feedback from team

## Specific Commands to Run

### Before Implementation
```bash
# Backup original files
mkdir -p hive/backups/docker-fixes-backup
cp src/core/runners/cleanroom-runner.js hive/backups/docker-fixes-backup/
cp test/setup/shared-cleanroom.mjs hive/backups/docker-fixes-backup/

# Check Docker status
docker info
```

### During Implementation
```bash
# Replace core files
cp hive/implementation/docker-test-fixes/cleanroom-runner-improved.js src/core/runners/cleanroom-runner.js
cp hive/implementation/docker-test-fixes/shared-cleanroom-improved.mjs test/setup/shared-cleanroom.mjs

# Update vitest.config.js (manual edit)
# Add: globalSetup: './hive/implementation/docker-test-fixes/vitest-docker-setup.mjs'
```

### After Implementation
```bash
# Test with Docker running
docker info && npm test

# Test with Docker stopped
# (Stop Docker Desktop first)
npm test

# Check for container leaks
docker ps -a --filter "label=ctu-test"

# Clean up if needed
docker rm -f $(docker ps -aq --filter "label=ctu-test")
```

## Success Criteria

- [ ] All tests pass when Docker is running
- [ ] All tests skip gracefully when Docker is stopped
- [ ] No container leaks after test runs
- [ ] Clear skip messages in test output
- [ ] No timeout errors
- [ ] Retry logic works for transient errors
- [ ] Cleanup hooks execute successfully
- [ ] CI/CD pipeline passes (if applicable)

## Common Issues & Solutions

### Issue: Tests still failing without Docker
**Solution:** Check skip logic in each test file

### Issue: Containers not being cleaned up
**Solution:** Verify afterEach and afterAll hooks

### Issue: Timeout errors
**Solution:** Increase timeouts in lifecycle hooks

### Issue: Import path errors
**Solution:** Verify relative paths to shared-cleanroom.mjs

### Issue: Retry logic not working
**Solution:** Check retryWithBackoff implementation

## Notes

- All changes should be tested locally before committing
- Review diff of each file before replacing
- Keep backups until integration is validated
- Document any custom modifications
- Share learnings with team

## Timeline

- **Day 1:** Review and backup
- **Day 2:** Replace core files and test
- **Day 3:** Update test files
- **Day 4:** Validation and documentation
- **Day 5:** Team review and deployment

## Team Communication

- [ ] Notify team of upcoming changes
- [ ] Share integration guide
- [ ] Schedule review meeting
- [ ] Document lessons learned
- [ ] Update team wiki/docs

## Completion

Date: _____________
Completed by: _____________
Reviewed by: _____________
Issues found: _____________

---

**Remember:** Test thoroughly before committing changes!
