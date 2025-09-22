# CLI Coverage Analysis Capability

## Overview

The CLI Coverage Analysis capability is a powerful tool that walks through CLI help output and determines test coverage for commands. It automatically discovers commands, subcommands, and arguments from CLI help text, then analyzes existing test files to determine which commands are covered by tests.

## Features

### 🔍 **Command Discovery**
- Parses CLI help output to extract commands and descriptions
- Supports multiple help formats (COMMANDS, NOUNS, SUBCOMMANDS sections)
- Handles both simple command lists and noun-verb structures
- Discovers subcommands by analyzing individual command help

### 🧪 **Test Discovery**
- Scans test directories for test files
- Analyzes test file content for command usage patterns
- Supports multiple test file patterns (`.test.mjs`, `.test.js`, `.spec.mjs`, `.spec.js`)
- Maps commands to their corresponding test files

### 📊 **Coverage Calculation**
- Calculates coverage percentages for main commands and subcommands
- Provides overall coverage statistics
- Identifies untested commands and subcommands
- Generates actionable recommendations

### 📋 **Reporting**
- Text format with emoji indicators and clear structure
- JSON format for programmatic consumption
- Detailed command-by-command analysis
- Priority-based recommendations (high, medium, low)

## Usage

### CLI Command

```bash
# Basic coverage analysis
ctu coverage

# Analyze specific CLI file
ctu coverage --cli-path my-cli.mjs

# Use test CLI for analysis
ctu coverage --use-test-cli

# Verbose output
ctu coverage --verbose

# JSON output
ctu coverage --format json

# Save report to file
ctu coverage --output coverage-report.json
```

### Programmatic Usage

```javascript
import { analyzeCLICoverage, getCLICoverageReport } from 'citty-test-utils'

// Analyze coverage
const report = await analyzeCLICoverage({
  cliPath: 'src/cli.mjs',
  testDir: 'test',
  verbose: false
})

// Get formatted report
const formattedReport = await getCLICoverageReport({
  cliPath: 'test-cli.mjs',
  testDir: 'test',
  useTestCli: true
})
```

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `cliPath` | Path to CLI file to analyze | `src/cli.mjs` |
| `testDir` | Directory containing test files | `test` |
| `useTestCli` | Use test CLI instead of main CLI | `false` |
| `format` | Output format (text, json) | `text` |
| `verbose` | Enable verbose output | `false` |
| `includePatterns` | File patterns to include | `[.test.mjs, .test.js, .spec.mjs, .spec.js]` |
| `excludePatterns` | Patterns to exclude | `[node_modules, .git, coverage]` |

## Output Formats

### Text Format

```
📊 CLI Test Coverage Analysis
==================================================

📈 Summary:
  Main Commands: 3/4 (75.0%)
  Subcommands: 0/0 (0.0%)
  Overall: 3/4 (75.0%)

📋 Commands Detail:
  ✅ greet: Greet someone
  ✅ math: Perform mathematical operations
  ❌ error: Simulate different types of errors
  ✅ info: Show test CLI information

💡 Recommendations:
  🔴 Command "error" has no tests
     → Add tests for command: error
  🟡 Overall test coverage is 75.0%
     → Good coverage, but could be improved

ℹ️  Analysis Info:
  Analyzed: 9/21/2025, 4:44:38 PM
  CLI Path: test-cli.mjs
  Test Directory: test
  Test Files: 0
```

### JSON Format

```json
{
  "summary": {
    "mainCommands": {
      "total": 4,
      "tested": 3,
      "percentage": 75
    },
    "subcommands": {
      "total": 0,
      "tested": 0,
      "percentage": 0
    },
    "overall": {
      "total": 4,
      "tested": 3,
      "percentage": 75
    }
  },
  "commands": {
    "greet": {
      "name": "greet",
      "description": "Greet someone",
      "tested": true,
      "testFiles": ["test/greet.test.mjs"],
      "subcommands": {}
    }
  },
  "recommendations": [
    {
      "type": "missing_test",
      "priority": "high",
      "command": "error",
      "message": "Command \"error\" has no tests",
      "suggestion": "Add tests for command: error"
    }
  ],
  "metadata": {
    "analyzedAt": "2025-09-21T23:44:38.903Z",
    "cliPath": "test-cli.mjs",
    "testDir": "test",
    "totalTestFiles": 0
  }
}
```

## Command Discovery Patterns

The analyzer recognizes several help output patterns:

### COMMANDS Section
```
COMMANDS

  greet    Greet someone                     
   math    Perform mathematical operations   
  error    Simulate different types of errors
   info    Show test CLI information         
```

### USAGE Pattern
```
USAGE ctu [OPTIONS] test|gen|runner|info|coverage
```

### Noun-Verb Structure
```
USAGE ctu <noun> <verb> [options]
```

## Test Discovery Patterns

The analyzer looks for these patterns in test files:

- `runLocalCitty(['command', ...])`
- `runCitty(['command', ...])`
- `scenarios.commandName`
- `exec(env, ['command', ...])`
- Command strings in test descriptions

## Recommendations

The analyzer provides actionable recommendations:

### Missing Test Recommendations
- **High Priority**: Commands with no tests
- **Medium Priority**: Subcommands with no tests
- **Low Priority**: Commands with limited test coverage

### Coverage Recommendations
- **High Priority**: Coverage below 50%
- **Medium Priority**: Coverage between 50-80%
- **Low Priority**: Coverage above 80%

## Examples

### Analyzing Test CLI
```bash
ctu coverage --cli-path test-cli.mjs --use-test-cli --verbose
```

### Analyzing Main CLI
```bash
ctu coverage --cli-path src/cli.mjs --format json
```

### Custom Test Directory
```bash
ctu coverage --test-dir tests --include-patterns ".test.js,.spec.js"
```

## Integration

The coverage analyzer integrates seamlessly with:

- **Citty Test Utils**: Uses existing runners and scenarios
- **Vitest**: Compatible with test file patterns
- **CI/CD**: JSON output for automated reporting
- **Documentation**: Generates coverage reports for docs

## Benefits

1. **Automated Discovery**: No manual command listing required
2. **Comprehensive Analysis**: Covers main commands and subcommands
3. **Actionable Insights**: Clear recommendations for improvement
4. **Multiple Formats**: Text and JSON output options
5. **Flexible Configuration**: Customizable patterns and directories
6. **Integration Ready**: Works with existing test infrastructure

## Use Cases

- **Test Coverage Audits**: Identify untested CLI commands
- **CI/CD Integration**: Automated coverage reporting
- **Documentation**: Generate coverage reports for docs
- **Quality Assurance**: Ensure comprehensive CLI testing
- **Development Workflow**: Track testing progress

This capability provides a comprehensive solution for analyzing CLI test coverage, making it easy to identify gaps and improve test coverage systematically.
