# V1 Launch Critical Fixes - Action Plan

## 🎯 **IMMEDIATE ACTION ITEMS**

Based on the dark matter analysis, here are the critical fixes needed for v1 launch:

## 🚨 **BLOCKER 1: Fix Playground CLI**

**Problem**: All playground tests failing - demo doesn't work
**Impact**: Users can't see the tool in action
**Files to Fix**:
- `playground/src/cli.mjs` - Main CLI implementation
- `playground/test/integration/playground.test.mjs` - Integration tests
- `playground/test/integration/scenarios.test.mjs` - Scenario tests
- `playground/test/unit/cli.test.mjs` - Unit tests

**Specific Issues**:
1. `greet` command always returns "Hello, World!" instead of using arguments
2. `math` commands not working (add, multiply)
3. `error` commands not failing (should exit with non-zero code)
4. JSON output not working
5. Version should be "1.0.0" not "0.4.0"

**Fix Strategy**:
```javascript
// Current broken behavior
playground greet Alice  // Returns "Hello, World!"

// Should be
playground greet Alice  // Returns "Hello, Alice!"
playground math add 5 3  // Returns "5 + 3 = 8"
playground error generic  // Exits with code 1
```

## 🚨 **BLOCKER 2: Fix Test Expectations**

**Problem**: Tests expect different CLI behavior than actual implementation
**Impact**: All integration tests failing
**Files to Fix**:
- `test/readme/end-to-end.test.mjs`
- `test/readme/examples.test.mjs`
- `test/integration/noun-verb-cli-snapshots.test.mjs`

**Specific Issues**:
1. Tests expect "playground" in output, but CLI outputs "Test CLI for citty-test-utils"
2. Tests expect "Usage:" but CLI outputs "USAGE"
3. Tests expect specific command behavior that doesn't match actual implementation

**Fix Strategy**:
```javascript
// Current failing expectations
result.expectOutput(/playground/)  // Fails
result.expectOutput(/Usage:/)     // Fails

// Should be
result.expectOutput(/Test CLI for citty-test-utils/)  // Passes
result.expectOutput(/USAGE/)                          // Passes
```

## 🚨 **BLOCKER 3: Fix Snapshot Tests**

**Problem**: 22 failed snapshots, 9 obsolete
**Impact**: Snapshot testing not reliable
**Files to Fix**:
- `__snapshots__/` directory
- `test/integration/noun-verb-cli-snapshots.test.mjs`

**Fix Strategy**:
```bash
# Update all snapshots to match current output
npm run test:coverage -- -u
```

## 🚨 **BLOCKER 4: Fix Cross-Environment Consistency**

**Problem**: Local and cleanroom results don't match
**Impact**: Cross-environment testing unreliable
**Files to Fix**:
- `test/readme/end-to-end.test.mjs`
- `test/readme/cleanroom-complete.test.mjs`

**Specific Issues**:
1. `result.result` is undefined in some cases
2. Local runner handles unknown commands gracefully (exit code 0)
3. Cleanroom runner treats unknown commands as errors (exit code 1)

**Fix Strategy**:
```javascript
// Ensure consistent behavior
const localResult = await runLocalCitty(['unknown-command'])
const cleanroomResult = await runCitty(['unknown-command'])

// Both should have same behavior
expect(localResult.exitCode).toBe(cleanroomResult.exitCode)
```

## 🔧 **HIGH PRIORITY FIXES**

### **Fix Error Handling**
**Problem**: Commands not failing when expected
**Files to Fix**:
- `playground/src/cli.mjs` - Error commands
- `test/readme/essential-crash-tests.test.mjs`

**Fix Strategy**:
```javascript
// Error commands should actually fail
playground error generic  // Should exit with code 1
playground error validation  // Should exit with code 1
```

### **Fix Test CLI Integration**
**Problem**: Test CLI not working as expected
**Files to Fix**:
- `test-cli.mjs`
- `playground/test-cli.mjs`

**Fix Strategy**:
```javascript
// Test CLI should work consistently
const result = await runLocalCitty(['--help'], { env: { TEST_CLI: 'true' } })
result.expectSuccess().expectOutput(/USAGE/)
```

## 📋 **IMPLEMENTATION ORDER**

### **Week 1: Critical Fixes**
1. **Day 1-2**: Fix playground CLI implementation
2. **Day 3-4**: Fix test expectations and align with actual behavior
3. **Day 5**: Fix snapshot tests and update snapshots

### **Week 2: Integration Fixes**
1. **Day 1-2**: Fix cross-environment consistency
2. **Day 3-4**: Fix error handling and edge cases
3. **Day 5**: Final testing and validation

### **Week 3: Launch Preparation**
1. **Day 1-2**: Documentation updates
2. **Day 3-4**: Final testing and user validation
3. **Day 5**: Release preparation

## 🎯 **SUCCESS CRITERIA**

### **Must Pass Tests**
- [ ] All playground tests pass
- [ ] All end-to-end tests pass
- [ ] All snapshot tests pass
- [ ] Cross-environment tests pass
- [ ] Error handling tests pass

### **Must Work Features**
- [ ] Playground demo works end-to-end
- [ ] Core CLI testing works
- [ ] Docker cleanroom works
- [ ] Fluent assertions work
- [ ] Template generation works

### **Must Have Documentation**
- [ ] README examples work
- [ ] Quick start guide works
- [ ] API documentation accurate
- [ ] Troubleshooting guide complete

## 🚀 **LAUNCH READINESS CHECKLIST**

### **Technical Readiness**
- [ ] Test pass rate >90%
- [ ] Playground demo working
- [ ] Core features reliable
- [ ] Error handling working
- [ ] Cross-environment consistency

### **User Experience Readiness**
- [ ] Smooth onboarding
- [ ] Clear documentation
- [ ] Working examples
- [ ] Helpful error messages
- [ ] Quick start success

### **Release Readiness**
- [ ] Version bumped to 1.0.0
- [ ] Changelog updated
- [ ] Documentation reviewed
- [ ] User testing completed
- [ ] Launch announcement ready

## 💡 **KEY SUCCESS FACTORS**

1. **Focus on Core Value**: Don't get distracted by enterprise features
2. **Fix the Demo**: Playground CLI must work perfectly
3. **Align Tests**: Tests must match actual behavior
4. **User Experience**: Smooth onboarding is critical
5. **Reliability**: Core features must work consistently

## 🎯 **NEXT STEPS**

1. **Start with Playground CLI**: Fix the demo first
2. **Align Test Expectations**: Make tests match reality
3. **Update Snapshots**: Fix snapshot mismatches
4. **Test End-to-End**: Ensure everything works together
5. **Prepare for Launch**: Documentation and release prep

**Timeline**: 3 weeks to v1 launch
**Success Probability**: High with focused effort
**Key Risk**: Getting distracted by non-critical features
