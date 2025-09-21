# Enterprise Code Migration Plan

## Overview

This plan outlines the process of moving all enterprise-related code to a separate branch (`enterprise`) while keeping the main branch (`main`) focused on core CLI testing functionality for the v1 launch.

## Current State Analysis

### Enterprise Files Identified

#### 1. **Root Level Enterprise Files**
```
README-ENTERPRISE.md
WIP-ENTERPRISE-TRANSITION.md
ENTERPRISE-TEST-RUNNER-EVALUATION.md
demo-enterprise.js
```

#### 2. **Source Enterprise Files**
```
src/enterprise-test-runner.js
src/core/discovery/                    # Entire directory
├── cli-analyzer.js
├── domain-config-manager.js
├── domain-discovery-orchestrator.js
├── domain-loader.js
├── domain-plugin-system.js
├── domain-templates.js
├── domain-validator.js
└── runtime-domain-registry.js
src/core/runners/enhanced-runner.js    # Has enterprise imports
src/core/utils/80-20-environment-detection.js
src/core/utils/enhanced-environment-detection.js
src/core/error-recovery/               # Entire directory
src/core/coverage/                     # Entire directory
```

#### 3. **Enterprise Test Files**
```
test/enterprise/                       # Entire directory
├── enterprise-comprehensive.test.mjs
└── enterprise-test-runner.test.mjs
test/enterprise-framework.test.mjs
test/enterprise-simple.test.mjs
test/domain-discovery/                 # Entire directory
└── domain-discovery-system.test.mjs
test/unit/enterprise-*.test.mjs       # All enterprise unit tests
test/unit/command-builder.test.mjs
test/unit/command-registry.test.mjs
test/integration/cleanroom-error-*.test.mjs  # Enterprise error handling
test/integration/coverage-analyzer.test.mjs
```

#### 4. **Enterprise Documentation**
```
docs/PROJECT-SUMMARY.md
docs/IMPLEMENTATION-PLAN.md
docs/NOUN-VERB-IMPLEMENTATION-PATTERNS.md
docs/TECHNICAL-SPECIFICATIONS.md
docs/MIGRATION-GUIDE.md
docs/CURRENT-IMPLEMENTATION-ANALYSIS.md
docs/EXISTING-IMPLEMENTATION-ANALYSIS.md
docs/EDGE-CASES-ANALYSIS.md
docs/CLEANROOM-ERROR-ANALYSIS.md
docs/CLEANROOM-ERROR-TESTS-SUMMARY.md
docs/TESTING-FRAMEWORK-IMPLEMENTATIONS.md
docs/ARCHITECTURE.md
docs/EXAMPLES-AND-USE-CASES.md
```

#### 5. **Enterprise Examples**
```
examples/                              # Entire directory
├── enterprise-examples.js
├── enterprise-examples.mjs
├── enterprise-test-runner-demo.mjs
├── enterprise-command-builder-demo.mjs
├── noun-verb-pattern-comparison.mjs
└── universal-cli-testing-examples.mjs
```

#### 6. **Empty Directories (Enterprise-related)**
```
src/core/adapters/                     # Empty
src/core/contract/                     # Empty
src/core/reporters/                     # Empty
```

## Migration Strategy

### Phase 1: Create Enterprise Branch

```bash
# 1. Create and switch to enterprise branch
git checkout -b enterprise

# 2. Ensure all enterprise files are committed
git add .
git commit -m "feat: preserve enterprise functionality in enterprise branch"

# 3. Push enterprise branch to remote
git push -u origin enterprise
```

### Phase 2: Clean Main Branch

```bash
# 1. Switch back to main branch
git checkout main

# 2. Remove enterprise files from main branch
```

#### Files to Remove from Main Branch

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

### Phase 3: Fix Import Issues

#### Files with Broken Enterprise Imports

1. **src/core/runners/legacy-compatibility.js**
   - Remove any enterprise-related imports
   - Ensure it only imports from working modules

2. **src/cli.mjs**
   - Remove any enterprise command imports
   - Keep only core commands: test, gen, runner, info, coverage

3. **package.json**
   - Remove enterprise-related scripts
   - Update description to focus on core functionality

#### Update package.json Scripts

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

### Phase 4: Update Documentation

#### Update README.md

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

## Installation

```bash
npm install citty-test-utils
```

## Quick Start

```javascript
import { runLocalCitty, setupCleanroom, runCitty, teardownCleanroom } from 'citty-test-utils'

// Local testing
const result = await runLocalCitty(['--help'], { 
  cwd: './playground',
  env: { TEST_CLI: 'true' }
})
result.expectSuccess().expectOutput('USAGE').expectNoStderr()

// Docker cleanroom testing
await setupCleanroom({ rootDir: './playground' })
const cleanResult = await runCitty(['--version'], {
  env: { TEST_CLI: 'true' }
})
cleanResult.expectSuccess().expectOutput(/\d+\.\d+\.\d+/)
await teardownCleanroom()
```

## CLI Commands

```bash
# Generate test files and templates
npx citty-test-utils gen project my-cli
npx citty-test-utils gen test my-feature
npx citty-test-utils gen scenario user-workflow

# Run tests and scenarios
npx citty-test-utils test run
npx citty-test-utils test scenario

# Get CLI information
npx citty-test-utils info version
npx citty-test-utils info features

# Execute custom commands
npx citty-test-utils runner execute "node --version"
```

## Enterprise Features

Enterprise features (domain discovery, command builder, enterprise test runner) are available in the `enterprise` branch. See [Enterprise Branch](https://github.com/seanchatmangpt/citty-test-utils/tree/enterprise) for advanced functionality.

## License

MIT License - see [LICENSE](LICENSE) file for details.
```

### Phase 5: Test Main Branch

```bash
# 1. Install dependencies
npm install

# 2. Run tests to ensure everything works
npm test

# 3. Run specific test suites
npm run test:unit
npm run test:integration
npm run test:bdd

# 4. Test CLI commands
npx citty-test-utils --help
npx citty-test-utils info version
npx citty-test-utils gen project test-project
```

### Phase 6: Update Git Configuration

#### Update .gitignore (if needed)

```gitignore
# Enterprise branch specific files
enterprise/
enterprise-*.md
```

#### Create Branch Protection Rules

1. **Main Branch Protection**
   - Require pull request reviews
   - Require status checks to pass
   - Require branches to be up to date
   - Restrict pushes to main branch

2. **Enterprise Branch**
   - Allow direct pushes for development
   - No protection rules (experimental branch)

## Verification Checklist

### Main Branch Verification

- [ ] All enterprise files removed
- [ ] No broken imports
- [ ] All tests pass
- [ ] CLI commands work
- [ ] Documentation updated
- [ ] Package.json cleaned up
- [ ] README.md updated

### Enterprise Branch Verification

- [ ] All enterprise files preserved
- [ ] Enterprise tests still exist
- [ ] Enterprise documentation available
- [ ] Enterprise examples working
- [ ] Branch pushed to remote

## Rollback Plan

If issues arise, rollback is simple:

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

## Benefits of This Approach

### For Main Branch (V1 Launch)
- ✅ Clean, focused codebase
- ✅ No broken imports
- ✅ Faster test execution
- ✅ Easier maintenance
- ✅ Clear user documentation
- ✅ Reduced complexity

### For Enterprise Branch
- ✅ Preserves all enterprise work
- ✅ Allows continued development
- ✅ Can be merged back later
- ✅ Experimental features safe
- ✅ No risk of losing code

## Timeline

- **Phase 1**: Create enterprise branch (30 minutes)
- **Phase 2**: Clean main branch (1 hour)
- **Phase 3**: Fix import issues (1 hour)
- **Phase 4**: Update documentation (1 hour)
- **Phase 5**: Test main branch (1 hour)
- **Phase 6**: Update git configuration (30 minutes)

**Total Time**: ~4.5 hours

## Success Criteria

1. **Main Branch**: Clean, working CLI testing framework
2. **Enterprise Branch**: All enterprise functionality preserved
3. **Tests**: All non-enterprise tests passing
4. **CLI**: All core commands working
5. **Documentation**: Updated and accurate
6. **No Regressions**: Core functionality unchanged

This migration will enable a clean v1.0.0 launch while preserving all enterprise work for future development.
