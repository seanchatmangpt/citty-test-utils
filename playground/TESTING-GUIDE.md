# Comprehensive Testing Guide for Citty-Test-Utils Playground

This guide explains how to comprehensively test all citty-test-utils functionality using the playground project as a test bed.

## Overview

The playground project serves as a comprehensive test bed for validating all citty-test-utils features. It includes:

- **Complete Citty CLI**: Full-featured CLI with commands, subcommands, and options
- **Comprehensive Test Suite**: Unit tests, integration tests, and scenario tests
- **Local and Cleanroom Testing**: Examples of both local and Docker-based testing
- **All CTU Features**: Tests for every aspect of citty-test-utils functionality

## Test Categories

### 1. Unit Tests (`test/unit/`)
- **File**: `cli.test.mjs`
- **Purpose**: Test basic CLI functionality and fluent assertions
- **Run**: `npm run test:unit`

### 2. Integration Tests (`test/integration/`)

#### Core Integration Tests
- **playground.test.mjs**: Basic playground CLI functionality
- **scenarios.test.mjs**: Scenario DSL and pre-built scenarios
- **analysis.test.mjs**: CLI analysis tools integration

#### Extended Integration Tests
- **fluent-assertions.test.mjs**: Comprehensive fluent assertion testing
- **test-utils.test.mjs**: Test utilities and cleanroom environment testing
- **advanced-scenarios.test.mjs**: Complex scenario workflows and concurrent execution
- **analysis-tools.test.mjs**: Complete analysis tools functionality
- **snapshot-testing.test.mjs**: Snapshot testing capabilities

## Running Tests

### Quick Test Commands

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit
npm run test:integration

# Run individual test files
npm run test:fluent
npm run test:utils
npm run test:scenarios
npm run test:analysis
npm run test:snapshots

# Run comprehensive test suite
npm run test:comprehensive
```

### Comprehensive Testing

The `test-comprehensive.mjs` script runs all tests and validates every aspect of citty-test-utils:

```bash
npm run test:comprehensive
```

This script:
- Runs all unit and integration tests
- Executes demo scripts
- Tests CLI functionality directly
- Provides detailed reporting
- Validates cross-environment consistency

## Features Tested

### 1. Local CLI Execution
- **Function**: `runLocalCitty()`
- **Tests**: Basic command execution, argument handling, JSON output
- **Files**: `cli.test.mjs`, `playground.test.mjs`

### 2. Cleanroom Environment Testing
- **Functions**: `setupCleanroom()`, `runCitty()`, `teardownCleanroom()`
- **Tests**: Docker-based isolated testing, cross-environment consistency
- **Files**: `playground.test.mjs`, `test-utils.test.mjs`

### 3. Fluent Assertions
- **Functions**: `expectSuccess()`, `expectFailure()`, `expectOutput()`, `expectJson()`, etc.
- **Tests**: Method chaining, error messages, edge cases
- **Files**: `fluent-assertions.test.mjs`

### 4. Scenario DSL
- **Function**: `scenario()`
- **Tests**: Multi-step workflows, concurrent execution, error handling
- **Files**: `scenarios.test.mjs`, `advanced-scenarios.test.mjs`

### 5. Pre-built Scenarios
- **Functions**: `scenarios.help()`, `scenarios.version()`, `scenarios.jsonOutput()`, etc.
- **Tests**: Common testing patterns, cross-environment consistency
- **Files**: `scenarios.test.mjs`, `advanced-scenarios.test.mjs`

### 6. JSON Output Testing
- **Function**: `expectJson()`
- **Tests**: Structured data validation, JSON parsing
- **Files**: Multiple test files

### 7. Error Handling
- **Tests**: Invalid commands, missing arguments, timeout handling
- **Files**: Multiple test files

### 8. Snapshot Testing
- **Functions**: `expectSnapshotStdout()`, `expectSnapshotStderr()`, `expectSnapshotJson()`, etc.
- **Tests**: Output consistency, snapshot management
- **Files**: `snapshot-testing.test.mjs`

### 9. Analysis Tools
- **Commands**: `analysis discover`, `analysis analyze`, `analysis recommend`, etc.
- **Tests**: CLI structure discovery, test coverage analysis, recommendations
- **Files**: `analysis.test.mjs`, `analysis-tools.test.mjs`

### 10. Test Utilities
- **Functions**: `testUtils.retry()`, `testUtils.timeout()`, `testUtils.parallel()`, etc.
- **Tests**: Retry mechanisms, timeout handling, parallel execution
- **Files**: `test-utils.test.mjs`

### 11. Cross-Environment Consistency
- **Tests**: Local vs cleanroom consistency, JSON output consistency
- **Files**: `test-utils.test.mjs`, `advanced-scenarios.test.mjs`

### 12. Concurrent Testing
- **Tests**: Parallel command execution, concurrent scenarios
- **Files**: `test-utils.test.mjs`, `advanced-scenarios.test.mjs`

## Demo Scripts

### Scenarios Demo
```bash
npm run demo
```
Demonstrates scenario DSL usage with the playground CLI.

### Snapshot Demo
```bash
npm run demo:snapshots
```
Shows snapshot testing patterns and management.

### Analysis Demo
```bash
npm run demo:analysis
```
Demonstrates CLI analysis tools with the playground.

## CLI Commands Tested

The playground CLI includes comprehensive commands for testing:

### Basic Commands
- `--show-help`: Help information
- `--show-version`: Version information

### Greet Command
- `greet <name>`: Basic greeting
- `greet <name> --count <n>`: Repeated greeting
- `greet <name> --verbose`: Verbose output
- `greet <name> --json`: JSON output

### Math Commands
- `math add <a> <b>`: Addition
- `math multiply <a> <b>`: Multiplication
- Both support `--json` flag

### Error Commands
- `error generic`: Generic error
- `error validation`: Validation error
- `error timeout`: Timeout simulation

### Info Command
- `info`: Playground information
- `info --json`: JSON information

## Test Configuration

### Vitest Configuration
The `vitest.config.mjs` includes:
- Global test configuration
- Coverage settings
- Parallel execution
- Timeout settings
- Reporter configuration

### Test Timeouts
- Default: 10 seconds
- Cleanroom setup: 30 seconds
- Timeout tests: 1 second

## Validation Checklist

When running tests, ensure:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Cleanroom environment works
- [ ] Fluent assertions work correctly
- [ ] Scenario DSL functions properly
- [ ] Pre-built scenarios execute successfully
- [ ] JSON output testing works
- [ ] Error handling is comprehensive
- [ ] Snapshot testing functions
- [ ] Analysis tools work correctly
- [ ] Test utilities operate properly
- [ ] Cross-environment consistency maintained
- [ ] Concurrent testing works
- [ ] Demo scripts run successfully
- [ ] CLI commands function correctly

## Troubleshooting

### Common Issues

1. **Cleanroom Setup Fails**
   - Ensure Docker is running
   - Check Docker permissions
   - Verify Node.js version compatibility

2. **Analysis Commands Fail**
   - Ensure running from correct directory
   - Check CLI path arguments
   - Verify test directory exists

3. **Snapshot Tests Fail**
   - Check snapshot file permissions
   - Verify snapshot directory exists
   - Update snapshots if needed

4. **Timeout Issues**
   - Increase timeout values
   - Check system performance
   - Verify Docker resources

### Debug Mode

Run tests with verbose output:
```bash
npm run test:run -- --reporter=verbose
```

Run specific test with debug:
```bash
npx vitest run test/integration/fluent-assertions.test.mjs --reporter=verbose
```

## Continuous Integration

The playground is designed to work in CI environments:

- All tests run in Docker containers
- No external dependencies required
- Comprehensive error reporting
- Detailed test results

## Contributing

When adding new features to citty-test-utils:

1. Add corresponding tests to the playground
2. Update this documentation
3. Ensure all tests pass
4. Run comprehensive test suite
5. Update demo scripts if applicable

The playground serves as both a test bed and reference implementation for citty-test-utils functionality.
