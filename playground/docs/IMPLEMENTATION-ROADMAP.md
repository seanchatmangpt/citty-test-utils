# AST Analyzer Implementation Roadmap

## Overview

This document provides a detailed implementation roadmap for fixing the citty-test-utils AST analyzer. The roadmap is organized into phases with specific deliverables, timelines, and success criteria.

## Current State Analysis

### What's Working
- ✅ Smart CLI Detection (perfect)
- ✅ Test file discovery
- ✅ Basic AST parsing
- ✅ Report generation framework

### What's Broken
- ❌ Command hierarchy detection (fundamental flaw)
- ❌ Test pattern recognition (maps to wrong commands)
- ❌ Coverage calculation (based on wrong structure)
- ❌ Analysis results (completely inaccurate)

## Implementation Phases

### Phase 1: Core Architecture Foundation (Week 1-2)

#### 1.1 Command Hierarchy Detection (Days 1-3)

**Deliverable:** `CommandHierarchyDetector` class

**Implementation:**
```javascript
// src/core/coverage/command-hierarchy-detector.js
export class CommandHierarchyDetector {
  constructor(options = {}) {
    this.options = options
  }
  
  async detectMainCommand(ast) {
    // Strategy 1: Look for exported default command
    const defaultExport = this.findDefaultExport(ast)
    if (defaultExport && this.isDefineCommand(defaultExport)) {
      return defaultExport
    }
    
    // Strategy 2: Look for main CLI variable
    const mainVariable = this.findMainCLIVariable(ast)
    if (mainVariable && this.isDefineCommand(mainVariable)) {
      return mainVariable
    }
    
    // Strategy 3: Look for largest defineCommand with subCommands
    const largestCommand = this.findLargestCommand(ast)
    if (largestCommand) {
      return largestCommand
    }
    
    throw new Error('Could not identify main command')
  }
  
  findDefaultExport(ast) {
    // Walk AST to find export default
  }
  
  findMainCLIVariable(ast) {
    // Walk AST to find main CLI variable
  }
  
  findLargestCommand(ast) {
    // Find command with most subcommands
  }
}
```

**Success Criteria:**
- [ ] Correctly identifies playground as main command
- [ ] Handles different CLI patterns (export default, variable, etc.)
- [ ] Provides clear error messages when main command not found

#### 1.2 Command Hierarchy Builder (Days 4-6)

**Deliverable:** `CommandHierarchyBuilder` class

**Implementation:**
```javascript
// src/core/coverage/command-hierarchy-builder.js
export class CommandHierarchyBuilder {
  constructor(options = {}) {
    this.options = options
  }
  
  buildHierarchy(mainCommandNode) {
    const hierarchy = {
      mainCommand: {
        name: this.extractCommandName(mainCommandNode),
        description: this.extractDescription(mainCommandNode),
        fullPath: this.extractCommandName(mainCommandNode),
        subcommands: new Map(),
        flags: new Map(),
        options: new Map(),
      },
      subcommands: new Map(),
      globalOptions: new Map(),
    }
    
    // Recursively build subcommand tree
    this.buildSubcommandTree(mainCommandNode, hierarchy)
    
    return hierarchy
  }
  
  buildSubcommandTree(commandNode, hierarchy, parentPath = '') {
    const subCommands = this.extractSubCommands(commandNode)
    
    for (const [subName, subCommand] of subCommands) {
      const fullPath = parentPath ? `${parentPath} ${subName}` : subName
      
      const subcommand = {
        name: subName,
        fullPath: fullPath,
        parentPath: parentPath,
        description: this.extractDescription(subCommand),
        subcommands: new Map(),
        flags: new Map(),
        options: new Map(),
      }
      
      hierarchy.subcommands.set(fullPath, subcommand)
      
      // Recursively handle nested subcommands
      if (this.hasSubCommands(subCommand)) {
        this.buildSubcommandTree(subCommand, hierarchy, fullPath)
      }
    }
  }
}
```

**Success Criteria:**
- [ ] Correctly builds playground command hierarchy
- [ ] Handles nested subcommands (math add, math multiply)
- [ ] Extracts flags and options correctly
- [ ] Provides clear hierarchy structure

#### 1.3 Basic Integration (Days 7-10)

**Deliverable:** Updated `EnhancedASTCLIAnalyzer`

**Implementation:**
```javascript
// src/core/coverage/enhanced-ast-cli-analyzer.js (updated)
export class EnhancedASTCLIAnalyzer {
  constructor(options = {}) {
    this.options = options
    this.hierarchyDetector = new CommandHierarchyDetector(options)
    this.hierarchyBuilder = new CommandHierarchyBuilder(options)
  }
  
  async discoverCLIStructureEnhanced(options) {
    const cliPath = options.cliPath || 'src/cli.mjs'
    const content = readFileSync(cliPath, 'utf8')
    const ast = this.parseJavaScriptFile(content, cliPath)
    
    // Step 1: Detect main command
    const mainCommand = await this.hierarchyDetector.detectMainCommand(ast)
    
    // Step 2: Build command hierarchy
    const cliHierarchy = this.hierarchyBuilder.buildHierarchy(mainCommand)
    
    return cliHierarchy
  }
}
```

**Success Criteria:**
- [ ] Integration works without errors
- [ ] Correctly identifies playground command structure
- [ ] Maintains backward compatibility where possible

### Phase 2: Test Pattern Recognition (Week 3)

#### 2.1 Test Pattern Recognizer (Days 1-3)

**Deliverable:** `TestPatternRecognizer` class

**Implementation:**
```javascript
// src/core/coverage/test-pattern-recognizer.js
export class TestPatternRecognizer {
  constructor(cliHierarchy) {
    this.cliHierarchy = cliHierarchy
  }
  
  recognizeTestPattern(testCallNode) {
    const commandArgs = this.extractCommandArguments(testCallNode)
    const commandPath = this.determineCommandPath(commandArgs)
    
    return {
      commandPath: commandPath,
      arguments: commandArgs,
      flags: this.extractFlags(commandArgs),
      options: this.extractOptions(commandArgs),
    }
  }
  
  determineCommandPath(commandArgs) {
    // Strategy 1: Direct subcommand (greet, math, error, info)
    if (commandArgs.length >= 1) {
      const firstArg = commandArgs[0]
      if (this.cliHierarchy.subcommands.has(`playground ${firstArg}`)) {
        return `playground ${firstArg}`
      }
    }
    
    // Strategy 2: Nested subcommand (math add, math multiply)
    if (commandArgs.length >= 2) {
      const firstArg = commandArgs[0]
      const secondArg = commandArgs[1]
      if (firstArg === 'math' && this.cliHierarchy.subcommands.has(`playground math ${secondArg}`)) {
        return `playground math ${secondArg}`
      }
    }
    
    // Strategy 3: Main command (playground)
    if (commandArgs.length === 0 || commandArgs[0] === '--help') {
      return 'playground'
    }
    
    return null
  }
}
```

**Success Criteria:**
- [ ] Correctly maps `['greet', 'Alice']` to `playground greet`
- [ ] Correctly maps `['math', 'add', '5', '3']` to `playground math add`
- [ ] Handles edge cases (help commands, invalid commands)

#### 2.2 Test Coverage Mapping (Days 4-6)

**Deliverable:** `TestCoverageMapper` class

**Implementation:**
```javascript
// src/core/coverage/test-coverage-mapper.js
export class TestCoverageMapper {
  mapTestCoverage(testPatterns, cliHierarchy) {
    const coverage = {
      mainCommand: {
        tested: false,
        testFiles: [],
      },
      subcommands: new Map(),
      flags: new Map(),
      options: new Map(),
    }
    
    // Map main command coverage
    if (testPatterns.has('playground')) {
      coverage.mainCommand.tested = true
      coverage.mainCommand.testFiles = testPatterns.get('playground').testFiles
    }
    
    // Map subcommand coverage
    for (const [subPath, subcommand] of cliHierarchy.subcommands) {
      if (testPatterns.has(subPath)) {
        coverage.subcommands.set(subPath, {
          tested: true,
          testFiles: testPatterns.get(subPath).testFiles,
        })
      } else {
        coverage.subcommands.set(subPath, {
          tested: false,
          testFiles: [],
        })
      }
    }
    
    return coverage
  }
}
```

**Success Criteria:**
- [ ] Correctly maps test coverage to command hierarchy
- [ ] Identifies which commands are tested vs untested
- [ ] Provides test file information for each command

#### 2.3 Integration with Analysis Pipeline (Days 7-10)

**Deliverable:** Updated analysis pipeline

**Implementation:**
```javascript
// Update EnhancedASTCLIAnalyzer
async analyze(options = {}) {
  // Step 1: Detect main command and build hierarchy
  const cliHierarchy = await this.discoverCLIStructureEnhanced(options)
  
  // Step 2: Initialize test recognizer with hierarchy
  this.testRecognizer = new TestPatternRecognizer(cliHierarchy)
  
  // Step 3: Analyze test patterns
  const testPatterns = await this.analyzeTestPatterns(cliHierarchy)
  
  // Step 4: Map test coverage
  const testCoverage = this.mapTestCoverage(testPatterns, cliHierarchy)
  
  // Step 5: Calculate coverage
  const coverage = this.calculateCoverage(testCoverage, cliHierarchy)
  
  // Step 6: Generate report
  const report = this.generateReport(cliHierarchy, testCoverage, coverage)
  
  return report
}
```

**Success Criteria:**
- [ ] Complete analysis pipeline works
- [ ] Test patterns are correctly recognized
- [ ] Coverage is correctly mapped

### Phase 3: Coverage Calculation (Week 4)

#### 3.1 Coverage Calculator (Days 1-3)

**Deliverable:** `CoverageCalculator` class

**Implementation:**
```javascript
// src/core/coverage/coverage-calculator.js
export class CoverageCalculator {
  calculateCoverage(testCoverage, cliHierarchy) {
    const stats = {
      mainCommand: {
        tested: testCoverage.mainCommand.tested ? 1 : 0,
        total: 1,
        percentage: testCoverage.mainCommand.tested ? 100 : 0,
      },
      subcommands: {
        tested: 0,
        total: cliHierarchy.subcommands.size,
        percentage: 0,
      },
      flags: {
        tested: 0,
        total: 0,
        percentage: 0,
      },
      options: {
        tested: 0,
        total: 0,
        percentage: 0,
      },
    }
    
    // Calculate subcommand coverage
    for (const [subPath, coverage] of testCoverage.subcommands) {
      if (coverage.tested) {
        stats.subcommands.tested++
      }
    }
    
    stats.subcommands.percentage = stats.subcommands.total > 0 
      ? (stats.subcommands.tested / stats.subcommands.total) * 100 
      : 0
    
    // Calculate overall coverage
    const totalItems = stats.mainCommand.total + stats.subcommands.total + stats.flags.total + stats.options.total
    const totalTested = stats.mainCommand.tested + stats.subcommands.tested + stats.flags.tested + stats.options.tested
    const overallPercentage = totalItems > 0 ? (totalTested / totalItems) * 100 : 0
    
    stats.overall = {
      tested: totalTested,
      total: totalItems,
      percentage: overallPercentage,
    }
    
    return stats
  }
}
```

**Success Criteria:**
- [ ] Calculates accurate coverage percentages
- [ ] Shows 100% coverage for playground (correct)
- [ ] Handles edge cases (no tests, partial coverage)

#### 3.2 Report Generation Update (Days 4-6)

**Deliverable:** Updated report generation

**Implementation:**
```javascript
// Update report generation methods
generateTextReport(report, options) {
  const lines = []
  
  lines.push('🚀 Enhanced AST-Based CLI Test Coverage Analysis')
  lines.push('='.repeat(60))
  lines.push('')
  
  // Summary with correct hierarchy
  lines.push('📈 Summary:')
  lines.push(`  Main Command: ${report.coverage.summary.mainCommand.tested}/${report.coverage.summary.mainCommand.total} (${report.coverage.summary.mainCommand.percentage.toFixed(1)}%)`)
  lines.push(`  Subcommands: ${report.coverage.summary.subcommands.tested}/${report.coverage.summary.subcommands.total} (${report.coverage.summary.subcommands.percentage.toFixed(1)}%)`)
  lines.push(`  Overall: ${report.coverage.summary.overall.tested}/${report.coverage.summary.overall.total} (${report.coverage.summary.overall.percentage.toFixed(1)}%)`)
  lines.push('')
  
  // Command hierarchy display
  lines.push('📋 Command Hierarchy:')
  lines.push(`  ${report.cliHierarchy.mainCommand.name}: ${report.cliHierarchy.mainCommand.description}`)
  
  for (const [subPath, subcommand] of report.cliHierarchy.subcommands) {
    const status = subcommand.tested ? '✅' : '❌'
    lines.push(`    ${status} ${subPath}: ${subcommand.description}`)
  }
  
  return lines.join('\n')
}
```

**Success Criteria:**
- [ ] Reports show correct command hierarchy
- [ ] Coverage percentages are accurate
- [ ] Reports are clear and actionable

#### 3.3 Integration Testing (Days 7-10)

**Deliverable:** Complete integration testing

**Implementation:**
```javascript
// test/integration/ast-analyzer-fix.test.mjs
import { describe, it, expect } from 'vitest'
import { EnhancedASTCLIAnalyzer } from '../../src/core/coverage/enhanced-ast-cli-analyzer.js'

describe('AST Analyzer Fix Integration', () => {
  it('should correctly analyze playground CLI', async () => {
    const analyzer = new EnhancedASTCLIAnalyzer({
      cliPath: 'playground/src/cli.mjs',
      testDir: 'playground/test',
      verbose: true,
    })
    
    const result = await analyzer.analyze()
    
    // Verify main command
    expect(result.cliHierarchy.mainCommand.name).toBe('playground')
    
    // Verify subcommands
    expect(result.cliHierarchy.subcommands.has('playground greet')).toBe(true)
    expect(result.cliHierarchy.subcommands.has('playground math')).toBe(true)
    expect(result.cliHierarchy.subcommands.has('playground math add')).toBe(true)
    expect(result.cliHierarchy.subcommands.has('playground math multiply')).toBe(true)
    expect(result.cliHierarchy.subcommands.has('playground error')).toBe(true)
    expect(result.cliHierarchy.subcommands.has('playground info')).toBe(true)
    
    // Verify coverage (should be 100%)
    expect(result.coverage.summary.overall.percentage).toBe(100)
  })
})
```

**Success Criteria:**
- [ ] All integration tests pass
- [ ] Playground analysis shows correct results
- [ ] Coverage percentages are accurate

### Phase 4: Testing & Validation (Week 5)

#### 4.1 Unit Tests (Days 1-3)

**Deliverable:** Comprehensive unit test suite

**Implementation:**
```javascript
// test/unit/command-hierarchy-detector.test.mjs
import { describe, it, expect } from 'vitest'
import { CommandHierarchyDetector } from '../../src/core/coverage/command-hierarchy-detector.js'

describe('CommandHierarchyDetector', () => {
  it('should detect main command from export default', async () => {
    const detector = new CommandHierarchyDetector()
    const ast = parseJavaScriptFile(`
      const playground = defineCommand({...})
      export default playground
    `)
    
    const mainCommand = await detector.detectMainCommand(ast)
    expect(mainCommand).toBeDefined()
  })
  
  it('should detect main command from variable', async () => {
    const detector = new CommandHierarchyDetector()
    const ast = parseJavaScriptFile(`
      const playground = defineCommand({...})
    `)
    
    const mainCommand = await detector.detectMainCommand(ast)
    expect(mainCommand).toBeDefined()
  })
})

// test/unit/command-hierarchy-builder.test.mjs
import { describe, it, expect } from 'vitest'
import { CommandHierarchyBuilder } from '../../src/core/coverage/command-hierarchy-builder.js'

describe('CommandHierarchyBuilder', () => {
  it('should build correct hierarchy for playground', () => {
    const builder = new CommandHierarchyBuilder()
    const mainCommandNode = parsePlaygroundCommand()
    
    const hierarchy = builder.buildHierarchy(mainCommandNode)
    
    expect(hierarchy.mainCommand.name).toBe('playground')
    expect(hierarchy.subcommands.has('playground greet')).toBe(true)
    expect(hierarchy.subcommands.has('playground math')).toBe(true)
    expect(hierarchy.subcommands.has('playground math add')).toBe(true)
    expect(hierarchy.subcommands.has('playground math multiply')).toBe(true)
  })
})

// test/unit/test-pattern-recognizer.test.mjs
import { describe, it, expect } from 'vitest'
import { TestPatternRecognizer } from '../../src/core/coverage/test-pattern-recognizer.js'

describe('TestPatternRecognizer', () => {
  it('should recognize playground greet command', () => {
    const hierarchy = createPlaygroundHierarchy()
    const recognizer = new TestPatternRecognizer(hierarchy)
    
    const testCall = parseTestCall("runLocalCitty(['greet', 'Alice'])")
    const pattern = recognizer.recognizeTestPattern(testCall)
    
    expect(pattern.commandPath).toBe('playground greet')
  })
  
  it('should recognize playground math add command', () => {
    const hierarchy = createPlaygroundHierarchy()
    const recognizer = new TestPatternRecognizer(hierarchy)
    
    const testCall = parseTestCall("runLocalCitty(['math', 'add', '5', '3'])")
    const pattern = recognizer.recognizeTestPattern(testCall)
    
    expect(pattern.commandPath).toBe('playground math add')
  })
})
```

**Success Criteria:**
- [ ] All unit tests pass
- [ ] Each component is thoroughly tested
- [ ] Edge cases are covered

#### 4.2 Integration Tests (Days 4-6)

**Deliverable:** Comprehensive integration test suite

**Implementation:**
```javascript
// test/integration/ast-analyzer-complete.test.mjs
import { describe, it, expect } from 'vitest'
import { EnhancedASTCLIAnalyzer } from '../../src/core/coverage/enhanced-ast-cli-analyzer.js'

describe('AST Analyzer Complete Integration', () => {
  it('should analyze playground CLI correctly', async () => {
    const analyzer = new EnhancedASTCLIAnalyzer({
      cliPath: 'playground/src/cli.mjs',
      testDir: 'playground/test',
      verbose: true,
    })
    
    const result = await analyzer.analyze()
    
    // Verify command structure
    expect(result.cliHierarchy.mainCommand.name).toBe('playground')
    expect(result.cliHierarchy.subcommands.size).toBe(6)
    
    // Verify test coverage
    expect(result.coverage.summary.mainCommand.percentage).toBe(100)
    expect(result.coverage.summary.subcommands.percentage).toBe(100)
    expect(result.coverage.summary.overall.percentage).toBe(100)
    
    // Verify specific commands are tested
    expect(result.testCoverage.subcommands.get('playground greet').tested).toBe(true)
    expect(result.testCoverage.subcommands.get('playground math add').tested).toBe(true)
    expect(result.testCoverage.subcommands.get('playground math multiply').tested).toBe(true)
    expect(result.testCoverage.subcommands.get('playground error').tested).toBe(true)
  })
  
  it('should handle other CLI patterns', async () => {
    // Test with different CLI structures
    const analyzer = new EnhancedASTCLIAnalyzer({
      cliPath: 'test/fixtures/simple-cli.mjs',
      testDir: 'test/fixtures/test',
    })
    
    const result = await analyzer.analyze()
    expect(result).toBeDefined()
  })
})
```

**Success Criteria:**
- [ ] All integration tests pass
- [ ] Playground analysis is correct
- [ ] Other CLI patterns work

#### 4.3 Validation & Documentation (Days 7-10)

**Deliverable:** Validation results and updated documentation

**Implementation:**
```javascript
// test/validation/playground-validation.test.mjs
import { describe, it, expect } from 'vitest'
import { EnhancedASTCLIAnalyzer } from '../../src/core/coverage/enhanced-ast-cli-analyzer.js'

describe('Playground Validation', () => {
  it('should show 100% coverage for playground', async () => {
    const analyzer = new EnhancedASTCLIAnalyzer({
      cliPath: 'playground/src/cli.mjs',
      testDir: 'playground/test',
    })
    
    const result = await analyzer.analyze()
    
    // This should be 100% because all commands are tested
    expect(result.coverage.summary.overall.percentage).toBe(100)
    
    // Verify all subcommands are tested
    for (const [subPath, coverage] of result.testCoverage.subcommands) {
      expect(coverage.tested).toBe(true)
    }
  })
  
  it('should provide accurate recommendations', async () => {
    const analyzer = new EnhancedASTCLIAnalyzer({
      cliPath: 'playground/src/cli.mjs',
      testDir: 'playground/test',
    })
    
    const result = await analyzer.analyze()
    
    // Should have no high-priority recommendations since everything is tested
    const highPriorityRecs = result.recommendations.filter(r => r.priority === 'high')
    expect(highPriorityRecs.length).toBe(0)
  })
})
```

**Success Criteria:**
- [ ] Playground shows 100% coverage (correct)
- [ ] No false recommendations
- [ ] Documentation is updated
- [ ] Results are validated manually

## Success Metrics

### Functional Metrics
- [ ] Playground analysis shows 100% coverage (vs current 26.1%)
- [ ] Command hierarchy is correctly identified
- [ ] Test patterns are correctly mapped
- [ ] Recommendations are accurate

### Quality Metrics
- [ ] All unit tests pass (100%)
- [ ] All integration tests pass (100%)
- [ ] Code coverage > 90%
- [ ] No regressions in existing functionality

### Performance Metrics
- [ ] Analysis completes in < 5 seconds for playground
- [ ] Memory usage is acceptable
- [ ] No memory leaks

## Risk Mitigation

### Technical Risks
1. **AST Parsing Complexity**: Mitigate with comprehensive unit tests
2. **Performance Issues**: Mitigate with profiling and optimization
3. **Backward Compatibility**: Mitigate with feature flags and gradual rollout

### Timeline Risks
1. **Scope Creep**: Stick to defined phases and deliverables
2. **Integration Issues**: Test integration early and often
3. **Validation Delays**: Start validation testing early

## Conclusion

This implementation roadmap provides a clear path to fixing the AST analyzer with:

1. **Phased Approach**: Breaking down the work into manageable phases
2. **Clear Deliverables**: Specific deliverables for each phase
3. **Success Criteria**: Measurable success criteria for each phase
4. **Risk Mitigation**: Strategies to handle potential issues

The roadmap ensures that the fix is implemented systematically and thoroughly, resulting in a reliable and accurate CLI analysis system.
