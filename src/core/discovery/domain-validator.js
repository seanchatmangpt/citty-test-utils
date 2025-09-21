#!/usr/bin/env node
// src/core/discovery/domain-validator.js - Domain Validation and Fallback System

import { spawn } from 'node:child_process'

/**
 * Domain Validator
 *
 * Validates domains against CLI structure and provides fallback strategies
 */
export class DomainValidator {
  constructor(options = {}) {
    this.options = {
      validateAgainstCLI: true,
      fallbackStrategy: 'generic',
      autoCreateDomains: true,
      strictValidation: false,
      ...options,
    }
    this.validationCache = new Map()
    this.fallbackStrategies = new Map()
    this.registerDefaultStrategies()
  }

  /**
   * Register default fallback strategies
   */
  registerDefaultStrategies() {
    this.registerFallbackStrategy('generic', this.genericFallback.bind(this))
    this.registerFallbackStrategy('error', this.errorFallback.bind(this))
    this.registerFallbackStrategy('auto-discover', this.autoDiscoverFallback.bind(this))
    this.registerFallbackStrategy('ignore', this.ignoreFallback.bind(this))
  }

  /**
   * Register a fallback strategy
   */
  registerFallbackStrategy(name, strategy) {
    this.fallbackStrategies.set(name, strategy)
  }

  /**
   * Validate domain against CLI
   */
  async validateDomain(domain, cliPath, options = {}) {
    const { cacheEnabled = true, timeout = 10000 } = options

    const cacheKey = `validate:${domain.name}:${cliPath}`

    if (cacheEnabled && this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)
    }

    try {
      const cliStructure = await this.analyzeCLIStructure(cliPath, { timeout })
      const validation = this.validateDomainStructure(domain, cliStructure)

      if (cacheEnabled) {
        this.validationCache.set(cacheKey, validation)
      }

      return validation
    } catch (error) {
      return {
        valid: false,
        errors: [`CLI analysis failed: ${error.message}`],
        warnings: [],
        suggestions: [],
      }
    }
  }

  /**
   * Analyze CLI structure
   */
  async analyzeCLIStructure(cliPath, options = {}) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('CLI analysis timeout'))
      }, options.timeout || 10000)

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
          resolve(this.parseCLIOutput(stdout))
        } else {
          resolve(this.parseCLIOutput(stderr || stdout))
        }
      })

      child.on('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
    })
  }

  /**
   * Parse CLI output to extract structure
   */
  parseCLIOutput(output) {
    const lines = output.split('\n')
    const commands = new Set()
    const domains = new Set()
    const resources = new Set()
    const actions = new Set()

    let inCommandsSection = false

    for (const line of lines) {
      const trimmed = line.trim()

      if (trimmed.toLowerCase().includes('commands:') || trimmed.toLowerCase().includes('usage:')) {
        inCommandsSection = true
        continue
      }

      if (!inCommandsSection) continue

      // Extract command patterns
      const commandMatch = trimmed.match(/^(\w+)(?:\s+(\w+))?(?:\s+(\w+))?/)
      if (commandMatch) {
        const [, part1, part2, part3] = commandMatch
        commands.add(part1)

        if (part2) {
          commands.add(`${part1} ${part2}`)
          if (part3) {
            commands.add(`${part1} ${part2} ${part3}`)
          }
        }
      }
    }

    return {
      commands: Array.from(commands),
      domains: Array.from(domains),
      resources: Array.from(resources),
      actions: Array.from(actions),
    }
  }

  /**
   * Validate domain structure against CLI
   */
  validateDomainStructure(domain, cliStructure) {
    const errors = []
    const warnings = []
    const suggestions = []

    // Check if domain commands exist in CLI
    if (domain.resources) {
      domain.resources.forEach((resource) => {
        if (resource.actions) {
          resource.actions.forEach((action) => {
            const command = `${domain.name} ${resource.name} ${action}`
            if (!cliStructure.commands.some((cmd) => cmd.includes(command))) {
              if (this.options.strictValidation) {
                errors.push(`Command '${command}' not found in CLI`)
              } else {
                warnings.push(`Command '${command}' not found in CLI`)
                suggestions.push(
                  `Consider adding '${command}' to your CLI or removing it from domain definition`
                )
              }
            }
          })
        }
      })
    }

    // Check for unused CLI commands
    const domainCommands = this.generateDomainCommands(domain)
    const unusedCommands = cliStructure.commands.filter(
      (cmd) => !domainCommands.some((domainCmd) => cmd.includes(domainCmd))
    )

    if (unusedCommands.length > 0) {
      suggestions.push(
        `Found ${unusedCommands.length} CLI commands not covered by domain: ${unusedCommands
          .slice(0, 5)
          .join(', ')}`
      )
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      coverage: this.calculateCoverage(domain, cliStructure),
    }
  }

  /**
   * Generate all possible commands from domain
   */
  generateDomainCommands(domain) {
    const commands = []

    if (domain.resources) {
      domain.resources.forEach((resource) => {
        if (resource.actions) {
          resource.actions.forEach((action) => {
            commands.push(`${domain.name} ${resource.name} ${action}`)
          })
        }
      })
    }

    return commands
  }

  /**
   * Calculate domain coverage of CLI
   */
  calculateCoverage(domain, cliStructure) {
    const domainCommands = this.generateDomainCommands(domain)
    const coveredCommands = cliStructure.commands.filter((cmd) =>
      domainCommands.some((domainCmd) => cmd.includes(domainCmd))
    )

    return {
      total: cliStructure.commands.length,
      covered: coveredCommands.length,
      percentage:
        cliStructure.commands.length > 0
          ? (coveredCommands.length / cliStructure.commands.length) * 100
          : 100,
    }
  }

  /**
   * Handle domain validation failure
   */
  async handleValidationFailure(domain, cliPath, validation) {
    const strategy = this.fallbackStrategies.get(this.options.fallbackStrategy)
    if (!strategy) {
      throw new Error(`Unknown fallback strategy: ${this.options.fallbackStrategy}`)
    }

    return await strategy(domain, cliPath, validation)
  }

  /**
   * Generic fallback strategy
   */
  async genericFallback(domain, cliPath, validation) {
    console.warn(`Domain '${domain.name}' validation failed, using generic fallback`)

    return {
      domain: {
        ...domain,
        category: 'generic',
        description: `Generic domain: ${domain.name} (auto-generated)`,
        resources: domain.resources || [
          {
            name: 'default',
            displayName: 'Default',
            description: 'Default resource',
            actions: ['create', 'list', 'show', 'update', 'delete'],
            attributes: [],
            relationships: [],
          },
        ],
        actions: domain.actions || [
          {
            name: 'create',
            description: 'Create resource',
            category: 'CRUD',
            requires: [],
            optional: [],
          },
        ],
      },
      warnings: validation.warnings,
      fallback: 'generic',
    }
  }

  /**
   * Error fallback strategy
   */
  async errorFallback(domain, cliPath, validation) {
    throw new Error(`Domain '${domain.name}' validation failed: ${validation.errors.join(', ')}`)
  }

  /**
   * Auto-discover fallback strategy
   */
  async autoDiscoverFallback(domain, cliPath, validation) {
    console.warn(`Domain '${domain.name}' validation failed, attempting auto-discovery`)

    try {
      const cliStructure = await this.analyzeCLIStructure(cliPath)
      const discoveredDomain = this.discoverDomainFromCLI(domain.name, cliStructure)

      return {
        domain: discoveredDomain,
        warnings: validation.warnings,
        fallback: 'auto-discover',
      }
    } catch (error) {
      return this.genericFallback(domain, cliPath, validation)
    }
  }

  /**
   * Ignore fallback strategy
   */
  async ignoreFallback(domain, cliPath, validation) {
    console.warn(`Domain '${domain.name}' validation failed, ignoring`)

    return {
      domain,
      warnings: validation.warnings,
      fallback: 'ignore',
    }
  }

  /**
   * Discover domain from CLI structure
   */
  discoverDomainFromCLI(domainName, cliStructure) {
    const domainCommands = cliStructure.commands.filter((cmd) => cmd.startsWith(`${domainName} `))

    const resources = new Map()

    domainCommands.forEach((cmd) => {
      const parts = cmd.split(' ')
      if (parts.length >= 3) {
        const resource = parts[1]
        const action = parts[2]

        if (!resources.has(resource)) {
          resources.set(resource, new Set())
        }
        resources.get(resource).add(action)
      }
    })

    return {
      name: domainName,
      displayName: domainName.charAt(0).toUpperCase() + domainName.slice(1),
      description: `Auto-discovered domain: ${domainName}`,
      category: 'discovered',
      resources: Array.from(resources.entries()).map(([name, actions]) => ({
        name,
        displayName: name.charAt(0).toUpperCase() + name.slice(1),
        description: `Discovered resource: ${name}`,
        actions: Array.from(actions),
        attributes: [],
        relationships: [],
      })),
      actions: Array.from(new Set(Array.from(resources.values()).flat())).map((name) => ({
        name,
        description: `Discovered action: ${name}`,
        category: 'Discovered',
        requires: [],
        optional: [],
      })),
    }
  }

  /**
   * Validate multiple domains
   */
  async validateDomains(domains, cliPath, options = {}) {
    const results = []

    for (const domain of domains) {
      try {
        const validation = await this.validateDomain(domain, cliPath, options)
        if (!validation.valid && this.options.fallbackStrategy !== 'error') {
          const fallback = await this.handleValidationFailure(domain, cliPath, validation)
          results.push(fallback)
        } else {
          results.push({
            domain,
            validation,
            fallback: null,
          })
        }
      } catch (error) {
        results.push({
          domain,
          validation: { valid: false, errors: [error.message] },
          fallback: null,
          error: error.message,
        })
      }
    }

    return results
  }

  /**
   * Clear validation cache
   */
  clearCache() {
    this.validationCache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.validationCache.size,
      keys: Array.from(this.validationCache.keys()),
    }
  }
}

export default DomainValidator
