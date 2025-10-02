# Pre-Publish Validation Checklist

**Purpose**: Ensure package is production-ready before publishing to npm

## Critical Validation Gates

### ✅ Gate 1: README Example Validation

**Command**: `cd playground && npm test -- test/readme-validation`

**Requirements**:
- [ ] All 6+ README validation tests pass
- [ ] Quick Start examples work
- [ ] Scenario DSL examples work
- [ ] Local Runner examples work
- [ ] CLI Command examples work
- [ ] Complete Example works
- [ ] Pass rate: 100% (no failures allowed)

**If Failed**: Fix examples or update README before proceeding

---

### ✅ Gate 2: Export Integrity

**Command**: `npm test -- test/readme-validation/07-export-validation.test.mjs`

**Requirements**:
- [ ] All documented exports exist
- [ ] Function signatures match documentation
- [ ] No missing exports
- [ ] No broken imports

**If Failed**: Fix missing exports or update documentation

---

### ✅ Gate 3: API Contract Validation

**Command**: `npm test -- test/readme-validation/08-api-contracts.test.mjs`

**Requirements**:
- [ ] All API signatures validated
- [ ] Zod schemas match documentation
- [ ] Required fields enforced
- [ ] Optional fields work correctly

**If Failed**: Fix API implementation or update contracts

---

### ✅ Gate 4: Schema Validation

**Command**: `npm test -- test/unit/zod-schema-validation.test.mjs`

**Requirements**:
- [ ] All Zod schemas parse correctly
- [ ] Error messages are clear
- [ ] Defaults are applied
- [ ] Type checking works

**If Failed**: Fix schema definitions or validation code

---

### ✅ Gate 5: Unit Tests

**Command**: `npm run test:unit`

**Requirements**:
- [ ] All unit tests pass
- [ ] Coverage > 80%
- [ ] No flaky tests
- [ ] Fast execution (< 10s)

**If Failed**: Fix broken tests or code

---

### ✅ Gate 6: Integration Tests

**Command**: `npm run test:integration`

**Requirements**:
- [ ] All integration tests pass
- [ ] Cleanroom tests work
- [ ] Error handling works
- [ ] CLI integration works

**If Failed**: Fix integration issues

---

### ✅ Gate 7: Dependency Check

**Commands**:
```bash
npm ls zod
npm outdated
npm audit
```

**Requirements**:
- [ ] Zod version compatible (v4.x)
- [ ] No critical vulnerabilities
- [ ] Dependencies up-to-date
- [ ] No deprecated packages

**If Failed**: Update or fix dependencies

---

### ✅ Gate 8: Build & Package

**Commands**:
```bash
npm pack
tar -tzf citty-test-utils-*.tgz
```

**Requirements**:
- [ ] Package builds successfully
- [ ] Only required files included
- [ ] No test files in package
- [ ] No playground in package
- [ ] package.json correct

**If Failed**: Fix .npmignore or package.json

---

### ✅ Gate 9: Installation Test

**Commands**:
```bash
# Test fresh install
rm -rf /tmp/test-install
mkdir /tmp/test-install
cd /tmp/test-install
npm init -y
npm install ../citty-test-utils-*.tgz
node -e "const pkg = require('citty-test-utils'); console.log(pkg.runLocalCitty)"
```

**Requirements**:
- [ ] Package installs without errors
- [ ] All exports available
- [ ] No missing dependencies
- [ ] Works in fresh environment

**If Failed**: Fix package dependencies or exports

---

### ✅ Gate 10: Documentation Review

**Files to Review**:
- [ ] README.md - All examples updated
- [ ] CHANGELOG.md - Version documented
- [ ] package.json - Version bumped
- [ ] API docs - Match implementation

**If Failed**: Update documentation

---

## Automated Pre-Publish Script

**File**: `scripts/pre-publish-validation.sh`

```bash
#!/bin/bash
set -e

echo "🔍 Pre-Publish Validation Starting..."
echo ""

# Gate 1: README Examples
echo "📋 Gate 1/10: README Example Validation..."
cd playground
npm test -- test/readme-validation || {
  echo "❌ FAILED: README examples don't work"
  exit 1
}
cd ..
echo "✅ Gate 1: PASSED"
echo ""

# Gate 2: Export Integrity
echo "📦 Gate 2/10: Export Integrity..."
npm test -- playground/test/readme-validation/07-export-validation.test.mjs || {
  echo "❌ FAILED: Export validation failed"
  exit 1
}
echo "✅ Gate 2: PASSED"
echo ""

# Gate 3: API Contracts
echo "📝 Gate 3/10: API Contract Validation..."
npm test -- playground/test/readme-validation/08-api-contracts.test.mjs || {
  echo "❌ FAILED: API contracts don't match"
  exit 1
}
echo "✅ Gate 3: PASSED"
echo ""

# Gate 4: Schema Validation
echo "🔍 Gate 4/10: Schema Validation..."
npm test -- test/unit/zod-schema-validation.test.mjs || {
  echo "❌ FAILED: Schema validation failed"
  exit 1
}
echo "✅ Gate 4: PASSED"
echo ""

# Gate 5: Unit Tests
echo "🧪 Gate 5/10: Unit Tests..."
npm run test:unit || {
  echo "❌ FAILED: Unit tests failed"
  exit 1
}
echo "✅ Gate 5: PASSED"
echo ""

# Gate 6: Integration Tests
echo "🔗 Gate 6/10: Integration Tests..."
npm run test:integration || {
  echo "❌ FAILED: Integration tests failed"
  exit 1
}
echo "✅ Gate 6: PASSED"
echo ""

# Gate 7: Dependency Check
echo "📦 Gate 7/10: Dependency Check..."
npm audit --audit-level=high || {
  echo "⚠️  WARNING: Security vulnerabilities found"
  echo "Review and fix before publishing"
}
echo "✅ Gate 7: PASSED"
echo ""

# Gate 8: Build & Package
echo "📦 Gate 8/10: Build & Package..."
npm pack
tar -tzf citty-test-utils-*.tgz | grep "test/" && {
  echo "❌ FAILED: Test files included in package"
  exit 1
}
echo "✅ Gate 8: PASSED"
echo ""

# Gate 9: Installation Test
echo "🔧 Gate 9/10: Installation Test..."
TEST_DIR="/tmp/ctu-install-test-$$"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"
npm init -y > /dev/null
npm install "$(dirname "$0")/../citty-test-utils-"*.tgz > /dev/null || {
  echo "❌ FAILED: Package installation failed"
  exit 1
}
node -e "const pkg = require('citty-test-utils'); if (!pkg.runLocalCitty) throw new Error('Missing exports')" || {
  echo "❌ FAILED: Exports not available after install"
  exit 1
}
cd -
rm -rf "$TEST_DIR"
echo "✅ Gate 9: PASSED"
echo ""

# Gate 10: Documentation Review
echo "📚 Gate 10/10: Documentation Review..."
echo "⚠️  MANUAL CHECK REQUIRED:"
echo "  - Review README.md examples"
echo "  - Check CHANGELOG.md updated"
echo "  - Verify package.json version"
echo ""
read -p "Documentation reviewed and correct? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ FAILED: Documentation not ready"
  exit 1
fi
echo "✅ Gate 10: PASSED"
echo ""

echo "🎉 ALL GATES PASSED!"
echo ""
echo "✅ Safe to publish to npm"
echo ""
echo "Run: npm publish"
```

## Quick Checklist

### Before Running Validation

- [ ] Code changes committed
- [ ] Version bumped in package.json
- [ ] CHANGELOG.md updated
- [ ] README.md examples verified manually
- [ ] All tests passing locally

### Running Validation

```bash
# Make script executable
chmod +x scripts/pre-publish-validation.sh

# Run validation
./scripts/pre-publish-validation.sh
```

### After Validation Passes

- [ ] Review package contents: `tar -tzf citty-test-utils-*.tgz`
- [ ] Test in example project
- [ ] Get peer review
- [ ] Publish: `npm publish`
- [ ] Tag release: `git tag v0.6.1 && git push --tags`
- [ ] Create GitHub release

### After Publishing

- [ ] Test installation: `npm install citty-test-utils@latest`
- [ ] Verify published version works
- [ ] Update documentation if needed
- [ ] Announce release

## Emergency Rollback

If issues found after publishing:

```bash
# Deprecate broken version
npm deprecate citty-test-utils@0.6.0 "CRITICAL: Zod compatibility issues. Use v0.6.1+"

# Publish fixed version immediately
npm version patch
npm publish
```

## Version History Tracking

Keep track of validation results:

```
v0.6.0 - ❌ FAILED (published without validation)
  - README examples: FAILED
  - Exports: FAILED
  - Zod compatibility: FAILED

v0.6.1 - ✅ PASSED (with full validation)
  - README examples: PASSED
  - Exports: PASSED
  - Zod compatibility: PASSED
  - All gates: PASSED
```

## Contact

Questions about validation? See:
- Test Strategy: `docs/TEST-STRATEGY-v0.6.1.md`
- Test Templates: `docs/TEST-TEMPLATES.md`
- Issues: GitHub Issues

---

**Remember**: Every gate must pass. No exceptions. The cost of a broken publish is too high.
