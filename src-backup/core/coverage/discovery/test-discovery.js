import { consola } from '../utils/logging.js'
/**
 * @fileoverview Test Discovery Module
 * @description Discovers and analyzes test files to determine what commands and arguments are tested
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, extname, basename } from 'pathe'

/**
 * Test Discovery Module
 * Handles discovery and analysis of test files
 */
export class TestDiscovery {
  constructor(options = {}) {
    this.options = {
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
    this.tests = new Map()
  }

  /**
   * Discover and analyze all test files
   * @param {Object} options - Discovery options
   */
  async discoverTests(options) {
    if (options.verbose) {
      console.log('🧪 Discovering test files...')
    }

    try {
      const testFiles = this.findTestFiles(options.testDir, options)

      for (const testFile of testFiles) {
        await this.analyzeTestFile(testFile, options)
      }

      if (options.verbose) {
        console.log(`🧪 Analyzed ${testFiles.length} test files`)
      }
    } catch (error) {
      throw new Error(`Test discovery failed: ${error.message}`)
    }
  }

  /**
   * Find all test files in the directory
   * @param {string} dir - Directory to search
   * @param {Object} options - Search options
   * @returns {Array} Array of test file paths
   */
  findTestFiles(dir, options) {
    const testFiles = []

    if (!existsSync(dir)) {
      if (options.verbose) {
        console.log(`⚠️ Test directory does not exist: ${dir}`)
      }
      return testFiles
    }

    const items = readdirSync(dir)

    for (const item of items) {
      const fullPath = join(dir, item)
      const stat = statSync(fullPath)

      // Skip excluded patterns
      if (options.excludePatterns.some((pattern) => item.includes(pattern))) {
        continue
      }

      if (stat.isDirectory()) {
        // Recursively search subdirectories
        testFiles.push(...this.findTestFiles(fullPath, options))
      } else if (stat.isFile()) {
        // Check if file matches include patterns
        if (options.includePatterns.some((pattern) => item.includes(pattern))) {
          testFiles.push(fullPath)
        }
      }
    }

    return testFiles
  }

  /**
   * Analyze a test file to determine what commands and arguments it tests
   * @param {string} testFile - Path to test file
   * @param {Object} options - Analysis options
   */
  async analyzeTestFile(testFile, options) {
    try {
      const content = readFileSync(testFile, 'utf8')
      const fileName = basename(testFile)

      if (options.verbose) {
        console.log(`🧪 Analyzing test file: ${fileName}`)
      }

      // Extract command usage patterns
      const commandPatterns = this.extractCommandPatterns(content)
      const argumentPatterns = this.extractArgumentPatterns(content)
      const flagPatterns = this.extractFlagPatterns(content)
      const optionPatterns = this.extractOptionPatterns(content)

      // Store test information
      this.tests.set(testFile, {
        fileName,
        path: testFile,
        commands: commandPatterns,
        arguments: argumentPatterns,
        flags: flagPatterns,
        options: optionPatterns,
        content,
      })

      if (options.verbose) {
        console.log(
          `🧪 Found ${commandPatterns.size} commands, ${argumentPatterns.size} arguments, ${flagPatterns.size} flags, ${optionPatterns.size} options in ${fileName}`
        )
      }
    } catch (error) {
      if (options.verbose) {
        console.log(`⚠️ Failed to analyze test file ${testFile}: ${error.message}`)
      }
    }
  }

  /**
   * Extract command usage patterns from test content
   * @param {string} content - Test file content
   * @returns {Map} Map of discovered commands
   */
  extractCommandPatterns(content) {
    const commands = new Map()

    // Patterns to match command usage
    const patterns = [
      // Direct command calls: runLocalCitty(['command', ...])
      /runLocalCitty\(\[['"`]([^'"`]+)['"`]/g,
      // Command strings: 'ctu command'
      /['"`]ctu\s+([a-zA-Z-]+)['"`]/g,
      // Node CLI calls: node src/cli.mjs command
      /node\s+src\/cli\.mjs\s+([a-zA-Z-]+)/g,
      // Command arrays: ['command', 'subcommand']
      /\[['"`]([a-zA-Z-]+)['"`]\s*,/g,
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const command = match[1]
        if (command && !commands.has(command)) {
          commands.set(command, {
            name: command,
            patterns: [match[0]],
            tested: true,
          })
        }
      }
    }

    return commands
  }

  /**
   * Extract argument usage patterns from test content
   * @param {string} content - Test file content
   * @returns {Map} Map of discovered arguments
   */
  extractArgumentPatterns(content) {
    const argumentMap = new Map()

    // Patterns to match argument usage
    const patterns = [
      // Positional arguments: ['command', 'arg1', 'arg2']
      /\[['"`][^'"`]+['"`]\s*,\s*['"`]([^'"`]+)['"`]/g,
      // Argument variables: const arg = 'value'
      /const\s+(\w*arg\w*)\s*=\s*['"`]([^'"`]+)['"`]/g,
      // Argument usage in strings: `command ${arg}`
      /`[^`]*\$\{(\w+)\}[^`]*`/g,
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const argName = match[1]
        if (argName && !argumentMap.has(argName)) {
          argumentMap.set(argName, {
            name: argName,
            patterns: [match[0]],
            tested: true,
          })
        }
      }
    }

    return argumentMap
  }

  /**
   * Extract flag usage patterns from test content
   * @param {string} content - Test file content
   * @returns {Map} Map of discovered flags
   */
  extractFlagPatterns(content) {
    const flags = new Map()

    // Patterns to match flag usage
    const patterns = [
      // Boolean flags: --verbose, --json, --help
      /--([a-zA-Z-]+)(?=\s|$|'|"|`)/g,
      // Short flags: -v, -j, -h
      /-[a-zA-Z](?=\s|$|'|"|`)/g,
      // Flag arrays: ['--verbose', '--json']
      /\[['"`]--([a-zA-Z-]+)['"`]/g,
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const flagName = match[1] || match[0].substring(1) // Handle short flags
        if (flagName && !flags.has(flagName)) {
          flags.set(flagName, {
            name: flagName,
            patterns: [match[0]],
            tested: true,
            isShort: !flagName.includes('-'),
          })
        }
      }
    }

    return flags
  }

  /**
   * Extract option usage patterns from test content
   * @param {string} content - Test file content
   * @returns {Map} Map of discovered options
   */
  extractOptionPatterns(content) {
    const options = new Map()

    // Patterns to match option usage
    const patterns = [
      // Options with values: --option value, --option=value
      /--([a-zA-Z-]+)\s*[=:]\s*['"`]?([^'"`\s]+)['"`]?/g,
      // Option arrays: ['--option', 'value']
      /\[['"`]--([a-zA-Z-]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]/g,
      // Option objects: { option: 'value' }
      /{\s*([a-zA-Z-]+)\s*:\s*['"`]([^'"`]+)['"`]/g,
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const optionName = match[1]
        const optionValue = match[2]
        if (optionName && !options.has(optionName)) {
          options.set(optionName, {
            name: optionName,
            value: optionValue,
            patterns: [match[0]],
            tested: true,
          })
        }
      }
    }

    return options
  }

  /**
   * Get discovered tests
   * @returns {Map} Map of discovered tests
   */
  getTests() {
    return this.tests
  }

  /**
   * Get all tested commands across all test files
   * @returns {Map} Map of all tested commands
   */
  getAllTestedCommands() {
    const allCommands = new Map()

    for (const [testFile, test] of this.tests) {
      for (const [commandName, command] of test.commands) {
        if (!allCommands.has(commandName)) {
          allCommands.set(commandName, {
            name: commandName,
            tested: true,
            testFiles: [],
          })
        }
        allCommands.get(commandName).testFiles.push(testFile)
      }
    }

    return allCommands
  }

  /**
   * Get all tested arguments across all test files
   * @returns {Map} Map of all tested arguments
   */
  getAllTestedArguments() {
    const allArguments = new Map()

    for (const [testFile, test] of this.tests) {
      for (const [argName, arg] of test.arguments) {
        if (!allArguments.has(argName)) {
          allArguments.set(argName, {
            name: argName,
            tested: true,
            testFiles: [],
          })
        }
        allArguments.get(argName).testFiles.push(testFile)
      }
    }

    return allArguments
  }

  /**
   * Get all tested flags across all test files
   * @returns {Map} Map of all tested flags
   */
  getAllTestedFlags() {
    const allFlags = new Map()

    for (const [testFile, test] of this.tests) {
      for (const [flagName, flag] of test.flags) {
        if (!allFlags.has(flagName)) {
          allFlags.set(flagName, {
            name: flagName,
            tested: true,
            testFiles: [],
            isShort: flag.isShort,
          })
        }
        allFlags.get(flagName).testFiles.push(testFile)
      }
    }

    return allFlags
  }

  /**
   * Get all tested options across all test files
   * @returns {Map} Map of all tested options
   */
  getAllTestedOptions() {
    const allOptions = new Map()

    for (const [testFile, test] of this.tests) {
      for (const [optionName, option] of test.options) {
        if (!allOptions.has(optionName)) {
          allOptions.set(optionName, {
            name: optionName,
            tested: true,
            testFiles: [],
          })
        }
        allOptions.get(optionName).testFiles.push(testFile)
      }
    }

    return allOptions
  }
}
