#!/usr/bin/env node
// src/core/discovery/cli-analyzer.js - CLI Structure Analyzer

import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * CLI Structure Analyzer
 *
 * Analyzes CLI applications to understand their command structure,
 * domains, resources, and actions automatically.
 */
export class CLIAnalyzer {
  constructor(options = {}) {
    this.options = {
      timeout: 10000,
      maxDepth: 3,
      includeHidden: false,
      ...options,
    }
    this.cache = new Map()
  }

  /**
   * Analyze CLI structure from multiple sources
   */
  async analyze(options = {}) {
    const { cliPath, packageJsonPath, configPath, helpOutput, ...analyzerOptions } = options

    const results = {
      domains: new Set(),
      resources: new Map(),
      actions: new Set(),
      commands: new Map(),
      structure: {},
      metadata: {},
    }

    // Analyze from CLI help output
    if (cliPath || helpOutput) {
      const cliAnalysis = await this.analyzeFromCLI(cliPath, helpOutput, analyzerOptions)
      this.mergeResults(results, cliAnalysis)
    }

    // Analyze from package.json scripts
    if (packageJsonPath) {
      const packageAnalysis = await this.analyzeFromPackageJson(packageJsonPath)
      this.mergeResults(results, packageAnalysis)
    }

    // Analyze from configuration files
    if (configPath) {
      const configAnalysis = await this.analyzeFromConfig(configPath)
      this.mergeResults(results, configAnalysis)
    }

    return this.normalizeResults(results)
  }

  /**
   * Analyze CLI structure from help output
   */
  async analyzeFromCLI(cliPath, helpOutput = null, options = {}) {
    const cacheKey = `cli:${cliPath}:${JSON.stringify(options)}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      let output = helpOutput

      if (!output && cliPath) {
        output = await this.getCLIHelpOutput(cliPath, options)
      }

      if (!output) {
        return { domains: [], resources: {}, actions: [], commands: {} }
      }

      const analysis = this.parseHelpOutput(output)
      this.cache.set(cacheKey, analysis)
      return analysis
    } catch (error) {
      console.warn(`Failed to analyze CLI at ${cliPath}:`, error.message)
      return { domains: [], resources: {}, actions: [], commands: {} }
    }
  }

  /**
   * Get CLI help output
   */
  async getCLIHelpOutput(cliPath, options = {}) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('CLI analysis timeout'))
      }, this.options.timeout)

      const child = spawn('node', [cliPath, '--help'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env },
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
        clearTimeout(timeout)
        if (code === 0) {
          resolve(stdout)
        } else {
          // Try stderr if stdout is empty
          resolve(stderr || stdout)
        }
      })

      child.on('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
    })
  }

  /**
   * Parse help output to extract command structure
   */
  parseHelpOutput(output) {
    const lines = output.split('\n')
    const domains = new Set()
    const resources = new Map()
    const actions = new Set()
    const commands = new Map()

    let inCommandsSection = false
    let currentDomain = null

    for (const line of lines) {
      const trimmed = line.trim()

      // Detect commands section
      if (
        trimmed.toLowerCase().includes('commands:') ||
        trimmed.toLowerCase().includes('usage:') ||
        trimmed.toLowerCase().includes('available commands:')
      ) {
        inCommandsSection = true
        continue
      }

      if (!inCommandsSection) continue

      // Skip empty lines and separators
      if (!trimmed || trimmed.startsWith('-') || trimmed.startsWith('=')) {
        continue
      }

      // Parse command patterns - look for patterns like "infra server create <name>"
      // Handle both indented and non-indented commands
      const commandMatch = trimmed.match(/^\s*(\w+)\s+(\w+)\s+(\w+)/)
      if (commandMatch) {
        const [, domain, resource, action] = commandMatch
        domains.add(domain)

        if (!resources.has(domain)) {
          resources.set(domain, new Set())
        }
        resources.get(domain).add(resource)
        actions.add(action)

        commands.set(`${domain} ${resource} ${action}`, {
          domain,
          resource,
          action,
          description: this.extractDescription(trimmed),
        })
      } else {
        // Try simpler patterns
        const simpleMatch = trimmed.match(/^\s*(\w+)\s+(\w+)/)
        if (simpleMatch) {
          const [, part1, part2] = simpleMatch
          if (this.isLikelyAction(part2)) {
            // part1 is resource, part2 is action
            domains.add('default')
            if (!resources.has('default')) {
              resources.set('default', new Set())
            }
            resources.get('default').add(part1)
            actions.add(part2)
          } else {
            // part1 is domain, part2 is resource
            domains.add(part1)
            if (!resources.has(part1)) {
              resources.set(part1, new Set())
            }
            resources.get(part1).add(part2)
          }
        } else {
          // Single word - could be domain or command
          const singleMatch = trimmed.match(/^\s*(\w+)/)
          if (singleMatch) {
            domains.add(singleMatch[1])
          }
        }
      }
    }

    return {
      domains: Array.from(domains),
      resources: Object.fromEntries(
        Array.from(resources.entries()).map(([domain, resources]) => [
          domain,
          Array.from(resources),
        ])
      ),
      actions: Array.from(actions),
      commands: Object.fromEntries(commands),
    }
  }

  /**
   * Parse individual command line
   */
  parseCommandLine(line) {
    // Common patterns to match
    const patterns = [
      // Pattern: domain resource action [args...]
      /^(\w+)\s+(\w+)\s+(\w+)(?:\s|$)/,
      // Pattern: domain resource [action] [args...]
      /^(\w+)\s+(\w+)(?:\s|$)/,
      // Pattern: domain [args...]
      /^(\w+)(?:\s|$)/,
      // Pattern: resource action [args...]
      /^(\w+)\s+(\w+)(?:\s|$)/,
    ]

    for (const pattern of patterns) {
      const match = line.match(pattern)
      if (match) {
        const [, part1, part2, part3] = match
        const fullCommand = line.split(/\s+/)[0]

        // Determine what each part represents based on context
        if (part3) {
          return {
            domain: part1,
            resource: part2,
            action: part3,
            fullCommand,
          }
        } else if (part2) {
          // Could be domain resource or resource action
          if (this.isLikelyAction(part2)) {
            return {
              domain: null,
              resource: part1,
              action: part2,
              fullCommand,
            }
          } else {
            return {
              domain: part1,
              resource: part2,
              action: null,
              fullCommand,
            }
          }
        } else {
          return {
            domain: part1,
            resource: null,
            action: null,
            fullCommand,
          }
        }
      }
    }

    return null
  }

  /**
   * Check if a word is likely an action
   */
  isLikelyAction(word) {
    const commonActions = [
      'create',
      'add',
      'new',
      'make',
      'build',
      'list',
      'show',
      'get',
      'find',
      'search',
      'update',
      'edit',
      'modify',
      'change',
      'delete',
      'remove',
      'destroy',
      'kill',
      'start',
      'stop',
      'restart',
      'run',
      'deploy',
      'publish',
      'release',
      'test',
      'check',
      'validate',
      'verify',
      'backup',
      'restore',
      'sync',
      'configure',
      'setup',
      'init',
    ]

    return commonActions.includes(word.toLowerCase())
  }

  /**
   * Extract description from command line
   */
  extractDescription(line) {
    // Look for description after command (usually after 2+ spaces or a dash)
    const descMatch = line.match(/\s{2,}(.+)$|-\s*(.+)$/)
    return descMatch ? (descMatch[1] || descMatch[2]).trim() : ''
  }

  /**
   * Analyze from package.json scripts
   */
  async analyzeFromPackageJson(packageJsonPath) {
    try {
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))
      const scripts = packageJson.scripts || {}

      const domains = new Set()
      const commands = new Map()

      for (const [scriptName, scriptCommand] of Object.entries(scripts)) {
        // Parse script names like "infra:server:create" or "dev:project:build"
        const parts = scriptName.split(':')
        if (parts.length >= 2) {
          const domain = parts[0]
          domains.add(domain)

          commands.set(scriptName, {
            domain,
            resource: parts[1] || null,
            action: parts[2] || null,
            command: scriptCommand,
            type: 'script',
          })
        }
      }

      return {
        domains: Array.from(domains),
        commands: Object.fromEntries(commands),
        metadata: {
          source: 'package.json',
          scriptsCount: Object.keys(scripts).length,
        },
      }
    } catch (error) {
      console.warn(`Failed to analyze package.json at ${packageJsonPath}:`, error.message)
      return { domains: [], commands: {} }
    }
  }

  /**
   * Analyze from configuration files
   */
  async analyzeFromConfig(configPath) {
    try {
      if (!existsSync(configPath)) {
        return { domains: [], commands: {} }
      }

      const config = JSON.parse(await readFile(configPath, 'utf8'))

      const domains = config.domains ? Object.keys(config.domains) : []
      const resources = {}
      
      if (config.domains) {
        Object.entries(config.domains).forEach(([domainName, domainConfig]) => {
          if (domainConfig.resources) {
            resources[domainName] = domainConfig.resources.map(r => r.name)
          }
        })
      }

      return {
        domains,
        resources,
        actions: config.actions || [],
        commands: config.commands || {},
        metadata: {
          source: 'config',
          configPath,
        },
      }
    } catch (error) {
      console.warn(`Failed to analyze config at ${configPath}:`, error.message)
      return { domains: [], commands: {} }
    }
  }

  /**
   * Merge analysis results
   */
  mergeResults(target, source) {
    // Merge domains
    if (source.domains) {
      source.domains.forEach((domain) => target.domains.add(domain))
    }

    // Merge resources
    if (source.resources) {
      Object.entries(source.resources).forEach(([domain, resources]) => {
        if (!target.resources.has(domain)) {
          target.resources.set(domain, new Set())
        }
        resources.forEach((resource) => target.resources.get(domain).add(resource))
      })
    }

    // Merge actions
    if (source.actions) {
      source.actions.forEach((action) => target.actions.add(action))
    }

    // Merge commands
    if (source.commands) {
      Object.assign(target.commands, source.commands)
    }

    // Merge metadata
    if (source.metadata) {
      Object.assign(target.metadata, source.metadata)
    }
  }

  /**
   * Normalize results to consistent format
   */
  normalizeResults(results) {
    return {
      domains: Array.from(results.domains),
      resources: Object.fromEntries(
        Array.from(results.resources.entries()).map(([domain, resources]) => [
          domain,
          Array.from(resources),
        ])
      ),
      actions: Array.from(results.actions),
      commands: results.commands,
      metadata: {
        ...results.metadata,
        analyzedAt: new Date().toISOString(),
        totalDomains: results.domains.size,
        totalCommands: Object.keys(results.commands).length,
      },
    }
  }

  /**
   * Clear analysis cache
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

export default CLIAnalyzer
