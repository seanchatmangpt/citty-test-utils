#!/bin/bash
# Docker Test Fixes Validation Script
# This script validates the Docker test fixes implementation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../" && pwd)"

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║              Docker Test Fixes - Validation Script                          ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validation counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✅ PASS${NC} - $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}❌ FAIL${NC} - $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC} - $1"
    ((WARNINGS++))
}

echo "📋 Validation Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Check if all implementation files exist
echo "1️⃣  Checking implementation files..."
FILES=(
    "cleanroom-runner-improved.js"
    "shared-cleanroom-improved.mjs"
    "vitest-docker-setup.mjs"
    "cleanroom-test-improved.test.mjs"
)

for file in "${FILES[@]}"; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
        check_pass "Found $file"
    else
        check_fail "Missing $file"
    fi
done
echo ""

# 2. Check if all documentation files exist
echo "2️⃣  Checking documentation files..."
DOCS=(
    "README.md"
    "INTEGRATION_GUIDE.md"
    "TESTING_SUMMARY.md"
    "QUICK_REFERENCE.md"
    "IMPLEMENTATION_CHECKLIST.md"
    "INDEX.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$SCRIPT_DIR/$doc" ]; then
        check_pass "Found $doc"
    else
        check_fail "Missing $doc"
    fi
done
echo ""

# 3. Check Docker availability
echo "3️⃣  Checking Docker availability..."
if docker info > /dev/null 2>&1; then
    check_pass "Docker is running"
    DOCKER_AVAILABLE=true

    # Get Docker version
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
    echo -e "   ${BLUE}ℹ${NC}  Docker version: $DOCKER_VERSION"
else
    check_warn "Docker is not running (tests will skip)"
    DOCKER_AVAILABLE=false
fi
echo ""

# 4. Check for existing test containers
echo "4️⃣  Checking for existing test containers..."
if [ "$DOCKER_AVAILABLE" = true ]; then
    CONTAINER_COUNT=$(docker ps -aq --filter "label=ctu-test" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$CONTAINER_COUNT" -eq 0 ]; then
        check_pass "No test containers found (clean state)"
    else
        check_warn "Found $CONTAINER_COUNT test containers"
        echo -e "   ${YELLOW}→${NC} Run: docker rm -f \$(docker ps -aq --filter \"label=ctu-test\")"
    fi
else
    check_warn "Skipped (Docker not available)"
fi
echo ""

# 5. Validate file contents
echo "5️⃣  Validating file contents..."

# Check if cleanroom-runner has retry logic
if grep -q "retryWithBackoff" "$SCRIPT_DIR/cleanroom-runner-improved.js" 2>/dev/null; then
    check_pass "cleanroom-runner has retry logic"
else
    check_fail "cleanroom-runner missing retry logic"
fi

# Check if cleanroom-runner has container labeling
if grep -q "CONTAINER_LABEL" "$SCRIPT_DIR/cleanroom-runner-improved.js" 2>/dev/null; then
    check_pass "cleanroom-runner has container labeling"
else
    check_fail "cleanroom-runner missing container labeling"
fi

# Check if shared-cleanroom has Docker availability check
if grep -q "isDockerRunning" "$SCRIPT_DIR/shared-cleanroom-improved.mjs" 2>/dev/null; then
    check_pass "shared-cleanroom has Docker availability check"
else
    check_fail "shared-cleanroom missing Docker availability check"
fi

# Check if test file has skip logic
if grep -q "Skipping test" "$SCRIPT_DIR/cleanroom-test-improved.test.mjs" 2>/dev/null; then
    check_pass "Test file has skip logic"
else
    check_fail "Test file missing skip logic"
fi
echo ""

# 6. Check project structure
echo "6️⃣  Checking project structure..."

if [ -f "$PROJECT_ROOT/src/core/runners/cleanroom-runner.js" ]; then
    check_pass "Found src/core/runners/cleanroom-runner.js"
else
    check_warn "src/core/runners/cleanroom-runner.js not found (not integrated yet)"
fi

if [ -f "$PROJECT_ROOT/test/setup/shared-cleanroom.mjs" ]; then
    check_pass "Found test/setup/shared-cleanroom.mjs"
else
    check_warn "test/setup/shared-cleanroom.mjs not found (not integrated yet)"
fi

if [ -f "$PROJECT_ROOT/vitest.config.js" ] || [ -f "$PROJECT_ROOT/vitest.config.mjs" ]; then
    check_pass "Found vitest config file"
else
    check_warn "No vitest config file found (may need to create)"
fi
echo ""

# 7. Check line counts
echo "7️⃣  Checking file sizes..."

check_line_count() {
    local file=$1
    local min_lines=$2
    local lines=$(wc -l < "$SCRIPT_DIR/$file" 2>/dev/null | tr -d ' ')

    if [ -z "$lines" ]; then
        check_fail "$file - could not count lines"
    elif [ "$lines" -ge "$min_lines" ]; then
        check_pass "$file - $lines lines (expected >=$min_lines)"
    else
        check_warn "$file - only $lines lines (expected >=$min_lines)"
    fi
}

check_line_count "cleanroom-runner-improved.js" 200
check_line_count "cleanroom-test-improved.test.mjs" 150
check_line_count "shared-cleanroom-improved.mjs" 90
check_line_count "README.md" 250
check_line_count "INTEGRATION_GUIDE.md" 300
echo ""

# 8. Final summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Validation Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Passed:${NC}   $PASSED"
echo -e "${RED}❌ Failed:${NC}   $FAILED"
echo -e "${YELLOW}⚠️  Warnings:${NC} $WARNINGS"
echo ""

TOTAL=$((PASSED + FAILED + WARNINGS))
SCORE=$(echo "scale=1; $PASSED * 100 / $TOTAL" | bc)

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}✅ All validation checks passed!${NC}"
    echo -e "Score: ${GREEN}$SCORE%${NC} ($PASSED/$TOTAL)"
    echo ""
    echo "🚀 Next Steps:"
    echo "  1. Review INTEGRATION_GUIDE.md for integration steps"
    echo "  2. Follow QUICK_REFERENCE.md for quick integration"
    echo "  3. Use IMPLEMENTATION_CHECKLIST.md to track progress"
else
    echo -e "${RED}❌ Validation failed with $FAILED error(s)${NC}"
    echo -e "Score: ${YELLOW}$SCORE%${NC} ($PASSED/$TOTAL)"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "  1. Check that all files were created correctly"
    echo "  2. Review README.md for file requirements"
    echo "  3. Run this script again after fixing issues"
fi

if [ "$WARNINGS" -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  There are $WARNINGS warning(s) that may need attention${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Exit code based on failures
if [ "$FAILED" -gt 0 ]; then
    exit 1
else
    exit 0
fi
