#!/usr/bin/env node
// src/core/discovery/domain-discovery-orchestrator.js - Main Domain Discovery Orchestrator

import { CLIAnalyzer } from './cli-analyzer.js'
import { DomainLoader } from './domain-loader.js'
import { DomainPluginSystem, builtInPlugins } from './domain-plugin-system.js'
import { RuntimeDomainRegistry } from './runtime-domain-registry.js'
import { DomainValidator } from './domain-validator.js'
import { DomainConfigManager } from './domain-config-manager.js'
import { DomainTemplates } from './domain-templates.js'

/**
 * Domain Discovery Orchestrator
 *
 * Main orchestrator that coordinates all domain discovery and management components
 */
export class DomainDiscoveryOrchestrator {
  constructor(options = {}) {
    this.options = {
      configPath: './citty-test-config.json',
      pluginDirectory: './plugins',
      cliPath: './cli.js',
      packageJsonPath: './package.json',
      autoDiscover: true,
      validateDomains: true,
      fallbackStrategy: 'generic',
      ...options,
    }

    // Initialize components
    this.analyzer = new CLIAnalyzer()
    this.loader = new DomainLoader()
    this.pluginSystem = new DomainPluginSystem()
    this.registry = new RuntimeDomainRegistry()
    this.validator = new DomainValidator()
    this.configManager = new DomainConfigManager()
    this.templates = new DomainTemplates()

    // Register default sources
    this.registerDefaultSources()

    // Load built-in plugins
    this.loadBuiltInPlugins()
  }

  /**
   * Register default domain sources
   */
  registerDefaultSources() {
    // CLI analysis source
    this.loader.registerSource('cli-analysis', {
      loader: async (options) => {
        return await this.analyzer.analyze({
          cliPath: options.cliPath || this.options.cliPath,
          packageJsonPath: options.packageJsonPath || this.options.packageJsonPath,
          configPath: options.configPath || this.options.configPath,
        })
      },
      validator: (result) => result.domains && result.domains.length > 0,
      priority: 10,
    })

    // Configuration source
    this.loader.registerSource('config', {
      loader: async (options) => {
        return await this.configManager.loadConfig(options.configPath)
      },
      validator: (result) => result.domains && Object.keys(result.domains).length > 0,
      priority: 8,
    })

    // Package.json source
    this.loader.registerSource('package-json', {
      loader: async (options) => {
        return await this.loader.loadFromPackageJson({
          packageJsonPath: options.packageJsonPath || this.options.packageJsonPath,
        })
      },
      validator: (result) => result.domains && result.domains.length > 0,
      priority: 6,
    })

    // Plugin source
    this.loader.registerSource('plugins', {
      loader: async (options) => {
        return await this.loader.loadFromPlugins({
          pluginDirectory: options.pluginDirectory || this.options.pluginDirectory,
        })
      },
      validator: (result) => result.domains && result.domains.length > 0,
      priority: 4,
    })

    // Environment source
    this.loader.registerSource('environment', {
      loader: async (options) => {
        return await this.loader.loadFromEnvironment(options)
      },
      validator: (result) => result.domains && result.domains.length > 0,
      priority: 2,
    })
  }

  /**
   * Load built-in plugins
   */
  loadBuiltInPlugins() {
    Object.values(builtInPlugins).forEach((plugin) => {
      this.pluginSystem.registerPlugin(plugin.name, plugin)
    })
  }

  /**
   * Discover domains from all sources
   */
  async discoverDomains(options = {}) {
    const {
      sources = ['cli-analysis', 'config', 'package-json', 'plugins'],
      forceRefresh = false,
      validate = this.options.validateDomains,
      ...discoveryOptions
    } = options

    console.log('🔍 Starting domain discovery...')

    try {
      // Load domains from all sources
      const discoveryResult = await this.loader.loadAll({
        sources,
        forceRefresh,
        ...discoveryOptions,
      })

      console.log(
        `📦 Discovered ${discoveryResult.domains.length} domains from ${discoveryResult.metadata.sources.length} sources`
      )

      // Convert to domain objects
      const domains = await this.convertToDomainObjects(discoveryResult)

      // Apply plugin extensions
      const extendedDomains = await this.applyPluginExtensions(domains)

      // Validate domains if requested
      let validatedDomains = extendedDomains
      if (validate) {
        validatedDomains = await this.validateDomains(extendedDomains, discoveryOptions)
      }

      // Register domains in runtime registry
      await this.registerDiscoveredDomains(validatedDomains)

      console.log(`✅ Successfully discovered and registered ${validatedDomains.length} domains`)

      return {
        domains: validatedDomains,
        metadata: discoveryResult.metadata,
        validation: validate ? await this.getValidationSummary(validatedDomains) : null,
      }
    } catch (error) {
      console.error('❌ Domain discovery failed:', error.message)
      throw error
    }
  }

  /**
   * Convert discovery result to domain objects
   */
  async convertToDomainObjects(discoveryResult) {
    const domains = []

    for (const domainName of discoveryResult.domains) {
      const domain = {
        name: domainName,
        displayName: domainName.charAt(0).toUpperCase() + domainName.slice(1),
        description: `Discovered domain: ${domainName}`,
        category: 'discovered',
        resources: discoveryResult.resources[domainName] || [],
        actions: discoveryResult.actions || [],
      }

      // Convert resources to proper format
      if (domain.resources && Array.isArray(domain.resources)) {
        domain.resources = domain.resources.map((resource) => {
          if (typeof resource === 'string') {
            return {
              name: resource,
              displayName: resource.charAt(0).toUpperCase() + resource.slice(1),
              description: `Resource: ${resource}`,
              actions: ['create', 'list', 'show', 'update', 'delete'],
              attributes: [],
              relationships: [],
            }
          }
          return resource
        })
      }

      // Convert actions to proper format
      if (domain.actions && Array.isArray(domain.actions)) {
        domain.actions = domain.actions.map((action) => {
          if (typeof action === 'string') {
            return {
              name: action,
              description: `Action: ${action}`,
              category: 'Discovered',
              requires: [],
              optional: [],
            }
          }
          return action
        })
      }

      domains.push(domain)
    }

    return domains
  }

  /**
   * Apply plugin extensions to domains
   */
  async applyPluginExtensions(domains) {
    const extendedDomains = []

    for (const domain of domains) {
      const extendedDomain = this.pluginSystem.applyDomainExtensions(domain)
      extendedDomains.push(extendedDomain)
    }

    return extendedDomains
  }

  /**
   * Validate domains
   */
  async validateDomains(domains, options = {}) {
    const validatedDomains = []

    for (const domain of domains) {
      try {
        if (this.options.validateDomains && options.cliPath) {
          const validation = await this.validator.validateDomain(domain, options.cliPath)

          if (!validation.valid && this.options.fallbackStrategy !== 'error') {
            const fallback = await this.validator.handleValidationFailure(
              domain,
              options.cliPath,
              validation
            )
            validatedDomains.push(fallback.domain)
          } else {
            validatedDomains.push(domain)
          }
        } else {
          validatedDomains.push(domain)
        }
      } catch (error) {
        console.warn(`Domain validation failed for ${domain.name}:`, error.message)
        validatedDomains.push(domain)
      }
    }

    return validatedDomains
  }

  /**
   * Register discovered domains
   */
  async registerDiscoveredDomains(domains) {
    for (const domain of domains) {
      try {
        this.registry.registerDomain(domain, { source: 'discovery' })
      } catch (error) {
        console.warn(`Failed to register domain ${domain.name}:`, error.message)
      }
    }
  }

  /**
   * Get validation summary
   */
  async getValidationSummary(domains) {
    const summary = {
      total: domains.length,
      valid: 0,
      invalid: 0,
      warnings: 0,
      errors: 0,
    }

    for (const domain of domains) {
      if (domain.validation) {
        if (domain.validation.valid) {
          summary.valid++
        } else {
          summary.invalid++
        }
        summary.warnings += domain.validation.warnings?.length || 0
        summary.errors += domain.validation.errors?.length || 0
      }
    }

    return summary
  }

  /**
   * Create domain from template
   */
  async createDomainFromTemplate(templateName, data, options = {}) {
    const { register = true, validate = true } = options

    const domain = this.templates.createDomainFromTemplate(templateName, data)

    if (register) {
      this.registry.registerDomain(domain, { source: 'template' })
    }

    if (validate && options.cliPath) {
      const validation = await this.validator.validateDomain(domain, options.cliPath)
      domain.validation = validation
    }

    return domain
  }

  /**
   * Suggest template for CLI
   */
  async suggestTemplateForCLI(cliPath) {
    try {
      const cliStructure = await this.analyzer.analyze({ cliPath })
      return this.templates.suggestTemplate(cliStructure)
    } catch (error) {
      console.warn('Failed to analyze CLI for template suggestion:', error.message)
      return 'noun-verb'
    }
  }

  /**
   * Register domain at runtime
   */
  registerDomain(domain, options = {}) {
    return this.registry.registerDomain(domain, options)
  }

  /**
   * Register domain from configuration
   */
  registerDomainFromConfig(domainName, config, options = {}) {
    return this.registry.registerDomainFromConfig(domainName, config, options)
  }

  /**
   * Register domain from CLI analysis
   */
  registerDomainFromCLI(domainName, cliAnalysis, options = {}) {
    return this.registry.registerDomainFromCLI(domainName, cliAnalysis, options)
  }

  /**
   * Register domain from package.json scripts
   */
  registerDomainFromScripts(domainName, scripts, options = {}) {
    return this.registry.registerDomainFromScripts(domainName, scripts, options)
  }

  /**
   * Register domain from environment variables
   */
  registerDomainFromEnvironment(domainName, options = {}) {
    return this.registry.registerDomainFromEnvironment(domainName, options)
  }

  /**
   * Get all registered domains
   */
  getAllDomains() {
    return this.registry.getAllDomains()
  }

  /**
   * Get domain by name
   */
  getDomain(name) {
    return this.registry.getDomain(name)
  }

  /**
   * Get domain resources
   */
  getDomainResources(domainName) {
    return this.registry.getDomainResources(domainName)
  }

  /**
   * Get domain actions
   */
  getDomainActions(domainName) {
    return this.registry.getDomainActions(domainName)
  }

  /**
   * Validate command structure
   */
  validateCommand(domain, resource, action) {
    return this.registry.validateCommand(domain, resource, action)
  }

  /**
   * Get command metadata
   */
  getCommandMetadata(domain, resource, action) {
    return this.registry.getCommandMetadata(domain, resource, action)
  }

  /**
   * Export domains to configuration
   */
  exportDomains() {
    return this.registry.exportDomains()
  }

  /**
   * Import domains from configuration
   */
  importDomains(config, options = {}) {
    return this.registry.importDomains(config, options)
  }

  /**
   * Get orchestrator statistics
   */
  getStats() {
    return {
      registry: this.registry.getStats(),
      plugins: this.pluginSystem.getPluginStats(),
      templates: this.templates.listTemplates().length,
      config: this.configManager.getCacheStats(),
      validator: this.validator.getCacheStats(),
    }
  }

  /**
   * Clear all caches
   */
  clearCaches() {
    this.analyzer.clearCache()
    this.loader.clearCache()
    this.validator.clearCache()
    this.configManager.clearCache()
  }

  /**
   * Reset orchestrator state
   */
  reset() {
    this.registry.clearRegistrationHistory()
    this.clearCaches()
  }
}

export default DomainDiscoveryOrchestrator
