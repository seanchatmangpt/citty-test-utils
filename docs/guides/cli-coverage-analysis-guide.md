# CLI Coverage Analysis Guide

A comprehensive guide to analyzing CLI test coverage using Citty Test Utils.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Analysis Commands](#analysis-commands)
- [Coverage Metrics](#coverage-metrics)
- [Output Formats](#output-formats)
- [Advanced Usage](#advanced-usage)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The CLI Coverage Analysis feature provides comprehensive testing coverage analysis for command-line interfaces built with Citty. It analyzes your CLI structure, discovers test patterns, and generates detailed coverage reports to help you identify gaps in your testing.

### Key Features

- **Command Discovery**: Automatically discovers all CLI commands and subcommands
- **Option Analysis**: Analyzes global options, flags, and command-specific options
- **Test Pattern Detection**: Finds usage patterns in your test files
- **Coverage Calculation**: Calculates comprehensive coverage statistics
- **Multiple Output Formats**: Text, JSON, and Turtle/RDF reports
- **Smart Recommendations**: Actionable suggestions for improving coverage

## Getting Started

### Prerequisites

- Node.js CLI application built with Citty
- Test files using Citty Test Utils testing patterns
- Test files following standard naming conventions (`.test.mjs`, `.test.js`, `.spec.mjs`, `.spec.js`)

### Basic Usage

```bash
# Show coverage statistics
ctu analysis stats

# Generate detailed report
ctu analysis report

# Analyze and save results
ctu analysis analyze --output coverage.json

# Export in different formats
ctu analysis export --format json --output coverage.json
ctu analysis export --format turtle --output coverage.ttl
```

## Analysis Commands

### `ctu analysis stats`

Shows a quick summary of coverage statistics.

```bash
# Basic statistics
ctu analysis stats

# Verbose output with detailed information
ctu analysis stats --verbose
```

**Output Example:**
```
📊 Enhanced CLI Coverage Statistics
==================================
CLI: src/cli.mjs
Test Directory: test
Total Test Files: 46
Total Commands: 5
Total Flags: 4
Total Options: 0

📈 Coverage Summary:
  Commands: 4/5 (80.0%)
  Flags: 4/4 (100.0%)
  Options: 0/0 (0.0%)
  Overall: 8/9 (88.9%)

💡 Top Recommendations:
  1. [HIGH] Add tests for untested commands to improve command coverage
  2. [MEDIUM] Add tests for untested options to improve option coverage
```

### `ctu analysis report`

Generates a detailed coverage report with comprehensive analysis.

```bash
# Text format report
ctu analysis report

# JSON format report
ctu analysis report --format json

# Verbose report with detailed breakdown
ctu analysis report --verbose
```

**Output Example:**
```
📊 CLI Test Coverage Analysis
==================================================

📈 Summary:
  Commands: 4/5 (80.0%)
  Flags: 4/4 (100.0%)
  Options: 0/0 (0.0%)
  Overall: 8/9 (88.9%)

ℹ️  Analysis Info:
  Analyzed: 9/21/2025, 6:30:59 PM
  CLI Path: src/cli.mjs
  Test Directory: test
  Test Files: 46
  Commands: 5
  Flags: 4
  Options: 0

💡 Recommendations:
  1. [HIGH] Add tests for untested commands to improve command coverage
  2. [MEDIUM] Add tests for untested options to improve option coverage
```

### `ctu analysis analyze`

Performs comprehensive analysis and optionally saves results to a file.

```bash
# Basic analysis
ctu analysis analyze

# Save results to file
ctu analysis analyze --output coverage.json

# Specify different CLI path
ctu analysis analyze --cli-path ./my-cli.mjs

# Use test CLI for analysis
ctu analysis analyze --use-test-cli

# Custom test directory
ctu analysis analyze --test-dir ./tests
```

### `ctu analysis export`

Exports coverage data in structured formats for integration with other tools.

```bash
# JSON export
ctu analysis export --format json --output coverage.json

# Turtle/RDF export
ctu analysis export --format turtle --output coverage.ttl

# Custom base URI for RDF
ctu analysis export --format turtle --base-uri "http://myorg.com/cli" --cli-name "my-cli"
```

## Coverage Metrics

### Command Coverage

Measures how many CLI commands are tested.

**Calculation:**
- **Total Commands**: All discovered commands and subcommands
- **Tested Commands**: Commands found in test files
- **Coverage**: (Tested Commands / Total Commands) × 100

**Test Patterns Detected:**
```javascript
// Direct command calls
runLocalCitty(['command', '--help'])

// Command strings
'ctu command --verbose'

// Node CLI calls
node src/cli.mjs command
```

### Flag Coverage

Measures how many boolean flags are tested.

**Calculation:**
- **Total Flags**: All boolean flags (--verbose, --json, etc.)
- **Tested Flags**: Flags found in test files
- **Coverage**: (Tested Flags / Total Flags) × 100

**Test Patterns Detected:**
```javascript
// Long flags
--verbose
--json
--help

// Short flags
-v
-j
-h
```

### Option Coverage

Measures how many options with values are tested.

**Calculation:**
- **Total Options**: All options that accept values (--output, --format, etc.)
- **Tested Options**: Options found in test files
- **Coverage**: (Tested Options / Total Options) × 100

**Test Patterns Detected:**
```javascript
// Options with values
--output=file.json
--format json
--cli-path src/cli.mjs
```

### Overall Coverage

Combined coverage across all categories.

**Calculation:**
- **Total Items**: Commands + Flags + Options
- **Tested Items**: Tested Commands + Tested Flags + Tested Options
- **Coverage**: (Tested Items / Total Items) × 100

## Output Formats

### Text Format

Human-readable format for terminal output and quick analysis.

**Features:**
- Color-coded coverage percentages
- Detailed breakdown by category
- Recommendations with priority levels
- Analysis metadata

### JSON Format

Structured format for programmatic access and integration.

**Structure:**
```json
{
  "metadata": {
    "analyzedAt": "2025-09-22T01:31:03.587Z",
    "cliPath": "src/cli.mjs",
    "testDir": "test",
    "totalTestFiles": 46,
    "totalCommands": 5,
    "totalFlags": 4,
    "totalOptions": 0
  },
  "commands": {
    "test": {
      "name": "test",
      "description": "Run tests and scenarios",
      "tested": true,
      "testFiles": ["test/integration/test-commands.test.mjs"]
    }
  },
  "coverage": {
    "summary": {
      "commands": { "tested": 4, "total": 5, "percentage": 80.0 },
      "flags": { "tested": 4, "total": 4, "percentage": 100.0 },
      "options": { "tested": 0, "total": 0, "percentage": 0.0 },
      "overall": { "tested": 8, "total": 9, "percentage": 88.9 }
    }
  },
  "recommendations": [
    {
      "type": "command",
      "priority": "high",
      "message": "Add tests for untested commands to improve command coverage",
      "count": 1
    }
  ]
}
```

### Turtle/RDF Format

Semantic format for knowledge graphs and semantic analysis.

**Features:**
- RDF/Turtle serialization
- Customizable base URI
- Ontology definitions
- Semantic relationships

**Example:**
```turtle
<http://example.org/cli/ctu> <rdf:type> <cli:Application>;
    <rdfs:label> <ctu>;
    <cli:analyzedAt> "2025-09-22T01:31:03.587Z"^^<xsd:dateTime>;
    <coverage:overallCoverage> "88.9"^^<xsd:decimal>.
```

## Advanced Usage

### Custom CLI Path

Analyze a different CLI file:

```bash
ctu analysis stats --cli-path ./my-custom-cli.mjs
```

### Custom Test Directory

Specify a different test directory:

```bash
ctu analysis stats --test-dir ./tests
```

### Include/Exclude Patterns

Customize which files are analyzed:

```bash
# Include only specific patterns
ctu analysis stats --include-patterns ".test.mjs,.spec.mjs"

# Exclude specific patterns
ctu analysis stats --exclude-patterns "node_modules,.git,coverage,temp"
```

### Test CLI Mode

Use test CLI instead of main CLI:

```bash
ctu analysis stats --use-test-cli
```

### Custom RDF Configuration

Configure Turtle/RDF output:

```bash
ctu analysis export --format turtle \
  --base-uri "http://myorg.com/cli" \
  --cli-name "my-cli" \
  --output coverage.ttl
```

## Best Practices

### 1. Regular Coverage Analysis

Run coverage analysis regularly to track testing progress:

```bash
# Add to CI/CD pipeline
ctu analysis stats --format json --output coverage.json

# Generate reports for documentation
ctu analysis report --format json --output docs/coverage-report.json
```

### 2. Comprehensive Test Patterns

Write tests that cover all CLI features:

```javascript
// Test command execution
const result = await runLocalCitty(['command', '--verbose'])
result.expectSuccess().expectOutput(/expected output/)

// Test flag combinations
const result = await runLocalCitty(['command', '--json', '--verbose'])
result.expectSuccess().expectOutput(/json output/)

// Test option values
const result = await runLocalCitty(['command', '--output', 'test.json'])
result.expectSuccess().expectOutput(/file created/)
```

### 3. Coverage Thresholds

Set coverage thresholds for quality gates:

```bash
# Check if coverage meets minimum requirements
ctu analysis stats --format json | jq '.coverage.summary.overall.percentage >= 80'
```

### 4. Integration with CI/CD

Integrate coverage analysis into your build pipeline:

```yaml
# GitHub Actions example
- name: Analyze CLI Coverage
  run: |
    ctu analysis stats --format json --output coverage.json
    ctu analysis export --format turtle --output coverage.ttl
```

### 5. Documentation Generation

Generate coverage reports for documentation:

```bash
# Generate markdown report
ctu analysis report > docs/coverage-report.md

# Generate JSON for web dashboard
ctu analysis analyze --format json --output docs/coverage.json
```

## Troubleshooting

### Common Issues

#### 1. "No main command found"

**Problem:** CLI module doesn't export the main command.

**Solution:** Ensure your CLI file exports the main command:

```javascript
// src/cli.mjs
export const mainCommand = defineCommand({
  meta: { name: 'my-cli', description: 'My CLI' },
  // ... command definition
})
```

#### 2. "Could not get help for command"

**Problem:** Individual command help is not available.

**Solution:** Ensure all commands have proper help definitions:

```javascript
export const myCommand = defineCommand({
  meta: { name: 'my-command', description: 'My command' },
  args: {
    verbose: { type: 'boolean', description: 'Enable verbose output' }
  }
})
```

#### 3. Low Coverage Scores

**Problem:** Coverage analysis shows low scores.

**Solutions:**
- Add tests for untested commands
- Include flag and option testing in your tests
- Use the recommendations to identify specific gaps

#### 4. Test Pattern Detection Issues

**Problem:** Tests aren't being detected properly.

**Solutions:**
- Use standard test patterns (`runLocalCitty`, `'ctu command'`)
- Ensure test files follow naming conventions
- Check include/exclude patterns

### Debug Mode

Use verbose mode for detailed debugging:

```bash
ctu analysis stats --verbose
```

This will show:
- CLI discovery process
- Test file analysis
- Pattern matching details
- Error messages

### Performance Optimization

For large codebases:

```bash
# Limit test directory scope
ctu analysis stats --test-dir ./tests/unit

# Use specific include patterns
ctu analysis stats --include-patterns ".test.mjs"
```

## Examples

### Complete Analysis Workflow

```bash
# 1. Check current coverage
ctu analysis stats

# 2. Generate detailed report
ctu analysis report --format json --output coverage-report.json

# 3. Export for external tools
ctu analysis export --format turtle --output coverage.ttl

# 4. Analyze specific CLI
ctu analysis analyze --cli-path ./src/my-cli.mjs --output my-cli-coverage.json
```

### CI/CD Integration

```bash
#!/bin/bash
# coverage-check.sh

echo "Analyzing CLI coverage..."

# Run analysis
ctu analysis stats --format json --output coverage.json

# Check coverage threshold
COVERAGE=$(jq -r '.coverage.summary.overall.percentage' coverage.json)
THRESHOLD=80

if (( $(echo "$COVERAGE >= $THRESHOLD" | bc -l) )); then
    echo "✅ Coverage $COVERAGE% meets threshold $THRESHOLD%"
    exit 0
else
    echo "❌ Coverage $COVERAGE% below threshold $THRESHOLD%"
    exit 1
fi
```

### Custom Analysis Script

```javascript
// analyze-coverage.mjs
import { CLCoverageAnalyzer } from './src/core/coverage/cli-coverage-analyzer.js'

const analyzer = new CLCoverageAnalyzer({
  cliPath: 'src/cli.mjs',
  testDir: 'test',
  verbose: true
})

const report = await analyzer.analyze()
const textReport = await analyzer.formatReport(report, { format: 'text' })

console.log(textReport)

// Custom analysis
if (report.coverage.summary.overall.percentage < 90) {
  console.log('⚠️ Coverage below 90% threshold')
  process.exit(1)
}
```

This guide provides comprehensive coverage of all analysis features. Use it as a reference for implementing CLI coverage analysis in your projects.
