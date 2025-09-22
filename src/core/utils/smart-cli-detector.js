#!/usr/bin/env node
/**
 * @fileoverview Smart CLI Detection Utility
 * @description Automatically detects CLI entry points from package.json and project structure
 */

import { readFileSync, existsSync, statSync } from 'fs'
import { join, resolve } from 'path'
import { cwd } from 'process'

/**
 * Smart CLI Detection Utility
 * Automatically detects CLI entry points from package.json and project structure
 */
export class SmartCLIDetector {
  constructor(options = {}) {
    this.options = {
      workingDir: options.workingDir || cwd(),
      verbose: options.verbose || false,
      ...options,
    }
  }

  /**
   * Detect CLI entry point for the current project
   * @param {Object} options - Detection options
   * @returns {Promise<Object>} CLI detection result
   */
  async detectCLI(options = {}) {
    const detectionOptions = { ...this.options, ...options }

    if (detectionOptions.verbose) {
      console.log('🔍 Starting smart CLI detection...')
      console.log(`Working directory: ${detectionOptions.workingDir}`)
    }

    try {
      // Step 1: Check for package.json in current directory
      const packageJsonPath = join(detectionOptions.workingDir, 'package.json')
      if (existsSync(packageJsonPath)) {
        const packageJson = this.readPackageJson(packageJsonPath)
        const binResult = this.detectFromBin(packageJson, detectionOptions.workingDir)
        if (binResult) {
          if (detectionOptions.verbose) {
            console.log(`✅ Found CLI via package.json bin: ${binResult.cliPath}`)
          }
          return binResult
        }
      }

      // Step 2: Check for common CLI file patterns
      const commonPatterns = [
        'src/cli.mjs',
        'src/cli.js',
        'cli.mjs',
        'cli.js',
        'index.mjs',
        'index.js',
        'bin/cli.mjs',
        'bin/cli.js',
        'bin/index.mjs',
        'bin/index.js',
      ]

      for (const pattern of commonPatterns) {
        const cliPath = join(detectionOptions.workingDir, pattern)
        if (existsSync(cliPath)) {
          const stat = statSync(cliPath)
          if (stat.isFile()) {
            if (detectionOptions.verbose) {
              console.log(`✅ Found CLI via common pattern: ${cliPath}`)
            }
            return {
              cliPath,
              detectionMethod: 'common-pattern',
              confidence: 'medium',
              packageName: this.getPackageName(detectionOptions.workingDir),
            }
          }
        }
      }

      // Step 3: Check parent directories for package.json
      const parentResult = await this.checkParentDirectories(detectionOptions.workingDir)
      if (parentResult) {
        if (detectionOptions.verbose) {
          console.log(`✅ Found CLI via parent directory: ${parentResult.cliPath}`)
        }
        return parentResult
      }

      // Step 4: No CLI found
      if (detectionOptions.verbose) {
        console.log('❌ No CLI entry point detected')
      }
      return {
        cliPath: null,
        detectionMethod: 'none',
        confidence: 'none',
        error: 'No CLI entry point found in project structure',
      }
    } catch (error) {
      throw new Error(`Smart CLI detection failed: ${error.message}`)
    }
  }

  /**
   * Detect CLI from package.json bin field
   * @param {Object} packageJson - Package.json object
   * @param {string} workingDir - Working directory
   * @returns {Object|null} CLI detection result
   */
  detectFromBin(packageJson, workingDir) {
    if (!packageJson.bin) return null

    let binPath = null
    let binName = null

    // Handle different bin formats
    if (typeof packageJson.bin === 'string') {
      binPath = packageJson.bin
      binName = packageJson.name
    } else if (typeof packageJson.bin === 'object') {
      // Get the first bin entry
      const entries = Object.entries(packageJson.bin)
      if (entries.length > 0) {
        binName = entries[0][0]
        binPath = entries[0][1]
      }
    }

    if (!binPath) return null

    // Resolve the bin path
    const resolvedPath = resolve(workingDir, binPath)

    if (existsSync(resolvedPath)) {
      return {
        cliPath: resolvedPath,
        binName,
        packageName: packageJson.name,
        detectionMethod: 'package-json-bin',
        confidence: 'high',
        packageJson: {
          name: packageJson.name,
          version: packageJson.version,
          description: packageJson.description,
        },
      }
    }

    return null
  }

  /**
   * Check parent directories for package.json
   * @param {string} startDir - Starting directory
   * @returns {Promise<Object|null>} CLI detection result
   */
  async checkParentDirectories(startDir) {
    let currentDir = startDir
    const maxDepth = 5 // Prevent infinite loops
    let depth = 0

    while (depth < maxDepth) {
      const parentDir = join(currentDir, '..')

      // Check if we've reached the filesystem root
      if (parentDir === currentDir) {
        break
      }

      const packageJsonPath = join(parentDir, 'package.json')
      if (existsSync(packageJsonPath)) {
        const packageJson = this.readPackageJson(packageJsonPath)
        const binResult = this.detectFromBin(packageJson, parentDir)
        if (binResult) {
          return {
            ...binResult,
            detectionMethod: 'parent-package-json-bin',
            confidence: 'medium',
          }
        }
      }

      currentDir = parentDir
      depth++
    }

    return null
  }

  /**
   * Read and parse package.json
   * @param {string} packageJsonPath - Path to package.json
   * @returns {Object} Parsed package.json
   */
  readPackageJson(packageJsonPath) {
    try {
      const content = readFileSync(packageJsonPath, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      throw new Error(`Failed to read package.json at ${packageJsonPath}: ${error.message}`)
    }
  }

  /**
   * Get package name from directory
   * @param {string} dir - Directory path
   * @returns {string} Package name
   */
  getPackageName(dir) {
    try {
      const packageJsonPath = join(dir, 'package.json')
      if (existsSync(packageJsonPath)) {
        const packageJson = this.readPackageJson(packageJsonPath)
        return packageJson.name || 'unknown'
      }
    } catch (error) {
      // Ignore errors
    }
    return 'unknown'
  }

  /**
   * Validate detected CLI
   * @param {string} cliPath - Path to CLI file
   * @returns {Object} Validation result
   */
  validateCLI(cliPath) {
    if (!cliPath || !existsSync(cliPath)) {
      return {
        valid: false,
        error: 'CLI file does not exist',
      }
    }

    try {
      const content = readFileSync(cliPath, 'utf8')

      // Basic validation checks
      const hasShebang = content.startsWith('#!')
      const hasDefineCommand = content.includes('defineCommand')
      const hasExport = content.includes('export')
      const hasImport = content.includes('import')

      return {
        valid: true,
        hasShebang,
        hasDefineCommand,
        hasExport,
        hasImport,
        fileSize: content.length,
        lineCount: content.split('\n').length,
      }
    } catch (error) {
      return {
        valid: false,
        error: `Failed to read CLI file: ${error.message}`,
      }
    }
  }

  /**
   * Get CLI usage information
   * @param {string} cliPath - Path to CLI file
   * @returns {Object} Usage information
   */
  getCLIUsage(cliPath) {
    if (!cliPath || !existsSync(cliPath)) {
      return {
        available: false,
        error: 'CLI file does not exist',
      }
    }

    try {
      // Try to get help output
      const { spawn } = require('child_process')

      return new Promise((resolve) => {
        const child = spawn('node', [cliPath, '--help'], {
          stdio: ['pipe', 'pipe', 'pipe'],
        })

        let stdout = ''
        let stderr = ''

        child.stdout.on('data', (data) => {
          stdout += data.toString()
        })

        child.stderr.on('data', (data) => {
          stderr += data.toString()
        })

        child.on('close', (code) => {
          resolve({
            available: code === 0,
            exitCode: code,
            stdout,
            stderr,
            helpAvailable: stdout.includes('USAGE') || stdout.includes('Usage'),
          })
        })

        child.on('error', (error) => {
          resolve({
            available: false,
            error: error.message,
          })
        })
      })
    } catch (error) {
      return {
        available: false,
        error: `Failed to execute CLI: ${error.message}`,
      }
    }
  }
}
