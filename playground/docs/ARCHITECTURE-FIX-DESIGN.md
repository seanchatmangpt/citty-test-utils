# AST Analyzer Architecture Fix - Technical Design Document

## Executive Summary

This document outlines the complete architectural redesign required to fix the citty-test-utils AST analyzer. The current system fundamentally misunderstands command hierarchies, treating every `defineCommand` call as a separate top-level command instead of understanding the actual command structure that users interact with.

## Current Architecture Problems

### 1. Flat Command Detection Architecture

**Current System:**
```
AST Parser → Find All defineCommand() → Treat Each as Separate Command
```

**Problem:** This creates a flat list of commands instead of understanding the hierarchy.

**Example Output (Wrong):**
```
Commands Found:
├── greet (separate command)
├── add (separate command)  
├── multiply (separate command)
├── math (separate command)
├── error (separate command)
├── info (separate command)
└── playground (separate command)
```

### 2. Missing Command Hierarchy Understanding

**Current System:**
- No concept of "main command" vs "subcommand"
- No understanding of command nesting
- No mapping of user-facing command structure

**Problem:** Users call `playground greet`, but the system thinks `greet` is a separate command.

### 3. Test Pattern Recognition Architecture

**Current System:**
```
Test Call: runLocalCitty(['greet', 'Alice'])
Maps To: greet command (wrong!)
```

**Should Map To:**
```
Test Call: runLocalCitty(['greet', 'Alice'])
Maps To: playground greet command (correct!)
```

## Required Architecture Redesign

### 1. Command Hierarchy Detection Architecture

#### 1.1 Main Command Identification

**New Architecture:**
```
AST Parser → Identify Main Command → Build Hierarchy Tree
```

**Implementation Strategy:**
```javascript
class CommandHierarchyDetector {
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
}
```

#### 1.2 Hierarchy Tree Builder

**New Architecture:**
```javascript
class CommandHierarchyBuilder {
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

### 2. Test Pattern Recognition Architecture

#### 2.1 Command Context Detection

**New Architecture:**
```javascript
class TestPatternRecognizer {
  recognizeTestPattern(testCallNode, cliHierarchy) {
    const commandArgs = this.extractCommandArguments(testCallNode)
    const commandPath = this.determineCommandPath(commandArgs, cliHierarchy)
    
    return {
      commandPath: commandPath,
      arguments: commandArgs,
      flags: this.extractFlags(commandArgs),
      options: this.extractOptions(commandArgs),
    }
  }
  
  determineCommandPath(commandArgs, cliHierarchy) {
    // Strategy 1: Direct subcommand (greet, math, error, info)
    if (commandArgs.length >= 1) {
      const firstArg = commandArgs[0]
      if (cliHierarchy.subcommands.has(`playground ${firstArg}`)) {
        return `playground ${firstArg}`
      }
    }
    
    // Strategy 2: Nested subcommand (math add, math multiply)
    if (commandArgs.length >= 2) {
      const firstArg = commandArgs[0]
      const secondArg = commandArgs[1]
      if (firstArg === 'math' && cliHierarchy.subcommands.has(`playground math ${secondArg}`)) {
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

#### 2.2 Test Coverage Mapping

**New Architecture:**
```javascript
class TestCoverageMapper {
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

### 3. Coverage Calculation Architecture

#### 3.1 Accurate Coverage Calculation

**New Architecture:**
```javascript
class CoverageCalculator {
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

## Implementation Architecture

### 1. Core Components

#### 1.1 CommandHierarchyDetector
```javascript
class CommandHierarchyDetector {
  constructor(options = {}) {
    this.options = options
  }
  
  async detectMainCommand(ast) {
    // Implementation as described above
  }
  
  findDefaultExport(ast) {
    // Find exported default command
  }
  
  findMainCLIVariable(ast) {
    // Find main CLI variable
  }
  
  findLargestCommand(ast) {
    // Find command with most subcommands
  }
}
```

#### 1.2 CommandHierarchyBuilder
```javascript
class CommandHierarchyBuilder {
  constructor(options = {}) {
    this.options = options
  }
  
  buildHierarchy(mainCommandNode) {
    // Implementation as described above
  }
  
  buildSubcommandTree(commandNode, hierarchy, parentPath) {
    // Implementation as described above
  }
  
  extractSubCommands(commandNode) {
    // Extract subcommands from command definition
  }
}
```

#### 1.3 TestPatternRecognizer
```javascript
class TestPatternRecognizer {
  constructor(cliHierarchy) {
    this.cliHierarchy = cliHierarchy
  }
  
  recognizeTestPattern(testCallNode) {
    // Implementation as described above
  }
  
  determineCommandPath(commandArgs) {
    // Implementation as described above
  }
  
  extractCommandArguments(testCallNode) {
    // Extract command arguments from test call
  }
}
```

### 2. Integration Architecture

#### 2.1 EnhancedASTCLIAnalyzer (Redesigned)
```javascript
class EnhancedASTCLIAnalyzer {
  constructor(options = {}) {
    this.options = options
    this.hierarchyDetector = new CommandHierarchyDetector(options)
    this.hierarchyBuilder = new CommandHierarchyBuilder(options)
    this.testRecognizer = null
  }
  
  async analyze(options = {}) {
    // Step 1: Detect main command
    const mainCommand = await this.hierarchyDetector.detectMainCommand(ast)
    
    // Step 2: Build command hierarchy
    const cliHierarchy = this.hierarchyBuilder.buildHierarchy(mainCommand)
    
    // Step 3: Initialize test recognizer with hierarchy
    this.testRecognizer = new TestPatternRecognizer(cliHierarchy)
    
    // Step 4: Analyze test patterns
    const testPatterns = await this.analyzeTestPatterns(cliHierarchy)
    
    // Step 5: Calculate coverage
    const coverage = this.calculateCoverage(testPatterns, cliHierarchy)
    
    // Step 6: Generate report
    const report = this.generateReport(cliHierarchy, testPatterns, coverage)
    
    return report
  }
}
```

### 3. Data Flow Architecture

#### 3.1 Analysis Pipeline
```
AST Input → Main Command Detection → Hierarchy Building → Test Pattern Recognition → Coverage Calculation → Report Generation
```

#### 3.2 Data Structures
```javascript
// CLI Hierarchy Structure
const cliHierarchy = {
  mainCommand: {
    name: 'playground',
    fullPath: 'playground',
    description: 'Playground CLI for testing citty-test-utils functionality',
    subcommands: new Map(),
    flags: new Map(),
    options: new Map(),
  },
  subcommands: new Map([
    ['playground greet', { name: 'greet', fullPath: 'playground greet', ... }],
    ['playground math', { name: 'math', fullPath: 'playground math', ... }],
    ['playground math add', { name: 'add', fullPath: 'playground math add', ... }],
    ['playground math multiply', { name: 'multiply', fullPath: 'playground math multiply', ... }],
    ['playground error', { name: 'error', fullPath: 'playground error', ... }],
    ['playground info', { name: 'info', fullPath: 'playground info', ... }],
  ]),
  globalOptions: new Map(),
}

// Test Coverage Structure
const testCoverage = {
  mainCommand: {
    tested: true,
    testFiles: ['test/integration/playground.test.mjs'],
  },
  subcommands: new Map([
    ['playground greet', { tested: true, testFiles: [...] }],
    ['playground math add', { tested: true, testFiles: [...] }],
    ['playground math multiply', { tested: true, testFiles: [...] }],
    ['playground error', { tested: true, testFiles: [...] }],
    ['playground info', { tested: false, testFiles: [] }],
  ]),
}
```

## Implementation Phases

### Phase 1: Core Architecture (Week 1-2)
1. **CommandHierarchyDetector**: Implement main command detection
2. **CommandHierarchyBuilder**: Implement hierarchy building
3. **Basic Integration**: Connect components together

### Phase 2: Test Recognition (Week 3)
1. **TestPatternRecognizer**: Implement test pattern recognition
2. **Command Path Mapping**: Map test calls to correct commands
3. **Coverage Mapping**: Map test coverage to hierarchy

### Phase 3: Coverage Calculation (Week 4)
1. **CoverageCalculator**: Implement accurate coverage calculation
2. **Report Generation**: Update reports to show correct hierarchy
3. **Validation**: Test with playground CLI

### Phase 4: Testing & Validation (Week 5)
1. **Unit Tests**: Test each component individually
2. **Integration Tests**: Test complete analysis pipeline
3. **Validation**: Verify results with playground CLI

## Success Criteria

### Functional Requirements
- [ ] Correctly identifies main command (playground)
- [ ] Correctly parses subcommand hierarchy
- [ ] Maps test calls to correct command paths
- [ ] Calculates accurate coverage percentages
- [ ] Generates correct reports

### Quality Requirements
- [ ] Coverage percentages match actual test coverage
- [ ] Recommendations are accurate and actionable
- [ ] Analysis results are consistent and reliable
- [ ] User experience is intuitive and trustworthy

### Performance Requirements
- [ ] Analysis completes in reasonable time
- [ ] Memory usage is acceptable
- [ ] System handles large CLIs without issues

## Expected Results

### Before (Current - Broken)
```
📊 Coverage Statistics:
  Commands: 3/7 (42.9%) ❌
  Subcommands: 2/6 (33.3%) ❌
  Overall: 6/23 (26.1%) ❌
```

### After (Fixed)
```
📊 Coverage Statistics:
  Commands: 1/1 (100%) ✅
  Subcommands: 5/5 (100%) ✅
  Overall: 6/6 (100%) ✅
```

## Conclusion

This architectural redesign addresses the fundamental flaws in the current AST analyzer by:

1. **Proper Command Hierarchy Detection**: Understanding the actual command structure
2. **Accurate Test Pattern Recognition**: Mapping test calls to correct commands
3. **Correct Coverage Calculation**: Calculating coverage based on actual structure
4. **Reliable Analysis Results**: Providing trustworthy analysis results

The implementation requires significant changes to the core architecture, but it's necessary to make the analysis system truly useful and reliable for CLI testing.
