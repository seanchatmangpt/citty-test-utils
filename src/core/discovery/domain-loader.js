#!/usr/bin/env node
// src/core/discovery/domain-loader.js - Domain Loader with Multiple Sources

import { readFile, readdir } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import { resolve, extname, basename } from 'node:path'
import { CLIAnalyzer } from './cli-analyzer.js'

/**
 * Domain Loader
 *
 * Loads domains from multiple sources and provides a unified interface
 * for domain discovery and management.
 */
export class DomainLoader {
  constructor(options = {}) {
    this.options = {
      sources: [],
      cacheEnabled: true,
      validateDomains: true,
      fallbackStrategy: 'generic',
      autoCreateDomains: true,
      ...options,
    }
    this.cache = new Map()
    this.analyzer = new CLIAnalyzer()
    this.loadedDomains = new Map()
    this.sourceRegistry = new Map()
  }

  /**
   * Register a domain source
   */
  registerSource(name, source) {
    this.sourceRegistry.set(name, {
      name,
      loader: source.loader,
      validator: source.validator,
      priority: source.priority || 0,
      enabled: source.enabled !== false,
    })
  }

  /**
   * Load domains from all configured sources
   */
  async loadAll(options = {}) {
    const { sources = this.options.sources, forceRefresh = false, ...loadOptions } = options

    const cacheKey = `all:${JSON.stringify(sources)}`

    if (this.options.cacheEnabled && !forceRefresh && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    const results = {
      domains: new Map(),
      resources: new Map(),
      actions: new Set(),
      commands: new Map(),
      metadata: {
        sources: [],
        loadedAt: new Date().toISOString(),
        errors: [],
      },
    }

    // Sort sources by priority
    const sortedSources = this.getSortedSources(sources)

    for (const source of sortedSources) {
      try {
        const sourceResult = await this.loadFromSource(source.name, loadOptions)
        this.mergeSourceResults(results, sourceResult, source.name)
        results.metadata.sources.push({
          name: source.name,
          success: true,
          domainsCount: sourceResult.domains?.length || 0,
        })
      } catch (error) {
        results.metadata.errors.push({
          source: source.name,
          error: error.message,
        })
        console.warn(`Failed to load from source ${source.name}:`, error.message)
      }
    }

    const finalResult = this.normalizeResults(results)

    if (this.options.cacheEnabled) {
      this.cache.set(cacheKey, finalResult)
    }

    return finalResult
  }

  /**
   * Load domains from a specific source
   */
  async loadFromSource(source, options = {}) {
    const sourceConfig = this.sourceRegistry.get(source)
    if (!sourceConfig || !sourceConfig.enabled) {
      throw new Error(`Source ${source} not found or disabled`)
    }

    return await sourceConfig.loader(options)
  }

  /**
   * Load from CLI analysis
   */
  async loadFromCLI(options = {}) {
    const { cliPath, helpOutput, packageJsonPath, configPath } = options

    return await this.analyzer.analyze({
      cliPath,
      helpOutput,
      packageJsonPath,
      configPath,
    })
  }

  /**
   * Load from configuration file
   */
  async loadFromConfig(options = {}) {
    const { configPath, config } = options

    if (config) {
      return this.parseConfigObject(config)
    }

    if (!configPath) {
      throw new Error('Config path or config object required')
    }

    if (!existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`)
    }

    const content = await readFile(configPath, 'utf8')
    const configData = this.parseConfigFile(content, configPath)

    return this.parseConfigObject(configData)
  }

  /**
   * Load from directory of domain files
   */
  async loadFromDirectory(options = {}) {
    const { directory, pattern = '*.domain.js', recursive = true } = options

    if (!existsSync(directory)) {
      throw new Error(`Directory not found: ${directory}`)
    }

    const files = await this.findDomainFiles(directory, pattern, recursive)
    const domains = new Map()

    for (const file of files) {
      try {
        const domain = await this.loadDomainFile(file)
        if (domain) {
          domains.set(domain.name, domain)
        }
      } catch (error) {
        console.warn(`Failed to load domain file ${file}:`, error.message)
      }
    }

    return this.convertDomainsToStructure(domains)
  }

  /**
   * Load from package.json
   */
  async loadFromPackageJson(options = {}) {
    const { packageJsonPath = './package.json' } = options

    if (!existsSync(packageJsonPath)) {
      throw new Error(`Package.json not found: ${packageJsonPath}`)
    }

    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))
    const scripts = packageJson.scripts || {}
    const domains = new Map()

    for (const [scriptName, scriptCommand] of Object.entries(scripts)) {
      const domainInfo = this.parseScriptName(scriptName, scriptCommand)
      if (domainInfo) {
        const { domain, resource, action } = domainInfo

        if (!domains.has(domain)) {
          domains.set(domain, {
            name: domain,
            resources: new Map(),
            actions: new Set(),
          })
        }

        if (resource) {
          if (!domains.get(domain).resources.has(resource)) {
            domains.get(domain).resources.set(resource, new Set())
          }
          if (action) {
            domains.get(domain).resources.get(resource).add(action)
          }
        }

        if (action) {
          domains.get(domain).actions.add(action)
        }
      }
    }

    return this.convertDomainsToStructure(domains)
  }

  /**
   * Load from environment variables
   */
  async loadFromEnvironment(options = {}) {
    const { prefix = 'CITTY_DOMAIN_' } = options
    const domains = new Map()

    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix)) {
        const domainName = key.substring(prefix.length).toLowerCase()
        try {
          const domainConfig = JSON.parse(value)
          domains.set(domainName, domainConfig)
        } catch (error) {
          // Treat as simple domain name
          domains.set(domainName, {
            name: domainName,
            resources: [],
            actions: [],
          })
        }
      }
    }

    return this.convertDomainsToStructure(domains)
  }

  /**
   * Load from plugins
   */
  async loadFromPlugins(options = {}) {
    const { pluginDirectory = './plugins', pattern = '*.plugin.js' } = options

    if (!existsSync(pluginDirectory)) {
      return { domains: [], resources: {}, actions: [], commands: {} }
    }

    const pluginFiles = await this.findDomainFiles(pluginDirectory, pattern, true)
    const domains = new Map()

    for (const file of pluginFiles) {
      try {
        const plugin = await import(resolve(file))
        if (plugin.default && typeof plugin.default === 'function') {
          const pluginDomains = await plugin.default()
          if (Array.isArray(pluginDomains)) {
            pluginDomains.forEach((domain) => {
              domains.set(domain.name, domain)
            })
          }
        }
      } catch (error) {
        console.warn(`Failed to load plugin ${file}:`, error.message)
      }
    }

    return this.convertDomainsToStructure(domains)
  }

  /**
   * Parse script name to extract domain info
   */
  parseScriptName(scriptName, scriptCommand) {
    // Patterns: "domain:resource:action", "domain:resource", "domain"
    const parts = scriptName.split(':')

    if (parts.length >= 3) {
      return {
        domain: parts[0],
        resource: parts[1],
        action: parts[2],
      }
    } else if (parts.length === 2) {
      return {
        domain: parts[0],
        resource: parts[1],
        action: null,
      }
    } else if (parts.length === 1) {
      return {
        domain: parts[0],
        resource: null,
        action: null,
      }
    }

    return null
  }

  /**
   * Find domain files in directory
   */
  async findDomainFiles(directory, pattern, recursive) {
    const files = []
    const entries = await readdir(directory, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = resolve(directory, entry.name)

      if (entry.isDirectory() && recursive) {
        const subFiles = await this.findDomainFiles(fullPath, pattern, recursive)
        files.push(...subFiles)
      } else if (entry.isFile()) {
        if (this.matchesPattern(entry.name, pattern)) {
          files.push(fullPath)
        }
      }
    }

    return files
  }

  /**
   * Check if filename matches pattern
   */
  matchesPattern(filename, pattern) {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'))
      return regex.test(filename)
    }
    return filename === pattern
  }

  /**
   * Load domain from file
   */
  async loadDomainFile(filePath) {
    const ext = extname(filePath)

    if (ext === '.js' || ext === '.mjs') {
      const module = await import(resolve(filePath))
      return module.default || module
    } else if (ext === '.json') {
      const content = await readFile(filePath, 'utf8')
      return JSON.parse(content)
    } else {
      throw new Error(`Unsupported file type: ${ext}`)
    }
  }

  /**
   * Parse config file based on extension
   */
  parseConfigFile(content, filePath) {
    const ext = extname(filePath)

    if (ext === '.json') {
      return JSON.parse(content)
    } else if (ext === '.js' || ext === '.mjs') {
      // For JS files, we'd need to evaluate them
      throw new Error('JS config files not supported in this context')
    } else {
      throw new Error(`Unsupported config file type: ${ext}`)
    }
  }

  /**
   * Parse config object
   */
  parseConfigObject(config) {
    const domains = new Map()
    const resources = new Map()
    const actions = new Set()
    const commands = new Map()

    if (config.domains) {
      Object.entries(config.domains).forEach(([name, domainConfig]) => {
        domains.set(name, {
          name,
          ...domainConfig,
        })

        if (domainConfig.resources) {
          resources.set(name, domainConfig.resources)
        }
      })
    }

    if (config.actions) {
      config.actions.forEach((action) => actions.add(action))
    }

    if (config.commands) {
      Object.assign(commands, config.commands)
    }

    return {
      domains: Array.from(domains.keys()),
      resources: Object.fromEntries(resources),
      actions: Array.from(actions),
      commands: Object.fromEntries(commands),
      metadata: {
        source: 'config',
        configKeys: Object.keys(config),
      },
    }
  }

  /**
   * Convert domains map to structure format
   */
  convertDomainsToStructure(domains) {
    const resources = new Map()
    const actions = new Set()
    const commands = new Map()

    domains.forEach((domain, domainName) => {
      if (domain.resources) {
        resources.set(domainName, Array.from(domain.resources.keys()))

        domain.resources.forEach((resourceActions, resourceName) => {
          if (resourceActions instanceof Set) {
            resourceActions.forEach((action) => actions.add(action))
          }
        })
      }

      if (domain.actions) {
        domain.actions.forEach((action) => actions.add(action))
      }
    })

    return {
      domains: Array.from(domains.keys()),
      resources: Object.fromEntries(resources),
      actions: Array.from(actions),
      commands: Object.fromEntries(commands),
      metadata: {
        source: 'domains',
        domainCount: domains.size,
      },
    }
  }

  /**
   * Get sorted sources by priority
   */
  getSortedSources(sources) {
    return sources
      .map((source) => this.sourceRegistry.get(source))
      .filter((source) => source && source.enabled)
      .sort((a, b) => b.priority - a.priority)
  }

  /**
   * Merge results from different sources
   */
  mergeSourceResults(target, source, sourceName) {
    // Merge domains
    if (source.domains) {
      source.domains.forEach((domain) => {
        if (!target.domains.has(domain)) {
          target.domains.set(domain, {
            name: domain,
            sources: [sourceName],
          })
        } else {
          target.domains.get(domain).sources.push(sourceName)
        }
      })
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
  }

  /**
   * Normalize final results
   */
  normalizeResults(results) {
    return {
      domains: Array.from(results.domains.keys()),
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
        totalDomains: results.domains.size,
        totalResources: Array.from(results.resources.values()).reduce(
          (sum, resources) => sum + resources.size,
          0
        ),
        totalActions: results.actions.size,
        totalCommands: Object.keys(results.commands).length,
      },
    }
  }

  /**
   * Clear cache
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

export default DomainLoader
