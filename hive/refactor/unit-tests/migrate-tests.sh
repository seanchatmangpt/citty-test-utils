#!/bin/bash

# Migration Script for Refactored Unit Tests
# This script helps migrate the refactored tests to test/unit/

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
REFACTORED_DIR="$SCRIPT_DIR"
TEST_DIR="$PROJECT_ROOT/test/unit"

echo "🔄 Unit Test Migration Script"
echo "=============================="
echo ""
echo "Refactored tests: $REFACTORED_DIR"
echo "Target directory: $TEST_DIR"
echo ""

# Check if target directory exists
if [ ! -d "$TEST_DIR" ]; then
  echo "❌ Error: Test directory not found: $TEST_DIR"
  exit 1
fi

# Function to backup a file
backup_file() {
  local file="$1"
  if [ -f "$file" ]; then
    local backup="${file}.backup-$(date +%Y%m%d-%H%M%S)"
    echo "  📦 Backing up: $(basename "$file") → $(basename "$backup")"
    cp "$file" "$backup"
  fi
}

# Function to migrate a test file
migrate_test() {
  local filename="$1"
  local source="$REFACTORED_DIR/$filename"
  local target="$TEST_DIR/$filename"

  if [ ! -f "$source" ]; then
    echo "  ⚠️  Warning: Source file not found: $filename"
    return
  fi

  echo "  ✅ Migrating: $filename"

  # Backup existing file if it exists
  backup_file "$target"

  # Copy refactored test
  cp "$source" "$target"
}

echo "📋 Migration Options:"
echo "  1) Migrate ALL refactored tests (recommended)"
echo "  2) Migrate CRITICAL tests only (local-runner, scenario-dsl)"
echo "  3) Migrate individual test files"
echo "  4) Show diff between old and new tests"
echo "  5) Cancel"
echo ""
read -p "Select option (1-5): " choice

case $choice in
  1)
    echo ""
    echo "🚀 Migrating ALL refactored tests..."
    echo ""
    migrate_test "local-runner.test.mjs"
    migrate_test "scenario-dsl.test.mjs"
    migrate_test "snapshot.test.mjs"
    migrate_test "analysis-utils.test.mjs"
    migrate_test "ast-cache.test.mjs"
    echo ""
    echo "✅ All tests migrated successfully!"
    ;;

  2)
    echo ""
    echo "🚀 Migrating CRITICAL tests..."
    echo ""
    migrate_test "local-runner.test.mjs"
    migrate_test "scenario-dsl.test.mjs"
    echo ""
    echo "✅ Critical tests migrated successfully!"
    echo "ℹ️  Note: snapshot.test.mjs, analysis-utils.test.mjs, ast-cache.test.mjs not migrated"
    ;;

  3)
    echo ""
    echo "📝 Available test files:"
    echo "  1) local-runner.test.mjs ⭐ CRITICAL"
    echo "  2) scenario-dsl.test.mjs"
    echo "  3) snapshot.test.mjs"
    echo "  4) analysis-utils.test.mjs"
    echo "  5) ast-cache.test.mjs"
    echo ""
    read -p "Select file (1-5): " file_choice

    case $file_choice in
      1) migrate_test "local-runner.test.mjs" ;;
      2) migrate_test "scenario-dsl.test.mjs" ;;
      3) migrate_test "snapshot.test.mjs" ;;
      4) migrate_test "analysis-utils.test.mjs" ;;
      5) migrate_test "ast-cache.test.mjs" ;;
      *) echo "❌ Invalid selection" ; exit 1 ;;
    esac

    echo ""
    echo "✅ Test migrated successfully!"
    ;;

  4)
    echo ""
    echo "📊 Showing diffs..."
    echo ""

    for file in local-runner.test.mjs scenario-dsl.test.mjs snapshot.test.mjs; do
      if [ -f "$TEST_DIR/$file" ]; then
        echo "=== DIFF: $file ==="
        diff -u "$TEST_DIR/$file" "$REFACTORED_DIR/$file" || true
        echo ""
      else
        echo "  ⚠️  Old test not found: $file"
      fi
    done
    ;;

  5)
    echo "❌ Migration cancelled"
    exit 0
    ;;

  *)
    echo "❌ Invalid option"
    exit 1
    ;;
esac

echo ""
echo "📋 Next Steps:"
echo "  1. Run tests: npm test -- test/unit/"
echo "  2. Verify all pass: npm run test:coverage"
echo "  3. Review backups in: $TEST_DIR/*.backup-*"
echo "  4. Clean up backups when satisfied"
echo ""
echo "📚 Documentation:"
echo "  - README: $REFACTORED_DIR/README.md"
echo "  - Summary: $REFACTORED_DIR/REFACTORING-SUMMARY.md"
echo ""
echo "✅ Migration complete!"
