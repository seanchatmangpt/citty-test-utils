# README Tests

This directory contains tests that verify all the examples and functionality described in the main README.md file.

## Purpose

These tests ensure that:
- All code examples in the README actually work
- All features mentioned in the README are functional
- All CLI commands documented in the README are available
- All TypeScript definitions mentioned in the README exist
- All installation and setup instructions are accurate

## Test Files

### `examples.test.mjs`
Tests all the code examples from the README, including:
- Quick Start examples
- Local Runner examples
- Cleanroom Runner examples
- Scenario DSL examples
- Test Utilities examples
- Scenarios Pack examples
- Complete examples
- Vitest integration examples
- Advanced features examples

### `cli-commands.test.mjs`
Tests all the CLI commands mentioned in the README:
- Built-in CLI commands (`ctu info`, `ctu gen`, `ctu runner`, `ctu test`)
- Playground project structure
- Project structure requirements
- Documentation files

### `typescript-support.test.mjs`
Tests TypeScript support mentioned in the README:
- TypeScript definitions file existence
- Type definitions content
- tsconfig.json configuration
- Package.json TypeScript support

### `cleanroom.test.mjs`
Tests all the cleanroom (Docker) examples from the README, including:
- Basic cleanroom examples
- Cleanroom scenario examples
- Cross-environment testing
- Complete cleanroom examples
- Vitest integration cleanroom examples
- Advanced cleanroom features

**Note**: This test requires Docker to be running and may take longer to execute due to container setup/teardown.

### `cleanroom-gen-focus.test.mjs`
Focused cleanroom tests that demonstrate gen command concepts without CLI limitations:
- **Gen Command Concepts**: Demonstrates gen command functionality from README
- **Cleanroom Isolation**: Shows how files stay in cleanroom containers
- **No Project Pollution**: Verifies cleanroom environment isolation
- **Complete Scenario Coverage**: All cleanroom scenarios (JSON, subcommands, concurrent, etc.)
- **Cross-Environment Testing**: Local vs cleanroom consistency
- **Gen Command Workflow**: Demonstrates gen command workflow concepts

**Note**: This test focuses on gen command concepts and cleanroom isolation without requiring the gen commands to be available in the playground CLI.

### `end-to-end.test.mjs`
Comprehensive end-to-end test that demonstrates the complete workflow from README:
- Installation and setup verification
- Basic usage examples (local and cleanroom)
- Fluent assertions examples
- Scenario DSL examples
- Pre-built scenarios examples
- Cleanroom scenarios examples
- Utility functions examples
- CLI commands examples
- Complete integration example
- Error handling examples

**Note**: This test provides the most comprehensive coverage of README examples and serves as a complete integration test.

## Running the Tests

```bash
# Run all README tests
npm test test/readme

# Run specific README test file
npm test test/readme/examples.test.mjs

# Run cleanroom tests only (requires Docker)
npm run test:readme:cleanroom

# Run focused cleanroom tests with gen command concepts (requires Docker)
npm run test:readme:cleanroom:gen

# Run end-to-end tests (comprehensive README coverage)
npm run test:readme:e2e

# Run with coverage
npm run test:coverage test/readme

# Run with verbose output
npm test test/readme -- --reporter=verbose
```

## Configuration

The tests use a dedicated vitest configuration (`vitest.config.mjs`) with:
- Extended timeouts for Docker operations
- Global setup for cleanroom testing
- Proper environment variables
- Coverage reporting

## Notes

- Some tests may be skipped if Docker is not available
- CLI command tests may be skipped if the CLI is not built yet
- Tests are designed to be robust and handle missing dependencies gracefully
- All tests verify that the README documentation is accurate and up-to-date
