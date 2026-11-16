import { consola } from '../utils/logging.js'
/**
 * @fileoverview CLI Coverage Analyzer - Best Practice Implementation
 * @description Uses Citty introspection and direct CLI analysis for comprehensive coverage
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, basename } from 'pathe'
import { execSync } from 'child_process'
import { Store, Writer } from 'n3'
import { parse } from 'acorn'
import { simple as walk } from 'acorn-walk'

/**
 * CLI Coverage Analyzer - Best Practice Implementation
 * Uses Citty introspection and direct analysis for accurate coverage reporting
 */
export class CLCoverageAnalyzer {
  constructor(options = {}) {
    this.options = {
      cliPath: options.cliPath || 'src/cli.mjs',
      testDir: options.testDir || 'test',
      includePatterns: options.includePatterns || [
        '.test.mjs',
        '.test.js',
        '.spec.mjs',
        '.spec.js',
      ],
      excludePatterns: options.excludePatterns || ['node_modules', '.git', 'coverage'],
      verbose: options.verbose || false,
      ...options,
    }
  }

  /**
   * Analyze CLI coverage using best practices
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Coverage analysis results
   */
  async analyze(options = {}) {
    const analysisOptions = { ...this.options, ...options }

    if (analysisOptions.verbose) {
      console.log('🔍 Starting CLI coverage analysis...')
    }

    try {
      // Step 1: Discover CLI structure using help output
      const cliStructure = await this.discoverCLIStructure(analysisOptions)

      // Step 2: Discover and analyze test files
      const testPatterns = await this.discoverTestPatterns(analysisOptions)

      // Step 3: Calculate coverage
      const coverage = this.calculateCoverage(cliStructure, testPatterns)

      // Step 4: Generate report
      const report = this.generateReport(cliStructure, testPatterns, coverage, analysisOptions)

      if (analysisOptions.verbose) {
        console.log('✅ CLI coverage analysis complete')
      }

      return report
    } catch (error) {
      throw new Error(`CLI coverage analysis failed: ${error.message}`)
    }
  }

  /**
   * Discover CLI structure by analyzing help output
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} CLI structure
   */
  async discoverCLIStructure(options) {
    const cliPath = options.cliPath || 'src/cli.mjs'

    if (options.verbose) {
      console.log(`🔍 Discovering CLI structure: ${cliPath}`)
    }

    try {
      // Get main help output
      const mainHelp = execSync(`node ${cliPath} --help`, {
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 10000,
      })

      const structure = {
        commands: new Map(),
        globalOptions: new Map(),
      }

      // Parse main help to get commands and global options
      this.parseHelpOutput(mainHelp, structure, options)

      // Get help for each command to discover subcommands and options
      for (const [commandName, command] of structure.commands) {
        try {
          const commandHelp = execSync(`node ${cliPath} ${commandName} --help`, {
            cwd: process.cwd(),
            encoding: 'utf8',
            timeout: 10000,
          })

          this.parseCommandHelp(commandHelp, command, options)
        } catch (error) {
          if (options.verbose) {
            console.log(`⚠️ Could not get help for ${commandName}: ${error.message}`)
          }
        }
      }

      if (options.verbose) {
        console.log(`📋 Discovered ${structure.commands.size} commands`)
        console.log(`📋 Found ${structure.globalOptions.size} global options`)
      }

      return structure
    } catch (error) {
      throw new Error(`CLI structure discovery failed: ${error.message}`)
    }
  }

  /**
   * Parse main help output
   * @param {string} helpText - Help text
   * @param {Object} structure - Structure to populate
   * @param {Object} options - Options
   */
  parseHelpOutput(helpText, structure, options) {
    const lines = helpText.split('\n')
    let inCommandsSection = false
    let inOptionsSection = false

    for (const line of lines) {
      const trimmed = line.trim()

      // Detect sections
      if (/^(COMMANDS?|NOUNS?)/i.test(trimmed)) {
        inCommandsSection = true
        inOptionsSection = false
        continue
      }

      if (/^(OPTIONS?)/i.test(trimmed)) {
        inOptionsSection = true
        inCommandsSection = false
        continue
      }

      // Skip empty lines and other sections
      if (!trimmed || /^(USAGE|EXAMPLES?)/i.test(trimmed)) {
        if (trimmed && /^(USAGE|EXAMPLES?)/i.test(trimmed)) {
          inCommandsSection = false
          inOptionsSection = false
        }
        continue
      }

      if (inCommandsSection) {
        // Parse command: "command    Description"
        const commandMatch = trimmed.match(/^\s*(\w+)\s+(.+)$/)
        if (commandMatch) {
          const [, name, description] = commandMatch
          if (name.toLowerCase() !== 'use') {
            structure.commands.set(name, {
              name,
              description: description.trim(),
              subcommands: new Map(),
              arguments: new Map(),
              flags: new Map(),
              options: new Map(),
              tested: false,
              testFiles: [],
            })
          }
        }
      }

      if (inOptionsSection) {
        // Parse global option: "--option    Description"
        const optionMatch = trimmed.match(/^\s*(--[a-zA-Z-]+)\s+(.+)$/)
        if (optionMatch) {
          const [, longFlag, description] = optionMatch
          const optionName = longFlag.replace('--', '')
          const isFlag = this.isBooleanOption(description)

          structure.globalOptions.set(optionName, {
            name: optionName,
            longFlag,
            description: description.trim(),
            type: this.inferOptionType(description),
            isFlag,
            tested: false,
            testFiles: [],
          })
        }
      }
    }
  }

  /**
   * Parse command-specific help output
   * @param {string} helpText - Help text
   * @param {Object} command - Command to populate
   * @param {Object} options - Options
   */
  parseCommandHelp(helpText, command, options) {
    const lines = helpText.split('\n')
    let inOptionsSection = false
    let inCommandsSection = false

    for (const line of lines) {
      const trimmed = line.trim()

      if (/^(OPTIONS?)/i.test(trimmed)) {
        inOptionsSection = true
        inCommandsSection = false
        continue
      }

      if (/^(COMMANDS?)/i.test(trimmed)) {
        inCommandsSection = true
        inOptionsSection = false
        continue
      }

      if (!trimmed || /^(USAGE|EXAMPLES?)/i.test(trimmed)) {
        if (trimmed && /^(USAGE|EXAMPLES?)/i.test(trimmed)) {
          inOptionsSection = false
          inCommandsSection = false
        }
        continue
      }

      if (inCommandsSection) {
        // Parse subcommand: "subcommand    Description"
        const subcommandMatch = trimmed.match(/^\s*(\w+)\s+(.+)$/)
        if (subcommandMatch) {
          const [, name, description] = subcommandMatch
          // Skip lines that start with "Use" or contain help instructions
          if (
            !name.toLowerCase().includes('use') &&
            !description.toLowerCase().includes('help for more information')
          ) {
            command.subcommands.set(name, {
              name,
              description: description.trim(),
              tested: false,
              testFiles: [],
            })
          }
        }
      }

      if (inOptionsSection) {
        // Parse option: "--option=\"value\"    Description" or "--option    Description"
        const optionMatch = trimmed.match(/^\s*(--[a-zA-Z-]+)(?:="[^"]*")?\s+(.+)$/)
        if (optionMatch) {
          const [, longFlag, description] = optionMatch
          const optionName = longFlag.replace('--', '')
          const isFlag = this.isBooleanOption(description)
          const targetMap = isFlag ? command.flags : command.options

          targetMap.set(optionName, {
            name: optionName,
            longFlag,
            description: description.trim(),
            type: this.inferOptionType(description),
            isFlag,
            tested: false,
            testFiles: [],
          })
        }
      }
    }
  }

  /**
   * Discover test patterns by analyzing test files
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Test patterns
   */
  async discoverTestPatterns(options) {
    if (options.verbose) {
      console.log('🧪 Discovering test patterns...')
    }

    const testFiles = this.findTestFiles(options.testDir, options)
    const patterns = {
      commands: new Map(),
      flags: new Map(),
      options: new Map(),
    }

    for (const testFile of testFiles) {
      try {
        const content = readFileSync(testFile, 'utf8')
        this.extractTestPatterns(content, patterns, testFile)
      } catch (error) {
        if (options.verbose) {
          console.log(`⚠️ Could not analyze ${testFile}: ${error.message}`)
        }
      }
    }

    if (options.verbose) {
      console.log(`🧪 Analyzed ${testFiles.length} test files`)
      console.log(`🧪 Found ${patterns.commands.size} command patterns`)
      console.log(`🧪 Found ${patterns.flags.size} flag patterns`)
      console.log(`🧪 Found ${patterns.options.size} option patterns`)
    }

    return patterns
  }

  /**
   * Find test files in directory
   * @param {string} dir - Directory to search
   * @param {Object} options - Search options
   * @returns {Array} Array of test file paths
   */
  findTestFiles(dir, options) {
    const testFiles = []

    if (!existsSync(dir)) {
      return testFiles
    }

    const items = readdirSync(dir)

    for (const item of items) {
      const fullPath = join(dir, item)
      const stat = statSync(fullPath)

      if (options.excludePatterns.some((pattern) => item.includes(pattern))) {
        continue
      }

      if (stat.isDirectory()) {
        testFiles.push(...this.findTestFiles(fullPath, options))
      } else if (stat.isFile()) {
        if (options.includePatterns.some((pattern) => item.includes(pattern))) {
          testFiles.push(fullPath)
        }
      }
    }

    return testFiles
  }

  /**
   * Extract test patterns from test file content using AST parsing
   * @param {string} content - Test file content
   * @param {Object} patterns - Patterns to populate
   * @param {string} testFile - Test file path
   */
  extractTestPatterns(content, patterns, testFile) {
    try {
      // Remove shebang if present
      let cleanContent = content
      if (content.startsWith('#!')) {
        const firstNewline = content.indexOf('\n')
        if (firstNewline !== -1) {
          cleanContent = content.substring(firstNewline + 1)
        }
      }

      // Parse the JavaScript content into an AST
      const ast = parse(cleanContent, {
        ecmaVersion: 2022,
        sourceType: 'module',
        allowReturnOutsideFunction: true,
        allowImportExportEverywhere: true,
        allowAwaitOutsideFunction: true,
      })

      // Walk the AST to find test patterns
      walk(ast, {
        CallExpression: (node) => {
          this.extractCallPattern(node, patterns, testFile)
        },
      })
    } catch (error) {
      // If AST parsing fails, fall back to regex patterns
      if (this.options.verbose) {
        console.log(
          `⚠️ AST parsing failed for ${testFile}, falling back to regex: ${error.message}`
        )
      }
      this.extractTestPatternsRegex(content, patterns, testFile)
    }
  }

  /**
   * Extract patterns from AST call expressions
   * @param {Object} node - AST call expression node
   * @param {Object} patterns - Patterns to populate
   * @param {string} testFile - Test file path
   */
  extractCallPattern(node, patterns, testFile) {
    // Check if this is a runLocalCitty or runCitty call
    const callee = node.callee
    if (!callee || callee.type !== 'Identifier') return

    const functionName = callee.name
    if (!['runLocalCitty', 'runCitty'].includes(functionName)) return

    // Extract arguments
    const args = node.arguments
    if (!args || args.length === 0) return

    const firstArg = args[0]
    if (!firstArg || firstArg.type !== 'ArrayExpression') return

    // Extract command arguments from array
    const commandArgs = this.extractArrayElements(firstArg)
    if (commandArgs.length === 0) return

    // Debug output
    if (this.options.verbose) {
      console.log(`🔍 Found ${functionName} call: [${commandArgs.join(', ')}] in ${testFile}`)
    }

    // Extract command and subcommand
    const command = commandArgs[0]
    const subcommand = commandArgs[1]

    // Add command pattern
    if (command && !patterns.commands.has(command)) {
      patterns.commands.set(command, {
        name: command,
        tested: true,
        testFiles: [testFile],
        subcommands: new Map(),
      })
    }

    // Add subcommand pattern if present
    if (subcommand && patterns.commands.has(command)) {
      const cmd = patterns.commands.get(command)
      if (!cmd.subcommands) cmd.subcommands = new Map()
      cmd.subcommands.set(subcommand, {
        name: subcommand,
        tested: true,
        testFiles: [testFile],
      })
    }

    // Extract flags and options from remaining arguments
    for (let i = 1; i < commandArgs.length; i++) {
      const arg = commandArgs[i]
      if (typeof arg === 'string' && arg.startsWith('--')) {
        const flagName = arg.replace('--', '')
        if (!patterns.flags.has(flagName)) {
          patterns.flags.set(flagName, {
            name: flagName,
            tested: true,
            testFiles: [testFile],
          })
        }
      }
    }
  }

  /**
   * Extract elements from an array expression
   * @param {Object} arrayNode - AST array expression node
   * @returns {Array} Array of string values
   */
  extractArrayElements(arrayNode) {
    const elements = []
    for (const element of arrayNode.elements) {
      if (element) {
        if (element.type === 'Literal') {
          elements.push(element.value)
        } else if (element.type === 'TemplateLiteral') {
          // For template literals like `test-${testTimestamp}`, extract the static parts
          const staticParts = element.quasis.map((q) => q.value.raw).filter((p) => p.length > 0)
          if (staticParts.length > 0) {
            elements.push(staticParts[0]) // Use first static part
          }
        }
      }
    }
    return elements
  }

  /**
   * Fallback regex-based pattern extraction
   * @param {string} content - Test file content
   * @param {Object} patterns - Patterns to populate
   * @param {string} testFile - Test file path
   */
  extractTestPatternsRegex(content, patterns, testFile) {
    // Extract command patterns (including subcommands)
    const commandPatterns = [
      // Patterns for runLocalCitty and runCitty with array arguments
      /runLocalCitty\(\[['"`]([^'"`]+)['"`]/g,
      /runCitty\(\[['"`]([^'"`]+)['"`]/g,
      // Patterns for string commands
      /['"`]ctu\s+([a-zA-Z-]+)['"`]/g,
      /node\s+src\/cli\.mjs\s+([a-zA-Z-]+)/g,
      // Subcommand patterns for runLocalCitty and runCitty
      /runLocalCitty\(\[['"`]([a-zA-Z-]+)['"`]\s*,\s*['"`]([a-zA-Z-]+)['"`]/g,
      /runCitty\(\[['"`]([a-zA-Z-]+)['"`]\s*,\s*['"`]([a-zA-Z-]+)['"`]/g,
      // Additional subcommand patterns
      /['"`]ctu\s+([a-zA-Z-]+)\s+([a-zA-Z-]+)['"`]/g,
      /node\s+src\/cli\.mjs\s+([a-zA-Z-]+)\s+([a-zA-Z-]+)/g,
    ]

    for (const pattern of commandPatterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const command = match[1]
        const subcommand = match[2]

        if (command && !patterns.commands.has(command)) {
          patterns.commands.set(command, {
            name: command,
            tested: true,
            testFiles: [testFile],
            subcommands: new Map(),
          })
        }

        // Handle subcommand patterns
        if (subcommand && patterns.commands.has(command)) {
          const cmd = patterns.commands.get(command)
          if (!cmd.subcommands) cmd.subcommands = new Map()
          cmd.subcommands.set(subcommand, {
            name: subcommand,
            tested: true,
            testFiles: [testFile],
          })
        }
      }
    }

    // Extract flag patterns
    const flagPatterns = [/--([a-zA-Z-]+)(?=\s|$|'|"|`)/g, /-[a-zA-Z](?=\s|$|'|"|`)/g]

    for (const pattern of flagPatterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const flagName = match[1] || match[0].substring(1)
        if (flagName && !patterns.flags.has(flagName)) {
          patterns.flags.set(flagName, {
            name: flagName,
            tested: true,
            testFiles: [testFile],
          })
        }
      }
    }

    // Extract option patterns
    const optionPatterns = [/--([a-zA-Z-]+)\s*[=:]\s*['"`]?([^'"`\s]+)['"`]?/g]

    for (const pattern of optionPatterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const optionName = match[1]
        if (optionName && !patterns.options.has(optionName)) {
          patterns.options.set(optionName, {
            name: optionName,
            tested: true,
            testFiles: [testFile],
          })
        }
      }
    }
  }

  /**
   * Calculate coverage statistics
   * @param {Object} cliStructure - CLI structure
   * @param {Object} testPatterns - Test patterns
   * @returns {Object} Coverage statistics
   */
  calculateCoverage(cliStructure, testPatterns) {
    let totalCommands = 0
    let testedCommands = 0
    let totalSubcommands = 0
    let testedSubcommands = 0
    let totalFlags = 0
    let testedFlags = 0
    let totalOptions = 0
    let testedOptions = 0

    // Calculate command coverage
    for (const [name, command] of cliStructure.commands) {
      totalCommands++
      if (testPatterns.commands.has(name)) {
        testedCommands++
        command.tested = true
        command.testFiles = testPatterns.commands.get(name).testFiles

        // Handle subcommand coverage
        const testCmd = testPatterns.commands.get(name)
        if (testCmd && testCmd.subcommands) {
          for (const [subName, subcommand] of command.subcommands) {
            totalSubcommands++
            if (testCmd.subcommands.has(subName)) {
              testedSubcommands++
              subcommand.tested = true
              subcommand.testFiles = testCmd.subcommands.get(subName).testFiles
            }
          }
        }
      } else {
        // Count untested subcommands
        for (const [subName, subcommand] of command.subcommands) {
          totalSubcommands++
        }
      }
    }

    // Calculate global option coverage
    for (const [name, option] of cliStructure.globalOptions) {
      if (option.isFlag) {
        totalFlags++
        if (testPatterns.flags.has(name)) {
          testedFlags++
          option.tested = true
          option.testFiles = testPatterns.flags.get(name).testFiles
        }
      } else {
        totalOptions++
        if (testPatterns.options.has(name)) {
          testedOptions++
          option.tested = true
          option.testFiles = testPatterns.options.get(name).testFiles
        }
      }
    }

    // Calculate command-specific option coverage
    for (const [name, command] of cliStructure.commands) {
      for (const [flagName, flag] of command.flags) {
        totalFlags++
        if (testPatterns.flags.has(flagName)) {
          testedFlags++
          flag.tested = true
          flag.testFiles = testPatterns.flags.get(flagName).testFiles
        }
      }

      for (const [optionName, option] of command.options) {
        totalOptions++
        if (testPatterns.options.has(optionName)) {
          testedOptions++
          option.tested = true
          option.testFiles = testPatterns.options.get(optionName).testFiles
        }
      }
    }

    const totalItems = totalCommands + totalSubcommands + totalFlags + totalOptions
    const totalTested = testedCommands + testedSubcommands + testedFlags + testedOptions
    const overallPercentage = totalItems > 0 ? (totalTested / totalItems) * 100 : 0

    return {
      commands: {
        tested: testedCommands,
        total: totalCommands,
        percentage: totalCommands > 0 ? (testedCommands / totalCommands) * 100 : 0,
      },
      subcommands: {
        tested: testedSubcommands,
        total: totalSubcommands,
        percentage: totalSubcommands > 0 ? (testedSubcommands / totalSubcommands) * 100 : 0,
      },
      flags: {
        tested: testedFlags,
        total: totalFlags,
        percentage: totalFlags > 0 ? (testedFlags / totalFlags) * 100 : 0,
      },
      options: {
        tested: testedOptions,
        total: totalOptions,
        percentage: totalOptions > 0 ? (testedOptions / totalOptions) * 100 : 0,
      },
      overall: {
        tested: totalTested,
        total: totalItems,
        percentage: overallPercentage,
      },
    }
  }

  /**
   * Generate comprehensive report
   * @param {Object} cliStructure - CLI structure
   * @param {Object} testPatterns - Test patterns
   * @param {Object} coverage - Coverage statistics
   * @param {Object} options - Report options
   * @returns {Object} Generated report
   */
  generateReport(cliStructure, testPatterns, coverage, options) {
    const timestamp = new Date().toISOString()

    return {
      metadata: {
        analyzedAt: timestamp,
        cliPath: options.cliPath || 'src/cli.mjs',
        testDir: options.testDir || 'test',
        totalTestFiles: this.findTestFiles(options.testDir, options).length,
        totalCommands: cliStructure.commands.size,
        totalSubcommands: coverage.subcommands ? coverage.subcommands.total : 0,
        totalFlags: coverage.flags.total,
        totalOptions: coverage.options.total,
      },
      commands: this.convertCommandsToObject(cliStructure.commands),
      globalOptions: Object.fromEntries(cliStructure.globalOptions),
      coverage: {
        summary: coverage,
        details: this.generateCoverageDetails(cliStructure, coverage),
      },
      recommendations: this.generateRecommendations(coverage, cliStructure),
    }
  }

  /**
   * Convert commands Map to object with proper nested Map conversion
   * @param {Map} commands - Commands Map
   * @returns {Object} Converted commands object
   */
  convertCommandsToObject(commands) {
    const result = {}
    for (const [name, command] of commands) {
      result[name] = {
        ...command,
        subcommands: Object.fromEntries(command.subcommands || new Map()),
        arguments: Object.fromEntries(command.arguments || new Map()),
        flags: Object.fromEntries(command.flags || new Map()),
        options: Object.fromEntries(command.options || new Map()),
      }
    }
    return result
  }

  /**
   * Generate detailed coverage information
   * @param {Object} cliStructure - CLI structure
   * @param {Object} coverage - Coverage statistics
   * @returns {Object} Detailed coverage information
   */
  generateCoverageDetails(cliStructure, coverage) {
    const details = {
      untestedCommands: [],
      untestedFlags: [],
      untestedOptions: [],
    }

    // Find untested items
    for (const [name, command] of cliStructure.commands) {
      if (!command.tested) {
        details.untestedCommands.push({
          name,
          description: command.description,
        })
      }
    }

    for (const [name, option] of cliStructure.globalOptions) {
      if (!option.tested) {
        if (option.isFlag) {
          details.untestedFlags.push({
            name,
            description: option.description,
            global: true,
          })
        } else {
          details.untestedOptions.push({
            name,
            description: option.description,
            global: true,
          })
        }
      }
    }

    return details
  }

  /**
   * Generate recommendations for improving coverage
   * @param {Object} coverage - Coverage statistics
   * @param {Object} cliStructure - CLI structure
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(coverage, cliStructure) {
    const recommendations = []

    if (coverage.commands.percentage < 100) {
      recommendations.push({
        type: 'command',
        priority: 'high',
        message: `Add tests for untested commands to improve command coverage`,
        count: coverage.commands.total - coverage.commands.tested,
      })
    }

    if (coverage.flags.percentage < 100) {
      recommendations.push({
        type: 'flag',
        priority: 'medium',
        message: `Add tests for untested flags to improve flag coverage`,
        count: coverage.flags.total - coverage.flags.tested,
      })
    }

    if (coverage.options.percentage < 100) {
      recommendations.push({
        type: 'option',
        priority: 'medium',
        message: `Add tests for untested options to improve option coverage`,
        count: coverage.options.total - coverage.options.tested,
      })
    }

    return recommendations
  }

  /**
   * Format report in the specified format
   * @param {Object} report - Report data
   * @param {Object} options - Formatting options
   * @returns {Promise<string>} Formatted report
   */
  async formatReport(report, options = {}) {
    const { format = 'text' } = options

    switch (format.toLowerCase()) {
      case 'text':
        return this.generateTextReport(report, options)
      case 'json':
        return JSON.stringify(report, null, 2)
      case 'turtle':
        return await this.generateTurtleReport(report, options)
      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  }

  /**
   * Generate text format report
   * @param {Object} report - Report data
   * @param {Object} options - Formatting options
   * @returns {string} Text report
   */
  generateTextReport(report, options) {
    const lines = []

    lines.push('📊 CLI Test Coverage Analysis')
    lines.push('='.repeat(50))
    lines.push('')

    // Summary
    lines.push('📈 Summary:')
    lines.push(
      `  Commands: ${report.coverage.summary.commands.tested}/${
        report.coverage.summary.commands.total
      } (${report.coverage.summary.commands.percentage.toFixed(1)}%)`
    )
    if (report.coverage.summary.subcommands) {
      lines.push(
        `  Subcommands: ${report.coverage.summary.subcommands.tested}/${
          report.coverage.summary.subcommands.total
        } (${report.coverage.summary.subcommands.percentage.toFixed(1)}%)`
      )
    }
    lines.push(
      `  Flags: ${report.coverage.summary.flags.tested}/${
        report.coverage.summary.flags.total
      } (${report.coverage.summary.flags.percentage.toFixed(1)}%)`
    )
    lines.push(
      `  Options: ${report.coverage.summary.options.tested}/${
        report.coverage.summary.options.total
      } (${report.coverage.summary.options.percentage.toFixed(1)}%)`
    )
    lines.push(
      `  Overall: ${report.coverage.summary.overall.tested}/${
        report.coverage.summary.overall.total
      } (${report.coverage.summary.overall.percentage.toFixed(1)}%)`
    )
    lines.push('')

    // Analysis info
    lines.push('ℹ️  Analysis Info:')
    lines.push(`  Analyzed: ${new Date(report.metadata.analyzedAt).toLocaleString()}`)
    lines.push(`  CLI Path: ${report.metadata.cliPath}`)
    lines.push(`  Test Directory: ${report.metadata.testDir}`)
    lines.push(`  Test Files: ${report.metadata.totalTestFiles}`)
    lines.push(`  Commands: ${report.metadata.totalCommands}`)
    if (report.metadata.totalSubcommands > 0) {
      lines.push(`  Subcommands: ${report.metadata.totalSubcommands}`)
    }
    lines.push(`  Flags: ${report.metadata.totalFlags}`)
    lines.push(`  Options: ${report.metadata.totalOptions}`)
    lines.push('')

    // Recommendations
    if (report.recommendations && report.recommendations.length > 0) {
      lines.push('💡 Recommendations:')
      report.recommendations.forEach((rec, index) => {
        lines.push(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`)
      })
      lines.push('')
    }

    return lines.join('\n')
  }

  /**
   * Generate Turtle/RDF format report
   * @param {Object} report - Report data
   * @param {Object} options - Formatting options
   * @returns {Promise<string>} Turtle report
   */
  async generateTurtleReport(report, options = {}) {
    const { baseUri = 'http://example.org/cli', cliName = 'cli' } = options
    const timestamp = new Date(report.metadata.analyzedAt).toISOString()

    const store = new Store()

    // CLI Application
    const cliUri = `${baseUri}/${cliName}`
    store.addQuad(cliUri, 'rdf:type', 'cli:Application')
    store.addQuad(cliUri, 'rdfs:label', cliName)
    store.addQuad(cliUri, 'cli:analyzedAt', `"${timestamp}"^^xsd:dateTime`)
    store.addQuad(
      cliUri,
      'coverage:overallCoverage',
      `"${report.coverage.summary.overall.percentage.toFixed(1)}"^^xsd:decimal`
    )

    // Generate Turtle output
    const writer = new Writer({ format: 'Turtle' })
    return new Promise((resolve, reject) => {
      writer.addQuads(store.getQuads())
      writer.end((error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
  }

  /**
   * Infer option type from description
   * @param {string} description - Option description
   * @returns {string} Inferred type
   */
  inferOptionType(description) {
    const desc = description.toLowerCase()

    if (desc.includes('boolean') || desc.includes('flag')) return 'boolean'
    if (desc.includes('number') || desc.includes('integer')) return 'number'
    if (desc.includes('file') || desc.includes('pathe')) return 'file'
    if (desc.includes('url') || desc.includes('uri')) return 'url'

    return 'string'
  }

  /**
   * Determine if an option is a boolean flag
   * @param {string} description - Option description
   * @returns {boolean} True if it's a boolean flag
   */
  isBooleanOption(description) {
    const desc = description.toLowerCase()

    const booleanPatterns = [
      'enable',
      'disable',
      'show',
      'hide',
      'verbose',
      'quiet',
      'force',
      'help',
      'version',
      'json',
      'yaml',
      'use-',
    ]

    return (
      booleanPatterns.some((pattern) => desc.includes(pattern)) ||
      desc.includes('boolean') ||
      desc.includes('flag')
    )
  }
}
