# CLI Entry File Examples

This document provides practical examples for using the `--entry-file` flag across different project structures and use cases.

## Table of Contents

- [Single CLI Projects](#single-cli-projects)
- [Monorepo Projects](#monorepo-projects)
- [Multiple CLI Projects](#multiple-cli-projects)
- [CI/CD Integration](#cicd-integration)
- [Testing Workflows](#testing-workflows)

## Single CLI Projects

### Standard Project Structure

```
my-cli/
├── src/
│   └── cli.mjs          # Main CLI entry
├── test/
│   └── cli.test.mjs
└── package.json
```

**Testing:**

```bash
# Auto-detection works (finds src/cli.mjs)
ctu analyze

# Explicit entry file
ctu analyze --entry-file ./src/cli.mjs

# With coverage threshold
ctu coverage --entry-file ./src/cli.mjs --threshold 80
```

### Non-Standard CLI Location

```
my-app/
├── tools/
│   └── custom-cli.js    # CLI in non-standard location
├── test/
│   └── cli.test.js
└── package.json
```

**Testing:**

```bash
# Auto-detection may fail - use --entry-file
ctu analyze --entry-file ./tools/custom-cli.js

# Add to package.json scripts
{
  "scripts": {
    "test:cli": "ctu analyze --entry-file ./tools/custom-cli.js"
  }
}
```

## Monorepo Projects

### Lerna/Nx Monorepo

```
monorepo/
├── packages/
│   ├── cli/
│   │   ├── src/
│   │   │   └── index.mjs       # Main CLI
│   │   ├── test/
│   │   └── package.json
│   ├── admin-cli/
│   │   ├── src/
│   │   │   └── cli.js          # Admin CLI
│   │   ├── test/
│   │   └── package.json
│   └── utils/
│       └── ...
└── package.json
```

**Testing Each CLI:**

```bash
# Test main CLI
cd packages/cli
ctu analyze --entry-file ./src/index.mjs

# Test admin CLI
cd packages/admin-cli
ctu analyze --entry-file ./src/cli.js

# Or from root with specific paths
ctu analyze --entry-file ./packages/cli/src/index.mjs
ctu analyze --entry-file ./packages/admin-cli/src/cli.js
```

**Monorepo Script:**

```json
{
  "scripts": {
    "test:all-clis": "npm run test:main-cli && npm run test:admin-cli",
    "test:main-cli": "ctu analyze --entry-file ./packages/cli/src/index.mjs",
    "test:admin-cli": "ctu analyze --entry-file ./packages/admin-cli/src/cli.js"
  }
}
```

### Turborepo Monorepo

```
turborepo/
├── apps/
│   ├── cli-app/
│   │   └── src/
│   │       └── main.mjs
│   └── api-cli/
│       └── src/
│           └── cli.ts
└── packages/
    └── shared/
```

**Testing:**

```bash
# Test CLI app
ctu analyze --entry-file ./apps/cli-app/src/main.mjs

# Test API CLI (TypeScript)
ctu analyze --entry-file ./apps/api-cli/src/cli.ts

# With test directory
ctu analyze \
  --entry-file ./apps/cli-app/src/main.mjs \
  --test-dir ./apps/cli-app/tests
```

## Multiple CLI Projects

### Project with Multiple CLIs

```
multi-cli/
├── src/
│   ├── cli.mjs          # Production CLI
│   ├── dev-cli.mjs      # Development CLI
│   └── debug-cli.mjs    # Debug CLI
├── test/
│   ├── cli.test.mjs
│   ├── dev-cli.test.mjs
│   └── debug-cli.test.mjs
└── package.json
```

**Testing Each CLI:**

```bash
# Test production CLI
ctu analyze --entry-file ./src/cli.mjs

# Test development CLI
ctu analyze --entry-file ./src/dev-cli.mjs

# Test debug CLI
ctu analyze --entry-file ./src/debug-cli.mjs

# Get stats for all
ctu stats --entry-file ./src/cli.mjs
ctu stats --entry-file ./src/dev-cli.mjs
ctu stats --entry-file ./src/debug-cli.mjs
```

**Script for All CLIs:**

```bash
#!/bin/bash
# test-all-clis.sh

echo "Testing Production CLI..."
ctu coverage --entry-file ./src/cli.mjs --threshold 80 --output prod-coverage.json

echo "Testing Development CLI..."
ctu coverage --entry-file ./src/dev-cli.mjs --threshold 70 --output dev-coverage.json

echo "Testing Debug CLI..."
ctu coverage --entry-file ./src/debug-cli.mjs --threshold 60 --output debug-coverage.json

echo "All CLIs tested successfully!"
```

### Environment-Specific CLIs

```
env-clis/
├── src/
│   ├── prod/
│   │   └── cli.mjs
│   ├── staging/
│   │   └── cli.mjs
│   └── dev/
│       └── cli.mjs
└── test/
```

**Testing:**

```bash
# Test production CLI
ctu analyze --entry-file ./src/prod/cli.mjs --format json --output prod-report.json

# Test staging CLI
ctu analyze --entry-file ./src/staging/cli.mjs --format json --output staging-report.json

# Test development CLI
ctu analyze --entry-file ./src/dev/cli.mjs --verbose
```

## CI/CD Integration

### GitHub Actions

```yaml
name: CLI Test Coverage

on: [push, pull_request]

jobs:
  test-cli-coverage:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Dependencies
        run: npm ci

      - name: Test Main CLI
        run: |
          ctu coverage \
            --entry-file ./src/cli.mjs \
            --threshold 80 \
            --format json \
            --output coverage-main.json

      - name: Test Admin CLI
        run: |
          ctu coverage \
            --entry-file ./admin/cli.js \
            --threshold 70 \
            --format json \
            --output coverage-admin.json

      - name: Upload Coverage Reports
        uses: actions/upload-artifact@v3
        with:
          name: coverage-reports
          path: coverage-*.json
```

### GitLab CI

```yaml
test_cli_coverage:
  stage: test
  script:
    - npm ci
    - ctu coverage --entry-file ./src/cli.mjs --threshold 80
    - ctu coverage --entry-file ./tools/cli.js --threshold 70
  artifacts:
    paths:
      - coverage-*.json
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any

    stages {
        stage('Test CLIs') {
            parallel {
                stage('Main CLI') {
                    steps {
                        sh '''
                            ctu coverage \
                              --entry-file ./src/cli.mjs \
                              --threshold 80 \
                              --output coverage-main.json
                        '''
                    }
                }
                stage('Admin CLI') {
                    steps {
                        sh '''
                            ctu coverage \
                              --entry-file ./admin/cli.js \
                              --threshold 70 \
                              --output coverage-admin.json
                        '''
                    }
                }
            }
        }
    }
}
```

## Testing Workflows

### Development Workflow

```bash
# 1. Discover CLI structure
ctu discover --entry-file ./src/cli.mjs --format json --output cli-structure.json

# 2. Get test recommendations
ctu recommend --entry-file ./src/cli.mjs --priority high --output recommendations.md

# 3. Run coverage analysis
ctu coverage --entry-file ./src/cli.mjs --verbose

# 4. Generate detailed stats
ctu stats --entry-file ./src/cli.mjs
```

### Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running CLI coverage checks..."

# Test main CLI
if ! ctu coverage --entry-file ./src/cli.mjs --threshold 75; then
    echo "❌ Main CLI coverage below threshold"
    exit 1
fi

# Test admin CLI
if ! ctu coverage --entry-file ./admin/cli.js --threshold 60; then
    echo "❌ Admin CLI coverage below threshold"
    exit 1
fi

echo "✅ All CLI coverage checks passed"
exit 0
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:cli",

    "test:cli": "npm run test:cli:main && npm run test:cli:admin",

    "test:cli:main": "ctu analyze --entry-file ./src/cli.mjs",
    "test:cli:main:coverage": "ctu coverage --entry-file ./src/cli.mjs --threshold 80",
    "test:cli:main:stats": "ctu stats --entry-file ./src/cli.mjs --verbose",

    "test:cli:admin": "ctu analyze --entry-file ./admin/cli.js",
    "test:cli:admin:coverage": "ctu coverage --entry-file ./admin/cli.js --threshold 70",

    "test:cli:all": "bash ./scripts/test-all-clis.sh",

    "coverage:report": "ctu coverage --entry-file ./src/cli.mjs --format html --output coverage.html",

    "cli:discover": "ctu discover --entry-file ./src/cli.mjs --format json",
    "cli:recommend": "ctu recommend --entry-file ./src/cli.mjs --priority high"
  }
}
```

## Advanced Examples

### Testing Built vs Source

```bash
# Test source code
ctu analyze --entry-file ./src/cli.mjs --verbose

# Build the project
npm run build

# Test built code
ctu analyze --entry-file ./dist/cli.js --verbose

# Compare coverage
diff \
  <(ctu coverage --entry-file ./src/cli.mjs --format json) \
  <(ctu coverage --entry-file ./dist/cli.js --format json)
```

### Testing with Different Test Directories

```bash
# Unit tests
ctu analyze \
  --entry-file ./src/cli.mjs \
  --test-dir ./test/unit

# Integration tests
ctu analyze \
  --entry-file ./src/cli.mjs \
  --test-dir ./test/integration

# E2E tests
ctu analyze \
  --entry-file ./src/cli.mjs \
  --test-dir ./test/e2e

# All tests
ctu analyze \
  --entry-file ./src/cli.mjs \
  --test-dir ./test
```

### Conditional Testing

```bash
#!/bin/bash

# Get CLI path from environment or use default
CLI_PATH=${CLI_ENTRY_FILE:-"./src/cli.mjs"}

echo "Testing CLI: $CLI_PATH"

ctu analyze --entry-file "$CLI_PATH" --verbose

# Or test multiple if available
if [ -f "./src/cli.mjs" ]; then
    echo "Testing main CLI..."
    ctu analyze --entry-file ./src/cli.mjs
fi

if [ -f "./admin/cli.js" ]; then
    echo "Testing admin CLI..."
    ctu analyze --entry-file ./admin/cli.js
fi
```

## Conclusion

The `--entry-file` flag provides maximum flexibility for testing CLIs in any project structure. Use explicit paths for clarity and reliability, especially in CI/CD pipelines and monorepos.
