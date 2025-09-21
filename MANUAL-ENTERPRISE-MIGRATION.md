# Manual Enterprise Branch Migration Guide

## Quick Start

If you prefer to run the automated script:
```bash
./migrate-enterprise-branch.sh
```

## Manual Step-by-Step Process

### Step 1: Create Enterprise Branch

```bash
# Check current status
git status

# Create and switch to enterprise branch
git checkout -b enterprise

# Commit current state
git add .
git commit -m "feat: preserve enterprise functionality in enterprise branch"

# Push to remote
git push -u origin enterprise
```

### Step 2: Switch to Main Branch

```bash
git checkout main
```

### Step 3: Remove Enterprise Files

```bash
# Root level enterprise files
rm README-ENTERPRISE.md
rm WIP-ENTERPRISE-TRANSITION.md
rm ENTERPRISE-TEST-RUNNER-EVALUATION.md
rm demo-enterprise.js

# Enterprise source files
rm src/enterprise-test-runner.js
rm -rf src/core/discovery/
rm src/core/runners/enhanced-runner.js
rm src/core/utils/80-20-environment-detection.js
rm src/core/utils/enhanced-environment-detection.js
rm -rf src/core/error-recovery/
rm -rf src/core/coverage/

# Empty directories
rm -rf src/core/adapters/
rm -rf src/core/contract/
rm -rf src/core/reporters/

# Enterprise test files
rm -rf test/enterprise/
rm test/enterprise-framework.test.mjs
rm test/enterprise-simple.test.mjs
rm -rf test/domain-discovery/
rm test/unit/enterprise-*.test.mjs
rm test/unit/command-builder.test.mjs
rm test/unit/command-registry.test.mjs
rm test/integration/cleanroom-error-*.test.mjs
rm test/integration/coverage-analyzer.test.mjs

# Enterprise documentation
rm docs/PROJECT-SUMMARY.md
rm docs/IMPLEMENTATION-PLAN.md
rm docs/NOUN-VERB-IMPLEMENTATION-PATTERNS.md
rm docs/TECHNICAL-SPECIFICATIONS.md
rm docs/MIGRATION-GUIDE.md
rm docs/CURRENT-IMPLEMENTATION-ANALYSIS.md
rm docs/EXISTING-IMPLEMENTATION-ANALYSIS.md
rm docs/EDGE-CASES-ANALYSIS.md
rm docs/CLEANROOM-ERROR-ANALYSIS.md
rm docs/CLEANROOM-ERROR-TESTS-SUMMARY.md
rm docs/TESTING-FRAMEWORK-IMPLEMENTATIONS.md
rm docs/ARCHITECTURE.md
rm docs/EXAMPLES-AND-USE-CASES.md

# Enterprise examples
rm -rf examples/

# Legacy files
rm src/cli-old.mjs
rm test/working-test-suite.test.mjs
rm test/final-verification.mjs
rm test/run-tests.mjs
```

### Step 4: Update package.json

Edit `package.json` and remove enterprise-related scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:fast": "vitest run --reporter=basic --no-coverage",
    "test:unit": "vitest run test/unit",
    "test:integration": "vitest run test/integration",
    "test:citty-integration": "vitest run test/integration/citty-integration.test.mjs",
    "test:bdd": "vitest run test/bdd",
    "test:readme": "vitest run test/readme",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui"
  }
}
```

### Step 5: Fix Import Issues

Check these files for broken imports and fix them:

1. **src/core/runners/legacy-compatibility.js**
   - Remove any enterprise imports
   - Ensure it only imports from working modules

2. **src/cli.mjs**
   - Remove any enterprise command imports
   - Keep only core commands: test, gen, runner, info, coverage

### Step 6: Test the Changes

```bash
# Install dependencies
npm install

# Run tests
npm test

# Test CLI commands
npx citty-test-utils --help
npx citty-test-utils info version
npx citty-test-utils gen project test-project
```

### Step 7: Commit Changes

```bash
git add .
git commit -m "feat: remove enterprise code for v1 launch

- Move enterprise functionality to enterprise branch
- Remove domain discovery system
- Remove enterprise test runner
- Remove enterprise documentation
- Remove enterprise examples
- Clean up package.json scripts
- Focus on core CLI testing functionality

Enterprise features available in enterprise branch:
https://github.com/seanchatmangpt/citty-test-utils/tree/enterprise"

git push origin main
```

### Step 8: Update README.md

Update the main README.md to reflect the new structure:

```markdown
# citty-test-utils

A comprehensive testing framework for CLI applications built with Citty, featuring Docker cleanroom support, fluent assertions, and scenario DSL.

## Features

- **🏃 Local Runner**: Execute CLI commands locally with timeout and environment support
- **🐳 Docker Cleanroom**: Isolated testing in Docker containers using testcontainers
- **🔗 Fluent Assertions**: Chainable expectation API with detailed error messages
- **📋 Scenario DSL**: Complex multi-step test workflows with retry mechanisms
- **🛠️ Test Utilities**: Wait conditions, retry logic, temporary files, and more
- **📦 Pre-built Scenarios**: Ready-to-use test templates for common workflows
- **🎯 Scenarios Pack**: Common CLI testing patterns with simple API
- **⚡ TypeScript Support**: Complete type definitions for all APIs
- **🔄 Cross-Environment**: Test consistency between local and cleanroom environments
- **🎮 Playground Project**: Complete example implementation with comprehensive tests
- **📸 Snapshot Testing**: Comprehensive snapshot coverage for all CLI outputs

## Enterprise Features

Enterprise features (domain discovery, command builder, enterprise test runner) are available in the `enterprise` branch. See [Enterprise Branch](https://github.com/seanchatmangpt/citty-test-utils/tree/enterprise) for advanced functionality.
```

## Verification Checklist

After migration, verify:

- [ ] Enterprise branch exists with all enterprise files
- [ ] Main branch has no enterprise files
- [ ] All tests pass (except expected enterprise test failures)
- [ ] CLI commands work
- [ ] Documentation is updated
- [ ] Package.json is cleaned up
- [ ] No broken imports

## Rollback Plan

If you need to rollback:

```bash
# Switch to enterprise branch
git checkout enterprise

# Copy enterprise files back to main
git checkout enterprise -- src/core/discovery/
git checkout enterprise -- test/enterprise/
git checkout enterprise -- examples/
# ... etc for other enterprise files

# Commit the rollback
git add .
git commit -m "rollback: restore enterprise functionality"
```

## Benefits

### Main Branch (V1 Launch)
- ✅ Clean, focused codebase
- ✅ No broken imports
- ✅ Faster test execution
- ✅ Easier maintenance
- ✅ Clear user documentation
- ✅ Reduced complexity

### Enterprise Branch
- ✅ Preserves all enterprise work
- ✅ Allows continued development
- ✅ Can be merged back later
- ✅ Experimental features safe
- ✅ No risk of losing code

## Timeline

- **Automated Script**: ~30 minutes
- **Manual Process**: ~2-3 hours
- **Testing & Verification**: ~1 hour

**Total Time**: 1.5-4 hours depending on approach
