/**
 * @fileoverview FAIL-FAST Enhanced AST-Based CLI Coverage Analyzer
 * @description Uses AST parsing with IMMEDIATE failure on errors
 *
 * CRITICAL CHANGES FROM ORIGINAL:
 * 1. REMOVED parseJavaScriptFileSafe() - now parseJavaScript() throws
 * 2. REMOVED fake "unknown command" fallback on parse failure
 * 3. REMOVED "continue on test file failure" - now throws
 * 4. REMOVED all "return null" on error - now throws with actionable messages
 * 5. ADDED detailed parse error messages with line/column info
 * 6. ADDED specific fixes for common parse failures
 */

import { readdirSync } from 'fs'
import { join } from 'path'
import { parse } from 'acorn'
import { simple as walk } from 'acorn-walk'
import { readFile, isFile, isDirectory } from '../utils/file-utils.js'

/**
 * Parse error with actionable fixes
 */
export class ParseError extends Error {
  constructor(filePath, parseError, content) {
    const location = parseError.loc
      ? `Line ${parseError.loc.line}, Column ${parseError.loc.column}`
      : 'Unknown location'

    // Extract problematic line if location available
    const problemLine = parseError.loc && content
      ? content.split('\n')[parseError.loc.line - 1]
      : null

    super(
      `Failed to parse JavaScript file: ${filePath}\n` +
      `\n` +
      `Parse Error: ${parseError.message}\n` +
      `Location: ${location}\n` +
      `${problemLine ? `\nProblematic line:\n  ${problemLine}\n` : ''}` +
      `\n` +
      `Possible fixes:\n` +
      `  1. Check if file contains valid JavaScript/TypeScript syntax\n` +
      `  2. Ensure all imports are correctly resolved\n` +
      `  3. Run linter: npx eslint ${filePath}\n` +
      `  4. Check for missing/extra brackets, parentheses, or braces\n` +
      `  5. Verify all function declarations are complete\n` +
      `  6. Enable --verbose flag for detailed AST error output\n`
    )
    this.name = 'ParseError'
    this.filePath = filePath
    this.parseError = parseError
    this.location = parseError.loc
  }
}

/**
 * CLI structure discovery error
 */
export class CLIStructureError extends Error {
  constructor(cliPath, reason, details = null) {
    super(
      `Failed to discover CLI structure: ${cliPath}\n` +
      `\n` +
      `Reason: ${reason}\n` +
      `${details ? `Details: ${details}\n` : ''}` +
      `\n` +
      `Possible fixes:\n` +
      `  1. Ensure file exports a CLI definition (defineCommand)\n` +
      `  2. Check if main command has 'meta.name' property\n` +
      `  3. Verify command structure matches expected format\n` +
      `  4. Enable --verbose flag to see AST analysis details\n` +
      `  5. Check example CLI files for correct structure\n`
    )
    this.name = 'CLIStructureError'
    this.cliPath = cliPath
    this.reason = reason
    this.details = details
  }
}

/**
 * Test discovery error
 */
export class TestDiscoveryError extends Error {
  constructor(testDir, reason, failedFiles = []) {
    super(
      `Failed to discover test files: ${testDir}\n` +
      `\n` +
      `Reason: ${reason}\n` +
      `${failedFiles.length > 0 ? `Failed files:\n  - ${failedFiles.join('\n  - ')}\n` : ''}` +
      `\n` +
      `Possible fixes:\n` +
      `  1. Check if test directory exists and is accessible\n` +
      `  2. Ensure test files have correct extensions (.test.js, .spec.js)\n` +
      `  3. Verify test files contain valid JavaScript syntax\n` +
      `  4. Check file permissions: ls -la ${testDir}\n` +
      `  5. Enable --verbose flag to see which files failed\n`
    )
    this.name = 'TestDiscoveryError'
    this.testDir = testDir
    this.reason = reason
    this.failedFiles = failedFiles
  }
}

/**
 * Enhanced AST-Based CLI Coverage Analyzer (FAIL-FAST VERSION)
 */
export class EnhancedASTCLIAnalyzer {
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
   * Parse JavaScript file - THROWS on error
   *
   * @param {string} content - File content
   * @param {string} filePath - File path for error messages
   * @returns {Object} AST
   * @throws {ParseError} On parse failure
   */
  parseJavaScript(content, filePath) {
    // Validate content
    if (!content || typeof content !== 'string') {
      throw new ParseError(
        filePath,
        new Error('Content must be a non-empty string'),
        null
      )
    }

    // Validate file size
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (content.length > MAX_FILE_SIZE) {
      throw new Error(
        `File too large to parse: ${filePath}\n` +
        `\n` +
        `Size: ${(content.length / 1024 / 1024).toFixed(2)} MB\n` +
        `Maximum: ${MAX_FILE_SIZE / 1024 / 1024} MB\n` +
        `\n` +
        `Possible fixes:\n` +
        `  1. Check if this is the correct file to analyze\n` +
        `  2. Increase maxSize limit in configuration\n` +
        `  3. Process file in chunks instead\n` +
        `  4. Remove unnecessary generated code\n`
      )
    }

    // Remove shebang if present
    let cleanContent = content
    if (content.startsWith('#!')) {
      const firstNewline = content.indexOf('\n')
      if (firstNewline !== -1) {
        cleanContent = content.substring(firstNewline + 1)
      }
    }

    // Parse - THROWS on failure
    try {
      return parse(cleanContent, {
        ecmaVersion: 2022,
        sourceType: 'module',
        allowReturnOutsideFunction: true,
        allowImportExportEverywhere: true,
        allowAwaitOutsideFunction: true,
      })
    } catch (error) {
      throw new ParseError(filePath, error, cleanContent)
    }
  }

  /**
   * Discover CLI structure - THROWS on failure
   *
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} CLI hierarchy structure
   * @throws {CLIStructureError} If structure discovery fails
   * @throws {ParseError} If file parsing fails
   */
  async discoverCLIStructureEnhanced(options) {
    const cliPath = options.cliPath || 'src/cli.mjs'

    if (options.verbose) {
      console.log(`🔍 Discovering CLI structure: ${cliPath}`)
    }

    // Read file - THROWS on error (no graceful recovery)
    const content = readFile(cliPath, {
      encoding: 'utf8',
      maxSize: 10 * 1024 * 1024,
    })

    // Parse AST - THROWS on error
    const ast = this.parseJavaScript(content, cliPath)

    // Detect main command - THROWS if not found
    const mainCommand = await this.detectMainCommand(ast)
    if (!mainCommand) {
      throw new CLIStructureError(
        cliPath,
        'Could not identify main command from AST',
        'No defineCommand found with required structure'
      )
    }

    // Build hierarchy
    const cliHierarchy = this.buildHierarchy(mainCommand)

    if (options.verbose) {
      console.log(`✅ Discovered ${cliHierarchy.subcommands.size} subcommands`)
      console.log(`✅ Found ${cliHierarchy.mainCommand.flags.size + cliHierarchy.mainCommand.options.size} main command options`)
    }

    return cliHierarchy
  }

  /**
   * Discover test patterns - THROWS on failure
   *
   * @param {Object} options - Analysis options
   * @param {Object} cliHierarchy - CLI hierarchy structure
   * @returns {Promise<Object>} Test patterns
   * @throws {TestDiscoveryError} If test discovery fails
   * @throws {ParseError} If any test file parsing fails
   */
  async discoverTestPatternsAST(options, cliHierarchy) {
    if (options.verbose) {
      console.log('🧪 Discovering test patterns via AST...')
    }

    const testFiles = this.findTestFiles(options.testDir, options)
    const patterns = new Map()
    const failedFiles = []

    for (const testFile of testFiles) {
      try {
        // Read file - THROWS on error
        const content = readFile(testFile, {
          encoding: 'utf8',
          maxSize: 10 * 1024 * 1024,
        })

        // Parse AST - THROWS on error
        const ast = this.parseJavaScript(content, testFile)

        // Extract patterns
        walk(ast, {
          CallExpression: (node) => {
            this.extractTestCallPattern(node, patterns, testFile, cliHierarchy)
          },
        })

        if (options.verbose) {
          console.log(`✅ Analyzed ${testFile}`)
        }
      } catch (error) {
        // Collect failed file for comprehensive error
        failedFiles.push({
          file: testFile,
          error: error.message,
        })

        // In fail-fast mode, throw immediately
        throw new TestDiscoveryError(
          options.testDir,
          `Failed to parse test file: ${testFile}`,
          [testFile]
        )
      }
    }

    if (failedFiles.length > 0) {
      throw new TestDiscoveryError(
        options.testDir,
        `${failedFiles.length} test file(s) failed to parse`,
        failedFiles.map(f => `${f.file}: ${f.error}`)
      )
    }

    if (options.verbose) {
      console.log(`✅ Analyzed ${testFiles.length} test files`)
      console.log(`✅ Found ${patterns.size} test patterns`)
    }

    return patterns
  }

  /**
   * Analyze CLI coverage - THROWS on any error
   *
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Coverage analysis results
   * @throws {Error} On any analysis failure
   */
  async analyze(options = {}) {
    const analysisOptions = { ...this.options, ...options }

    if (analysisOptions.verbose) {
      console.log('🚀 Starting Enhanced AST-based CLI coverage analysis (FAIL-FAST MODE)...')
    }

    try {
      // Step 1: Discover CLI structure - THROWS on failure
      const cliHierarchy = await this.discoverCLIStructureEnhanced(analysisOptions)

      // Step 2: Discover test patterns - THROWS on failure
      const testPatterns = await this.discoverTestPatternsAST(analysisOptions, cliHierarchy)

      // Step 3: Map test coverage
      const testCoverage = this.mapTestCoverage(testPatterns, cliHierarchy)

      // Step 4: Calculate coverage
      const coverage = this.calculateCoverage(testCoverage, cliHierarchy)

      // Step 5: Generate report
      const report = this.generateReport(cliHierarchy, testCoverage, coverage, analysisOptions)

      if (analysisOptions.verbose) {
        console.log('✅ Enhanced AST-based CLI coverage analysis complete')
      }

      return report
    } catch (error) {
      // Re-throw with context if not already a specific error type
      if (
        error instanceof ParseError ||
        error instanceof CLIStructureError ||
        error instanceof TestDiscoveryError
      ) {
        throw error
      }

      throw new Error(
        `CLI coverage analysis failed\n` +
        `\n` +
        `Error: ${error.message}\n` +
        `\n` +
        `Possible fixes:\n` +
        `  1. Check that CLI path exists: ${analysisOptions.cliPath}\n` +
        `  2. Check that test directory exists: ${analysisOptions.testDir}\n` +
        `  3. Enable --verbose flag for detailed error information\n` +
        `  4. Verify all files contain valid JavaScript syntax\n` +
        `  5. Check file permissions for all analyzed files\n`
      )
    }
  }

  /**
   * Find test files in directory - THROWS on access errors
   *
   * @param {string} dir - Directory to search
   * @param {Object} options - Search options
   * @returns {Array} Array of test file paths
   * @throws {Error} On directory access failures
   */
  findTestFiles(dir, options) {
    const testFiles = []

    // Check if directory exists
    if (!isDirectory(dir)) {
      throw new Error(
        `Test directory not found or not a directory: ${dir}\n` +
        `\n` +
        `Possible fixes:\n` +
        `  1. Check if directory path is correct\n` +
        `  2. Create test directory: mkdir -p ${dir}\n` +
        `  3. Specify correct test directory with --test-dir flag\n` +
        `  4. Check current working directory: pwd\n`
      )
    }

    try {
      const items = readdirSync(dir)

      for (const item of items) {
        const fullPath = join(dir, item)

        // Skip excluded patterns
        if (options.excludePatterns.some((pattern) => item.includes(pattern))) {
          continue
        }

        if (isDirectory(fullPath)) {
          // Recursively search subdirectories
          testFiles.push(...this.findTestFiles(fullPath, options))
        } else if (isFile(fullPath)) {
          // Check include patterns
          if (options.includePatterns.some((pattern) => item.includes(pattern))) {
            testFiles.push(fullPath)
          }
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to read test directory: ${dir}\n` +
        `\n` +
        `Error: ${error.message}\n` +
        `\n` +
        `Possible fixes:\n` +
        `  1. Check directory permissions: ls -la ${dir}\n` +
        `  2. Ensure directory is readable\n` +
        `  3. Check disk space and file system errors\n` +
        `  4. Verify path is correct: ${dir}\n`
      )
    }

    return testFiles
  }

  // NOTE: The remaining methods (detectMainCommand, buildHierarchy, mapTestCoverage, etc.)
  // would be the same as the original, just without the "safe" wrappers.
  // For brevity, I'm showing the critical changes above.
  // The full implementation would include all methods from the original file.

  /* ... rest of the methods identical to original enhanced-ast-cli-analyzer.js ... */
}
