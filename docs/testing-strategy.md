# Testing Strategy for citty-test-utils
## London School TDD Assessment and Improvement Plan

**Assessment Date:** 2025-10-02
**Framework Version:** 0.5.1
**Test Framework:** Vitest
**Testing Paradigm:** London School TDD (Mockist Approach)

---

## Executive Summary

### Current State Quality Score: **6.5/10**

**Strengths:**
- Good test coverage of core DSL and assertion APIs
- Excellent fluent assertion design
- Strong integration test suite for CLI analysis tools
- Concurrent test execution patterns
- Comprehensive snapshot testing infrastructure

**Weaknesses:**
- **Critical:** Mock strategy is inconsistent (mixing classical and mockist approaches)
- Lack of collaboration-based testing (London School principle)
- Test isolation issues (singleton cleanroom state)
- Missing contract tests between components
- Unit tests have mock configuration problems (failing tests indicate mocking issues)
- No behavior verification patterns
- Limited test data builders and fixtures

---

## 1. Current Test Quality Assessment

### 1.1 Test Structure Analysis

**Test Distribution:**
- Unit tests: 3 files (~20 tests)
- Integration tests: 11 files (~200+ tests)
- Test/Integration ratio: **1:10** (Should be closer to 3:1 for London School)

**Coverage by Module:**

| Module | Source Files | Test Files | Coverage | Quality |
|--------|--------------|------------|----------|---------|
| Core Runners | 2 | 1 | 40% | Medium |
| Assertions | 2 | 1 | 60% | Good |
| Scenarios | 3 | 1 | 70% | Good |
| Commands | 30 | 0 | 0% | **Critical Gap** |
| Coverage Analysis | 5 | 1 | 15% | Poor |
| Utils | 4 | 0 | 0% | **Critical Gap** |

### 1.2 Test Pattern Analysis

**Current Patterns Used:**
- ✅ AAA (Arrange-Act-Assert) - 90% of tests
- ✅ Fluent Assertions - Excellent implementation
- ⚠️ Mocking - Inconsistent (vi.mock used but not London School style)
- ❌ Test Data Builders - Not used
- ❌ Object Mothers - Not used
- ❌ Behavior Verification - Missing
- ❌ Contract Testing - Missing

**London School Compliance:**
- Mock-driven design: **2/10**
- Behavior verification: **1/10**
- Outside-in development: **3/10**
- Collaboration testing: **1/10**

---

## 2. Critical Test Coverage Gaps

### Priority 1: HIGH (Must Fix)

#### 2.1 Commands Layer - 30 Files, 0% Coverage
**Risk:** CLI commands are the primary user interface with zero unit test coverage.

**Missing Tests:**
- `/src/commands/analysis/*.js` (9 files)
  - `discover.js` - Command discovery logic
  - `analyze.js` - Coverage analysis
  - `recommend.js` - Smart recommendations
  - `ast-analyze.js` - AST parsing
  - `export.js` - Data export
  - `report.js` - Report generation
  - `stats.js` - Statistics
  - `coverage.js` - Coverage calculation

- `/src/commands/gen/*.js` (5 files)
  - `scenario.js` - Scenario generation
  - `test.js` - Test generation
  - `cli.js` - CLI generation
  - `config.js` - Config generation
  - `project.js` - Project scaffolding

- `/src/commands/test/*.js` (4 files)
  - `scenario.js` - Scenario execution
  - `run.js` - Test runner
  - `error.js` - Error handling
  - `help.js` - Help text

- `/src/commands/runner/*.js` (3 files)
  - `local.js` - Local runner command
  - `cleanroom.js` - Cleanroom command
  - `execute.js` - Generic execution

- `/src/commands/info/*.js` (4 files)
  - `features.js` - Feature listing
  - `config.js` - Config display
  - `version.js` - Version info
  - `all.js` - All info

**Impact:** Commands orchestrate business logic. Untested commands = untested features.

#### 2.2 Utilities Layer - 4 Files, 0% Coverage
**Risk:** Core utilities used throughout the codebase are untested.

**Missing Tests:**
- `smart-cli-detector.js` - CLI detection logic
- `environment-detection.js` - Environment detection
- `context-manager.js` - Context management
- `analysis-report-utils.js` - Report utilities

#### 2.3 Coverage Analysis Core - 5 Files, 15% Coverage
**Risk:** The tool that analyzes tests is not well-tested itself.

**Missing Tests:**
- `cli-coverage-analyzer.js` - Main coverage analyzer
- `enhanced-ast-cli-analyzer.js` - Enhanced AST analysis
- `ast-cli-analyzer.js` - AST CLI analyzer
- `command-discovery.js` - Command discovery
- `test-discovery.js` - Test discovery

### Priority 2: MEDIUM (Should Fix)

#### 2.4 Runner Mock Strategy
**Issue:** Unit tests for `local-runner.test.mjs` are failing because:
1. Mocks are not properly isolated
2. Integration-style execution happens in unit tests
3. No clear separation between unit and integration concerns

**Example Problem:**
```javascript
// Current: Mock at module level but integration tests still run
vi.mock('node:child_process', () => ({
  exec: vi.fn(),
  execSync: vi.fn(),
}))

// Issue: Tests execute real CLI instead of respecting mocks
const result = await runLocalCitty(['--help'], { env: { TEST_CLI: 'true' } })
// Expected: Mock response
// Actual: Real CLI execution
```

#### 2.5 Cleanroom Singleton State
**Issue:** Cleanroom runner uses singleton pattern that violates test isolation:

```javascript
// src/core/runners/cleanroom-runner.js
let singleton // ❌ Shared state across tests
```

**Impact:** Tests cannot run in parallel safely, potential for test pollution.

### Priority 3: LOW (Nice to Have)

#### 2.6 Snapshot Management
**Gap:** `snapshot-management.js` has no dedicated unit tests (only integration tests).

#### 2.7 Scenario Pre-built Library
**Gap:** `scenarios.js` pre-built scenarios not directly unit tested.

---

## 3. London School TDD Principles Applied

### 3.1 Mock Strategy Guidelines

#### When to Mock (London School)
**ALWAYS mock:**
1. **External dependencies** (file system, network, Docker)
2. **Collaborators** (objects that the SUT depends on)
3. **Side effects** (command execution, state changes)
4. **Time-dependent operations** (Date.now(), timers)

**NEVER mock:**
1. **Value objects** (strings, numbers, simple data structures)
2. **The System Under Test (SUT)** itself
3. **Pure functions** (no side effects)
4. **Test utilities** within the same test

#### Mock Design Pattern (London School)

```javascript
// ✅ GOOD: London School Mock Pattern
describe('AnalysisCommand', () => {
  let mockAnalyzer
  let mockReporter
  let mockExporter
  let command

  beforeEach(() => {
    // Arrange: Create mocks for all collaborators
    mockAnalyzer = {
      analyze: vi.fn().mockResolvedValue({
        coverage: 85,
        gaps: ['command-a', 'command-b']
      })
    }

    mockReporter = {
      generateReport: vi.fn().mockReturnValue('Coverage Report')
    }

    mockExporter = {
      export: vi.fn().mockResolvedValue({ success: true })
    }

    // Inject mocks (dependency injection)
    command = new AnalysisCommand(mockAnalyzer, mockReporter, mockExporter)
  })

  it('should coordinate coverage analysis workflow', async () => {
    // Act
    await command.execute({ cliPath: 'app/cli.js', format: 'text' })

    // Assert: Verify interactions (behavior)
    expect(mockAnalyzer.analyze).toHaveBeenCalledWith('app/cli.js')
    expect(mockReporter.generateReport).toHaveBeenCalledWith({
      coverage: 85,
      gaps: ['command-a', 'command-b']
    })
    expect(mockExporter.export).not.toHaveBeenCalled() // No export requested
  })

  it('should handle analysis errors by logging and re-throwing', async () => {
    // Arrange: Mock failure scenario
    mockAnalyzer.analyze.mockRejectedValue(new Error('Parse error'))

    // Act & Assert
    await expect(command.execute({ cliPath: 'bad.js' }))
      .rejects.toThrow('Parse error')

    // Verify error handling interaction
    expect(mockReporter.generateReport).not.toHaveBeenCalled()
  })
})
```

```javascript
// ❌ BAD: Classical Testing (State Verification)
describe('AnalysisCommand', () => {
  it('should return coverage report', async () => {
    const command = new AnalysisCommand() // Real dependencies

    const result = await command.execute({ cliPath: 'app/cli.js' })

    // Only checks end state, not the collaboration
    expect(result.coverage).toBeGreaterThan(0)
    expect(result.report).toBeDefined()
  })
})
```

### 3.2 Test Organization Standards

#### File Structure
```
test/
├── unit/                          # London School mockist tests
│   ├── commands/                  # Command layer (orchestration)
│   │   ├── analysis/
│   │   │   ├── discover.test.mjs
│   │   │   ├── analyze.test.mjs
│   │   │   └── recommend.test.mjs
│   │   ├── gen/
│   │   │   └── scenario.test.mjs
│   │   └── test/
│   │       └── run.test.mjs
│   ├── core/                      # Core business logic
│   │   ├── runners/
│   │   │   ├── local-runner.test.mjs
│   │   │   └── cleanroom-runner.test.mjs
│   │   ├── assertions/
│   │   │   ├── assertions.test.mjs
│   │   │   └── snapshot.test.mjs
│   │   ├── coverage/
│   │   │   ├── ast-cli-analyzer.test.mjs
│   │   │   └── test-discovery.test.mjs
│   │   └── scenarios/
│   │       └── scenario-dsl.test.mjs
│   ├── utils/                     # Utilities
│   │   ├── smart-cli-detector.test.mjs
│   │   └── environment-detection.test.mjs
│   └── helpers/                   # Test helpers
│       ├── mock-factories.mjs     # Mock creation utilities
│       ├── test-builders.mjs      # Test data builders
│       └── fixtures.mjs           # Shared test fixtures
├── integration/                   # Integration tests (real dependencies)
│   └── [existing integration tests]
├── contract/                      # Contract tests (component interfaces)
│   ├── runner-contract.test.mjs
│   ├── analyzer-contract.test.mjs
│   └── command-contract.test.mjs
└── performance/                   # Performance benchmarks
    └── cli-performance.test.mjs
```

#### Test Naming Convention
```javascript
// Pattern: describe('ClassName', () => { it('should ... when ...', () => {}) })

describe('AnalyzeCommand', () => {
  describe('execute()', () => {
    it('should analyze CLI and generate report when valid path provided', async () => {})
    it('should throw error when CLI path is invalid', async () => {})
    it('should use default analyzer when none provided', async () => {})
  })

  describe('validateOptions()', () => {
    it('should accept valid options', () => {})
    it('should reject missing required options', () => {})
  })
})
```

### 3.3 Behavior Verification Patterns

#### Interaction Testing
```javascript
// Test HOW objects collaborate, not WHAT they contain
describe('CleanroomRunner', () => {
  let mockContainer
  let mockHealthChecker
  let runner

  beforeEach(() => {
    mockContainer = {
      exec: vi.fn().mockResolvedValue({
        exitCode: 0,
        output: 'success',
        stderr: ''
      }),
      stop: vi.fn().mockResolvedValue(undefined)
    }

    mockHealthChecker = {
      verify: vi.fn().mockResolvedValue(true)
    }

    runner = new CleanroomRunner(mockContainer, mockHealthChecker)
  })

  it('should verify container health before executing command', async () => {
    await runner.runCommand(['--help'])

    // Verify interaction order
    expect(mockHealthChecker.verify).toHaveBeenCalledBefore(mockContainer.exec)
    expect(mockContainer.exec).toHaveBeenCalledWith(['--help'], expect.any(Object))
  })

  it('should not execute command when container is unhealthy', async () => {
    mockHealthChecker.verify.mockResolvedValue(false)

    await expect(runner.runCommand(['--help']))
      .rejects.toThrow('Container unhealthy')

    expect(mockContainer.exec).not.toHaveBeenCalled()
  })
})
```

#### Collaboration Patterns
```javascript
describe('RecommendCommand collaboration', () => {
  it('should coordinate with analyzer, ranker, and formatter', async () => {
    const mockAnalyzer = { analyze: vi.fn().mockResolvedValue({ gaps: [] }) }
    const mockRanker = { rank: vi.fn().mockReturnValue([]) }
    const mockFormatter = { format: vi.fn().mockReturnValue('') }

    const command = new RecommendCommand(mockAnalyzer, mockRanker, mockFormatter)
    await command.execute({ cliPath: 'app.js' })

    // Verify the conversation between objects
    const analysisResult = mockAnalyzer.analyze.mock.results[0].value
    expect(mockRanker.rank).toHaveBeenCalledWith(analysisResult)

    const rankings = mockRanker.rank.mock.results[0].value
    expect(mockFormatter.format).toHaveBeenCalledWith(rankings)
  })
})
```

---

## 4. Recommended Testing Patterns

### 4.1 Test Data Builders

**Create fluent builders for complex test data:**

```javascript
// test/unit/helpers/test-builders.mjs

export class AnalysisResultBuilder {
  constructor() {
    this.data = {
      metadata: {
        cliPath: 'src/cli.mjs',
        timestamp: new Date().toISOString(),
        analysisMethod: 'AST-based'
      },
      summary: {
        commands: 7,
        subcommands: 6,
        tested: 4
      },
      commands: [],
      gaps: []
    }
  }

  withCliPath(path) {
    this.data.metadata.cliPath = path
    return this
  }

  withCommand(name, description, tested = false) {
    this.data.commands.push({ name, description, tested })
    if (!tested) {
      this.data.gaps.push(name)
    }
    return this
  }

  withHighCoverage() {
    this.data.summary.tested = this.data.summary.commands
    this.data.gaps = []
    return this
  }

  build() {
    return this.data
  }
}

// Usage in tests
describe('ReportGenerator', () => {
  it('should highlight gaps in low-coverage scenario', () => {
    const analysisResult = new AnalysisResultBuilder()
      .withCliPath('test-cli.js')
      .withCommand('help', 'Show help', true)
      .withCommand('version', 'Show version', false)
      .withCommand('run', 'Run command', false)
      .build()

    const report = generator.generate(analysisResult)

    expect(report).toContain('Coverage: 33%')
    expect(report).toContain('Untested: version, run')
  })
})
```

### 4.2 Mock Factories

**Centralize mock creation for consistency:**

```javascript
// test/unit/helpers/mock-factories.mjs

export const MockFactories = {
  createMockAnalyzer(overrides = {}) {
    return {
      analyze: vi.fn().mockResolvedValue({
        coverage: 85,
        gaps: [],
        commands: [],
        ...overrides
      }),
      validate: vi.fn().mockReturnValue(true),
      ...overrides
    }
  },

  createMockContainer(overrides = {}) {
    return {
      exec: vi.fn().mockResolvedValue({
        exitCode: 0,
        output: 'success',
        stderr: ''
      }),
      stop: vi.fn().mockResolvedValue(undefined),
      start: vi.fn().mockResolvedValue(undefined),
      ...overrides
    }
  },

  createMockFileSystem(files = {}) {
    return {
      readFileSync: vi.fn((path) => files[path] || ''),
      writeFileSync: vi.fn(),
      existsSync: vi.fn((path) => path in files),
      readdirSync: vi.fn(() => Object.keys(files))
    }
  }
}

// Usage
describe('DiscoverCommand', () => {
  it('should discover commands from AST', async () => {
    const mockAnalyzer = MockFactories.createMockAnalyzer({
      analyze: vi.fn().mockResolvedValue({
        commands: ['help', 'version', 'run']
      })
    })

    const command = new DiscoverCommand(mockAnalyzer)
    const result = await command.execute({ cliPath: 'app.js' })

    expect(result.commands).toHaveLength(3)
  })
})
```

### 4.3 Object Mothers (Fixtures)

**Pre-configured test objects for common scenarios:**

```javascript
// test/unit/helpers/fixtures.mjs

export const Fixtures = {
  // Typical CLI structure
  standardCliStructure: {
    commands: [
      { name: 'help', description: 'Show help', tested: true },
      { name: 'version', description: 'Show version', tested: true },
      { name: 'run', description: 'Run command', tested: false }
    ],
    globalOptions: [
      { name: '--json', description: 'JSON output' },
      { name: '--verbose', description: 'Verbose mode' }
    ]
  },

  // High coverage scenario
  highCoverageResult: {
    metadata: { cliPath: 'src/cli.mjs', analysisMethod: 'AST-based' },
    summary: { commands: 10, subcommands: 5, tested: 14, coverage: 93.3 },
    gaps: ['info']
  },

  // Low coverage scenario
  lowCoverageResult: {
    metadata: { cliPath: 'src/cli.mjs', analysisMethod: 'AST-based' },
    summary: { commands: 10, subcommands: 5, tested: 5, coverage: 33.3 },
    gaps: ['gen', 'runner', 'analysis', 'test', 'info']
  },

  // Error scenarios
  invalidCliPath: '/nonexistent/cli.js',
  emptyCliFile: ''
}
```

### 4.4 Contract Testing

**Define and verify component interfaces:**

```javascript
// test/contract/runner-contract.test.mjs

/**
 * Contract: All runners must implement this interface
 */
export const RunnerContract = {
  // Methods
  runCommand: {
    params: ['args: string[]', 'options?: RunOptions'],
    returns: 'Promise<RunResult>',
    throws: ['RunnerError', 'TimeoutError']
  },

  setup: {
    params: ['options?: SetupOptions'],
    returns: 'Promise<void>',
    throws: ['SetupError']
  },

  teardown: {
    params: [],
    returns: 'Promise<void>',
    throws: ['TeardownError']
  }
}

describe('LocalRunner contract compliance', () => {
  const runner = new LocalRunner()

  it('should implement runCommand with correct signature', async () => {
    const result = await runner.runCommand(['--help'], { timeout: 5000 })

    expect(result).toHaveProperty('exitCode')
    expect(result).toHaveProperty('stdout')
    expect(result).toHaveProperty('stderr')
    expect(result).toHaveProperty('durationMs')
  })

  it('should throw RunnerError when command fails', async () => {
    await expect(runner.runCommand(['invalid'], { timeout: 100 }))
      .rejects.toThrow(expect.objectContaining({
        name: 'RunnerError',
        exitCode: expect.any(Number)
      }))
  })
})

describe('CleanroomRunner contract compliance', () => {
  // Same tests to verify both runners comply with contract
})
```

---

## 5. Test Refactoring Plan (80/20 Prioritized)

### Phase 1: Foundation (Weeks 1-2) - 80% Impact

#### 1.1 Create Test Infrastructure
**Effort:** 2 days
**Impact:** Enables all future testing

**Tasks:**
- [ ] Create `test/unit/helpers/mock-factories.mjs`
- [ ] Create `test/unit/helpers/test-builders.mjs`
- [ ] Create `test/unit/helpers/fixtures.mjs`
- [ ] Document mock patterns in `docs/testing-patterns.md`

**Deliverables:**
```javascript
// mock-factories.mjs (150 lines)
// test-builders.mjs (200 lines)
// fixtures.mjs (100 lines)
```

#### 1.2 Fix Failing Unit Tests
**Effort:** 1 day
**Impact:** Build confidence in test suite

**Tasks:**
- [ ] Fix `local-runner.test.mjs` mock configuration
- [ ] Separate unit tests from integration tests
- [ ] Add proper mock isolation

**Current Failures:**
```
❌ should execute command successfully
❌ should handle process errors
❌ should handle timeout
❌ should pass environment variables
❌ should execute multiple commands concurrently
```

**Solution:**
```javascript
// test/unit/core/runners/local-runner.test.mjs

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MockFactories } from '../../helpers/mock-factories.mjs'

// Mock child_process before importing runner
vi.mock('node:child_process', () => ({
  execSync: vi.fn()
}))

import { runLocalCitty } from '../../../../src/core/runners/local-runner.js'
import { execSync } from 'node:child_process'

describe('LocalRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Configure mock to return expected values
    execSync.mockReturnValue('Mock output')
  })

  it('should execute command successfully', async () => {
    const result = await runLocalCitty(['--help'])

    expect(result.result.exitCode).toBe(0)
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('--help'),
      expect.any(Object)
    )
  })
})
```

#### 1.3 Add High-Priority Command Tests
**Effort:** 3 days
**Impact:** Test the most-used features

**Priority Commands (by usage):**
1. `analysis/discover.js` - Core feature
2. `analysis/analyze.js` - Core feature
3. `analysis/recommend.js` - High value
4. `gen/scenario.js` - High usage
5. `test/run.js` - Critical path

**Template:**
```javascript
// test/unit/commands/analysis/discover.test.mjs

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MockFactories } from '../../../helpers/mock-factories.mjs'

describe('DiscoverCommand', () => {
  let mockAnalyzer
  let mockReporter
  let command

  beforeEach(() => {
    mockAnalyzer = MockFactories.createMockAnalyzer()
    mockReporter = MockFactories.createMockReporter()
    command = new DiscoverCommand(mockAnalyzer, mockReporter)
  })

  describe('execute()', () => {
    it('should discover CLI structure when valid path provided', async () => {
      mockAnalyzer.analyze.mockResolvedValue({
        commands: ['help', 'version'],
        subcommands: []
      })

      await command.execute({ cliPath: 'src/cli.mjs', format: 'text' })

      expect(mockAnalyzer.analyze).toHaveBeenCalledWith('src/cli.mjs')
      expect(mockReporter.generateReport).toHaveBeenCalledWith(
        expect.objectContaining({
          commands: ['help', 'version']
        }),
        'text'
      )
    })

    it('should use JSON format when requested', async () => {
      await command.execute({ cliPath: 'src/cli.mjs', format: 'json' })

      expect(mockReporter.generateReport).toHaveBeenCalledWith(
        expect.any(Object),
        'json'
      )
    })

    it('should handle analyzer errors gracefully', async () => {
      mockAnalyzer.analyze.mockRejectedValue(new Error('Parse failed'))

      await expect(command.execute({ cliPath: 'bad.js' }))
        .rejects.toThrow('Parse failed')

      expect(mockReporter.generateReport).not.toHaveBeenCalled()
    })
  })
})
```

### Phase 2: Core Coverage (Weeks 3-4) - 15% Impact

#### 2.1 Test Coverage Analysis Layer
**Effort:** 3 days

**Files to test:**
- `ast-cli-analyzer.js`
- `enhanced-ast-cli-analyzer.js`
- `test-discovery.js`
- `command-discovery.js`

#### 2.2 Test Utils Layer
**Effort:** 2 days

**Files to test:**
- `smart-cli-detector.js`
- `environment-detection.js`
- `context-manager.js`
- `analysis-report-utils.js`

#### 2.3 Remaining Commands
**Effort:** 4 days

**Files to test:**
- All `gen/*` commands
- All `info/*` commands
- All `runner/*` commands
- Remaining `test/*` commands

### Phase 3: Polish & Performance (Week 5) - 5% Impact

#### 3.1 Contract Tests
**Effort:** 2 days

- Define and test runner contract
- Define and test analyzer contract
- Define and test command contract

#### 3.2 Performance Tests
**Effort:** 2 days

- CLI startup time benchmarks
- Analysis performance tests
- Concurrent execution performance

#### 3.3 Mutation Testing
**Effort:** 1 day

- Install and configure Stryker
- Run mutation tests on core logic
- Fix survivor mutations

---

## 6. Example Test Cases (Best Practices)

### 6.1 Command Layer Test (London School)

```javascript
// test/unit/commands/analysis/analyze.test.mjs

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AnalysisResultBuilder } from '../../../helpers/test-builders.mjs'
import { MockFactories } from '../../../helpers/mock-factories.mjs'

describe('AnalyzeCommand', () => {
  let mockCoverageAnalyzer
  let mockTestDiscovery
  let mockReporter
  let command

  beforeEach(() => {
    // Arrange: Create all mocks
    mockCoverageAnalyzer = MockFactories.createMockAnalyzer()
    mockTestDiscovery = {
      findTests: vi.fn().mockResolvedValue([
        'test/integration/cli.test.mjs',
        'test/unit/runner.test.mjs'
      ])
    }
    mockReporter = {
      generateReport: vi.fn().mockReturnValue('Coverage: 85%'),
      checkThreshold: vi.fn().mockReturnValue({ passed: true, message: '' })
    }

    // Inject dependencies (dependency injection principle)
    command = new AnalyzeCommand(
      mockCoverageAnalyzer,
      mockTestDiscovery,
      mockReporter
    )
  })

  describe('execute()', () => {
    it('should analyze CLI coverage and generate report', async () => {
      // Arrange
      const analysisResult = new AnalysisResultBuilder()
        .withCliPath('src/cli.mjs')
        .withHighCoverage()
        .build()

      mockCoverageAnalyzer.analyze.mockResolvedValue(analysisResult)

      // Act
      const result = await command.execute({
        cliPath: 'src/cli.mjs',
        testDir: 'test',
        format: 'text'
      })

      // Assert: Verify collaborations (London School)
      expect(mockTestDiscovery.findTests).toHaveBeenCalledWith('test')
      expect(mockCoverageAnalyzer.analyze).toHaveBeenCalledWith(
        'src/cli.mjs',
        expect.arrayContaining(['test/integration/cli.test.mjs'])
      )
      expect(mockReporter.generateReport).toHaveBeenCalledWith(
        analysisResult,
        'text'
      )

      // Assert: Verify result
      expect(result.success).toBe(true)
      expect(result.report).toBe('Coverage: 85%')
    })

    it('should fail when coverage below threshold', async () => {
      // Arrange
      mockReporter.checkThreshold.mockReturnValue({
        passed: false,
        message: 'Coverage 45% below threshold 80%'
      })

      // Act
      const result = await command.execute({
        cliPath: 'src/cli.mjs',
        testDir: 'test',
        threshold: 80
      })

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toContain('below threshold')
    })

    it('should handle missing CLI file gracefully', async () => {
      // Arrange
      mockCoverageAnalyzer.analyze.mockRejectedValue(
        new Error('ENOENT: no such file')
      )

      // Act & Assert
      await expect(command.execute({ cliPath: 'missing.js' }))
        .rejects.toThrow('ENOENT: no such file')
    })

    it('should discover tests before analyzing coverage', async () => {
      // Act
      await command.execute({ cliPath: 'src/cli.mjs', testDir: 'test' })

      // Assert: Verify call order (interaction testing)
      expect(mockTestDiscovery.findTests).toHaveBeenCalledBefore(
        mockCoverageAnalyzer.analyze
      )
    })
  })

  describe('validateOptions()', () => {
    it('should accept valid options', () => {
      const options = {
        cliPath: 'src/cli.mjs',
        testDir: 'test',
        format: 'text'
      }

      expect(() => command.validateOptions(options)).not.toThrow()
    })

    it('should reject missing cliPath', () => {
      expect(() => command.validateOptions({ testDir: 'test' }))
        .toThrow('cliPath is required')
    })

    it('should use default format when not specified', () => {
      const validated = command.validateOptions({ cliPath: 'app.js' })
      expect(validated.format).toBe('text')
    })
  })
})
```

### 6.2 Core Logic Test (Behavior Verification)

```javascript
// test/unit/core/coverage/ast-cli-analyzer.test.mjs

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MockFactories } from '../../../helpers/mock-factories.mjs'
import { Fixtures } from '../../../helpers/fixtures.mjs'

describe('AstCliAnalyzer', () => {
  let mockParser
  let mockFileSystem
  let analyzer

  beforeEach(() => {
    mockParser = {
      parse: vi.fn().mockReturnValue({
        type: 'Program',
        body: []
      }),
      extractCommands: vi.fn().mockReturnValue([])
    }

    mockFileSystem = MockFactories.createMockFileSystem({
      'src/cli.mjs': 'export default { commands: {} }'
    })

    analyzer = new AstCliAnalyzer(mockParser, mockFileSystem)
  })

  describe('analyze()', () => {
    it('should parse CLI file and extract commands', async () => {
      // Arrange
      mockParser.extractCommands.mockReturnValue([
        { name: 'help', description: 'Show help' },
        { name: 'version', description: 'Show version' }
      ])

      // Act
      const result = await analyzer.analyze('src/cli.mjs')

      // Assert: Verify the conversation between collaborators
      expect(mockFileSystem.readFileSync).toHaveBeenCalledWith('src/cli.mjs', 'utf8')

      const fileContent = mockFileSystem.readFileSync.mock.results[0].value
      expect(mockParser.parse).toHaveBeenCalledWith(fileContent)

      const ast = mockParser.parse.mock.results[0].value
      expect(mockParser.extractCommands).toHaveBeenCalledWith(ast)

      expect(result.commands).toEqual([
        { name: 'help', description: 'Show help' },
        { name: 'version', description: 'Show version' }
      ])
    })

    it('should handle parse errors by wrapping in AnalysisError', async () => {
      // Arrange
      mockParser.parse.mockImplementation(() => {
        throw new SyntaxError('Unexpected token')
      })

      // Act & Assert
      await expect(analyzer.analyze('bad.js'))
        .rejects.toThrow(expect.objectContaining({
          name: 'AnalysisError',
          message: expect.stringContaining('Unexpected token')
        }))

      // Verify parser was called (even though it failed)
      expect(mockParser.parse).toHaveBeenCalled()
      expect(mockParser.extractCommands).not.toHaveBeenCalled()
    })

    it('should cache analysis results for same file', async () => {
      // Act
      await analyzer.analyze('src/cli.mjs')
      await analyzer.analyze('src/cli.mjs')

      // Assert: File should only be read once (caching behavior)
      expect(mockFileSystem.readFileSync).toHaveBeenCalledTimes(1)
      expect(mockParser.parse).toHaveBeenCalledTimes(1)
    })
  })
})
```

### 6.3 Runner Test (Isolation & Mocking)

```javascript
// test/unit/core/runners/cleanroom-runner.test.mjs

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MockFactories } from '../../../helpers/mock-factories.mjs'

describe('CleanroomRunner', () => {
  let mockContainerFactory
  let mockHealthChecker
  let mockContainer
  let runner

  beforeEach(() => {
    // Arrange: Mock all external dependencies
    mockContainer = MockFactories.createMockContainer()

    mockContainerFactory = {
      create: vi.fn().mockResolvedValue(mockContainer)
    }

    mockHealthChecker = {
      verify: vi.fn().mockResolvedValue(true)
    }

    // NO SINGLETON - each test gets fresh instance
    runner = new CleanroomRunner(mockContainerFactory, mockHealthChecker)
  })

  afterEach(() => {
    // Clean up (no singleton to worry about)
    vi.clearAllMocks()
  })

  describe('setup()', () => {
    it('should create container and verify health', async () => {
      // Act
      await runner.setup({ nodeImage: 'node:20-alpine' })

      // Assert: Verify collaboration
      expect(mockContainerFactory.create).toHaveBeenCalledWith({
        nodeImage: 'node:20-alpine'
      })
      expect(mockHealthChecker.verify).toHaveBeenCalledWith(mockContainer)
    })

    it('should fail when container health check fails', async () => {
      // Arrange
      mockHealthChecker.verify.mockResolvedValue(false)

      // Act & Assert
      await expect(runner.setup())
        .rejects.toThrow('Container failed health check')

      // Verify cleanup happened
      expect(mockContainer.stop).toHaveBeenCalled()
    })
  })

  describe('runCommand()', () => {
    beforeEach(async () => {
      await runner.setup()
    })

    it('should verify health before executing command', async () => {
      // Act
      await runner.runCommand(['--help'])

      // Assert: Verify interaction order
      expect(mockHealthChecker.verify).toHaveBeenCalledBefore(mockContainer.exec)
    })

    it('should not execute when container is unhealthy', async () => {
      // Arrange
      mockHealthChecker.verify.mockResolvedValue(false)

      // Act & Assert
      await expect(runner.runCommand(['--help']))
        .rejects.toThrow('Container is unhealthy')

      expect(mockContainer.exec).not.toHaveBeenCalled()
    })

    it('should pass command args and options to container', async () => {
      // Act
      await runner.runCommand(['gen', 'project'], {
        cwd: '/app',
        env: { NODE_ENV: 'test' },
        timeout: 5000
      })

      // Assert
      expect(mockContainer.exec).toHaveBeenCalledWith(
        ['gen', 'project'],
        expect.objectContaining({
          workdir: '/app',
          env: expect.objectContaining({ NODE_ENV: 'test' })
        })
      )
    })

    it('should handle command timeout gracefully', async () => {
      // Arrange
      mockContainer.exec.mockImplementation(() =>
        new Promise((resolve) => setTimeout(resolve, 10000))
      )

      // Act & Assert
      await expect(runner.runCommand(['sleep', '100'], { timeout: 100 }))
        .rejects.toThrow('Command timed out')
    })
  })

  describe('teardown()', () => {
    it('should stop container after verifying health', async () => {
      await runner.setup()

      // Act
      await runner.teardown()

      // Assert
      expect(mockHealthChecker.verify).toHaveBeenCalledBefore(mockContainer.stop)
      expect(mockContainer.stop).toHaveBeenCalled()
    })

    it('should throw when container unhealthy during teardown', async () => {
      await runner.setup()
      mockHealthChecker.verify.mockResolvedValue(false)

      // Act & Assert
      await expect(runner.teardown())
        .rejects.toThrow('Container was already unhealthy')
    })
  })
})
```

---

## 7. Testing Utilities to Create

### 7.1 Mock Factories (`test/unit/helpers/mock-factories.mjs`)

```javascript
import { vi } from 'vitest'

export const MockFactories = {
  // Core mocks
  createMockAnalyzer(overrides = {}) {
    return {
      analyze: vi.fn().mockResolvedValue({
        commands: [],
        subcommands: [],
        coverage: 0,
        gaps: []
      }),
      validate: vi.fn().mockReturnValue(true),
      ...overrides
    }
  },

  createMockReporter(overrides = {}) {
    return {
      generateReport: vi.fn().mockReturnValue('Mock Report'),
      format: vi.fn().mockReturnValue('Formatted Report'),
      checkThreshold: vi.fn().mockReturnValue({ passed: true, message: '' }),
      ...overrides
    }
  },

  createMockExporter(overrides = {}) {
    return {
      export: vi.fn().mockResolvedValue({ success: true, path: '/tmp/export.json' }),
      validate: vi.fn().mockReturnValue(true),
      ...overrides
    }
  },

  createMockContainer(overrides = {}) {
    return {
      exec: vi.fn().mockResolvedValue({
        exitCode: 0,
        output: 'success',
        stderr: ''
      }),
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      ...overrides
    }
  },

  createMockFileSystem(files = {}) {
    return {
      readFileSync: vi.fn((path) => {
        if (path in files) return files[path]
        throw new Error(`ENOENT: no such file '${path}'`)
      }),
      writeFileSync: vi.fn(),
      existsSync: vi.fn((path) => path in files),
      readdirSync: vi.fn(() => Object.keys(files)),
      mkdirSync: vi.fn(),
      statSync: vi.fn((path) => ({
        isDirectory: () => false,
        isFile: () => true
      }))
    }
  },

  createMockParser(overrides = {}) {
    return {
      parse: vi.fn().mockReturnValue({ type: 'Program', body: [] }),
      extractCommands: vi.fn().mockReturnValue([]),
      extractOptions: vi.fn().mockReturnValue([]),
      ...overrides
    }
  }
}
```

### 7.2 Test Builders (`test/unit/helpers/test-builders.mjs`)

```javascript
export class AnalysisResultBuilder {
  constructor() {
    this.data = {
      metadata: {
        cliPath: 'src/cli.mjs',
        testDir: 'test',
        timestamp: new Date().toISOString(),
        analysisMethod: 'AST-based'
      },
      summary: {
        commands: 0,
        subcommands: 0,
        tested: 0,
        coverage: 0
      },
      commands: [],
      gaps: [],
      recommendations: []
    }
  }

  withCliPath(path) {
    this.data.metadata.cliPath = path
    return this
  }

  withCommand(name, description, tested = false) {
    this.data.commands.push({ name, description, tested })
    this.data.summary.commands++
    if (tested) {
      this.data.summary.tested++
    } else {
      this.data.gaps.push(name)
    }
    this._recalculateCoverage()
    return this
  }

  withSubcommand(parent, name, description, tested = false) {
    const fullName = `${parent} ${name}`
    this.data.commands.push({
      name: fullName,
      description,
      tested,
      parent
    })
    this.data.summary.subcommands++
    if (tested) {
      this.data.summary.tested++
    } else {
      this.data.gaps.push(fullName)
    }
    this._recalculateCoverage()
    return this
  }

  withHighCoverage() {
    this.data.summary.tested = this.data.summary.commands + this.data.summary.subcommands
    this.data.gaps = []
    this._recalculateCoverage()
    return this
  }

  withLowCoverage() {
    this.data.summary.tested = Math.floor((this.data.summary.commands + this.data.summary.subcommands) / 3)
    this._recalculateCoverage()
    return this
  }

  _recalculateCoverage() {
    const total = this.data.summary.commands + this.data.summary.subcommands
    this.data.summary.coverage = total > 0
      ? Math.round((this.data.summary.tested / total) * 100)
      : 0
  }

  build() {
    return this.data
  }
}

export class CommandResultBuilder {
  constructor() {
    this.data = {
      exitCode: 0,
      stdout: '',
      stderr: '',
      args: [],
      cwd: process.cwd(),
      durationMs: 100
    }
  }

  withExitCode(code) {
    this.data.exitCode = code
    return this
  }

  withStdout(output) {
    this.data.stdout = output
    return this
  }

  withStderr(error) {
    this.data.stderr = error
    return this
  }

  withArgs(...args) {
    this.data.args = args
    return this
  }

  success() {
    this.data.exitCode = 0
    return this
  }

  failure(message = 'Command failed') {
    this.data.exitCode = 1
    this.data.stderr = message
    return this
  }

  build() {
    return this.data
  }
}
```

### 7.3 Fixtures (`test/unit/helpers/fixtures.mjs`)

```javascript
export const Fixtures = {
  // Standard CLI structures
  simpleCliStructure: {
    commands: [
      { name: 'help', description: 'Show help', tested: true },
      { name: 'version', description: 'Show version', tested: true }
    ],
    globalOptions: [
      { name: '--json', description: 'JSON output' },
      { name: '--verbose', description: 'Verbose mode' }
    ]
  },

  complexCliStructure: {
    commands: [
      {
        name: 'gen',
        description: 'Generate files',
        tested: false,
        subcommands: [
          { name: 'project', description: 'Generate project', tested: false },
          { name: 'test', description: 'Generate test', tested: true }
        ]
      },
      {
        name: 'analysis',
        description: 'Analyze CLI',
        tested: true,
        subcommands: [
          { name: 'discover', description: 'Discover commands', tested: true },
          { name: 'coverage', description: 'Check coverage', tested: true }
        ]
      }
    ]
  },

  // Coverage scenarios
  highCoverageAnalysis: {
    metadata: { cliPath: 'src/cli.mjs', coverage: 95.5 },
    summary: { commands: 20, tested: 19 },
    gaps: ['obscure-command']
  },

  lowCoverageAnalysis: {
    metadata: { cliPath: 'src/cli.mjs', coverage: 25.0 },
    summary: { commands: 20, tested: 5 },
    gaps: Array.from({ length: 15 }, (_, i) => `command-${i}`)
  },

  // File system fixtures
  mockCliFiles: {
    'src/cli.mjs': `
      export default {
        commands: {
          help: { description: 'Show help' },
          version: { description: 'Show version' }
        }
      }
    `,
    'test/integration/cli.test.mjs': `
      describe('CLI', () => {
        it('should show help', () => {})
      })
    `
  },

  // Error scenarios
  errors: {
    fileNotFound: new Error('ENOENT: no such file or directory'),
    parseError: new SyntaxError('Unexpected token'),
    timeoutError: new Error('Command timed out after 5000ms'),
    dockerNotAvailable: new Error('Docker daemon is not running')
  }
}
```

---

## 8. Continuous Testing Strategy

### 8.1 Pre-commit Hooks

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run unit tests (fast)
npm run test:unit

# Run linting
npm run lint
```

### 8.2 CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage

  integration-tests:
    runs-on: ubuntu-latest
    services:
      docker:
        image: docker:20.10.16
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:integration

  mutation-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:mutation
```

### 8.3 Test Metrics to Track

**Code Coverage:**
- Target: 80% unit test coverage for `src/commands/` and `src/core/`
- Minimum: 60% overall coverage

**Test Quality Metrics:**
- Test-to-code ratio: 1.5:1 (more test code than production code)
- Mutation score: >70% (mutations killed by tests)
- Test execution time: <30s for unit tests, <2min for integration tests

**London School Metrics:**
- Mock usage ratio: 80% of tests should use mocks
- Behavior verification: 60% of assertions should verify interactions
- Test isolation: 100% of unit tests should be runnable in any order

---

## 9. Implementation Checklist

### Week 1: Foundation
- [ ] Create mock factories (`mock-factories.mjs`)
- [ ] Create test builders (`test-builders.mjs`)
- [ ] Create fixtures (`fixtures.mjs`)
- [ ] Fix failing unit tests in `local-runner.test.mjs`
- [ ] Document testing patterns in `docs/testing-patterns.md`

### Week 2: High-Priority Commands
- [ ] Test `analysis/discover.js`
- [ ] Test `analysis/analyze.js`
- [ ] Test `analysis/recommend.js`
- [ ] Test `gen/scenario.js`
- [ ] Test `test/run.js`

### Week 3: Coverage Layer
- [ ] Test `ast-cli-analyzer.js`
- [ ] Test `enhanced-ast-cli-analyzer.js`
- [ ] Test `test-discovery.js`
- [ ] Test `command-discovery.js`

### Week 4: Utils & Remaining Commands
- [ ] Test all utility modules
- [ ] Test remaining command modules
- [ ] Achieve 80% coverage target

### Week 5: Polish
- [ ] Add contract tests
- [ ] Add performance benchmarks
- [ ] Set up mutation testing
- [ ] Document all patterns

---

## 10. Success Metrics

### Definition of Done
1. **Coverage:** 80% unit test coverage for commands and core
2. **Quality:** All tests follow London School TDD principles
3. **Stability:** Zero failing tests in CI
4. **Performance:** Unit tests run in <30 seconds
5. **Documentation:** All patterns documented with examples
6. **Maintainability:** Shared mock factories and builders reduce duplication

### Key Performance Indicators (KPIs)
- **Test Quality Score:** Increase from 6.5/10 to 9/10
- **Mock Usage:** 80% of tests use mocks appropriately
- **Test Isolation:** 100% of unit tests can run independently
- **Coverage:** 80% code coverage in commands and core
- **Mutation Score:** >70% mutations killed

---

## Appendix A: Testing Anti-Patterns to Avoid

### ❌ Don't: Mix Integration and Unit Tests
```javascript
// BAD: Unit test executing real file system
describe('Analyzer', () => {
  it('should analyze CLI', async () => {
    const analyzer = new Analyzer()
    const result = await analyzer.analyze('src/cli.mjs') // Real file!
    expect(result.commands.length).toBeGreaterThan(0)
  })
})
```

### ✅ Do: Mock External Dependencies
```javascript
// GOOD: Mock file system
describe('Analyzer', () => {
  it('should analyze CLI', async () => {
    const mockFs = MockFactories.createMockFileSystem({
      'src/cli.mjs': 'export default { commands: {} }'
    })
    const analyzer = new Analyzer(mockFs)
    const result = await analyzer.analyze('src/cli.mjs')
    expect(mockFs.readFileSync).toHaveBeenCalledWith('src/cli.mjs')
  })
})
```

### ❌ Don't: Test Implementation Details
```javascript
// BAD: Testing internal state
it('should set _cache property', () => {
  analyzer.analyze('file.js')
  expect(analyzer._cache).toBeDefined() // Private implementation!
})
```

### ✅ Do: Test Behavior
```javascript
// GOOD: Test observable behavior
it('should cache analysis results', async () => {
  await analyzer.analyze('file.js')
  await analyzer.analyze('file.js')
  expect(mockFs.readFileSync).toHaveBeenCalledTimes(1) // Behavior!
})
```

### ❌ Don't: Use Shared State
```javascript
// BAD: Singleton state
let globalContainer // Shared across tests!

describe('Runner', () => {
  beforeAll(() => {
    globalContainer = createContainer()
  })
})
```

### ✅ Do: Isolate Test State
```javascript
// GOOD: Fresh state per test
describe('Runner', () => {
  let container

  beforeEach(() => {
    container = createContainer() // New instance!
  })
})
```

---

## Appendix B: Resources

### London School TDD
- [Growing Object-Oriented Software Guided by Tests](https://www.goodreads.com/book/show/4268826-growing-object-oriented-software-guided-by-tests) - Steve Freeman & Nat Pryce
- [London School TDD vs Chicago School](https://github.com/testdouble/contributing-tests/wiki/London-school-TDD) - Test Double

### Vitest Testing
- [Vitest Documentation](https://vitest.dev/)
- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)

### Testing Patterns
- [xUnit Test Patterns](http://xunitpatterns.com/) - Gerard Meszaros
- [Test Builders](https://wiki.c2.com/?TestDataBuilder) - C2 Wiki

---

**Document Version:** 1.0
**Last Updated:** 2025-10-02
**Author:** TDD-London-Swarm Agent
**Status:** Ready for Implementation
