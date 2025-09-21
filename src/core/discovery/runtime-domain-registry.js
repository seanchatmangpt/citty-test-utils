#!/usr/bin/env node
// src/core/discovery/runtime-domain-registry.js - Runtime Domain Registration

import { DomainRegistry } from '../../enterprise/domain/domain-registry.js'

/**
 * Runtime Domain Registry
 *
 * Provides runtime domain registration and management capabilities
 */
export class RuntimeDomainRegistry extends DomainRegistry {
  constructor(options = {}) {
    super()
    this.options = {
      allowOverwrite: false,
      validateOnRegister: true,
      autoCreateResources: true,
      ...options,
    }
    this.registrationHistory = []
    this.dynamicDomains = new Set()
  }

  /**
   * Register domain at runtime
   */
  registerDomain(domain, options = {}) {
    const {
      overwrite = this.options.allowOverwrite,
      validate = this.options.validateOnRegister,
      source = 'runtime',
    } = options

    try {
      // Check if domain already exists
      if (this.domains.has(domain.name) && !overwrite) {
        throw new Error(`Domain '${domain.name}' already exists. Use overwrite: true to replace.`)
      }

      // Validate domain if requested
      if (validate) {
        this.validateDomain(domain)
      }

      // Register the domain
      super.registerDomain(domain)

      // Track registration
      this.registrationHistory.push({
        domain: domain.name,
        source,
        timestamp: new Date(),
        overwrite,
      })

      // Mark as dynamic
      this.dynamicDomains.add(domain.name)

      console.log(`Registered domain '${domain.name}' from ${source}`)
      return {
        success: true,
        domain: domain,
        source: source,
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        domain: domain,
        source: source,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Register domain from configuration object
   */
  registerDomainFromConfig(domainName, config, options = {}) {
    const domain = {
      name: domainName,
      displayName: config.displayName || domainName,
      description: config.description || `Domain: ${domainName}`,
      category: config.category || 'general',
      compliance: config.compliance || [],
      governance: config.governance || [],
      resources: config.resources || [],
      actions: config.actions || [],
      ...config,
    }

    return this.registerDomain(domain, options)
  }

  /**
   * Parse resources from CLI analysis
   */
  parseResourcesFromCLI(resources, domainName) {
    if (!resources) return []

    // Handle array format: [{ name: 'resource', domain: 'test', actions: ['create'] }]
    if (Array.isArray(resources)) {
      return resources
        .filter((resource) => resource.domain === domainName)
        .map((resource) => ({
          name: resource.name,
          displayName: resource.name.charAt(0).toUpperCase() + resource.name.slice(1),
          description: `Resource: ${resource.name}`,
          actions: resource.actions || ['create', 'list', 'show', 'update', 'delete'],
          attributes: [],
          relationships: [],
        }))
    }

    // Handle object format: { 'test': ['resource'] }
    if (typeof resources === 'object') {
      const domainResources = resources[domainName] || []
      return domainResources.map((resourceName) => ({
        name: resourceName,
        displayName: resourceName.charAt(0).toUpperCase() + resourceName.slice(1),
        description: `Resource: ${resourceName}`,
        actions: ['create', 'list', 'show', 'update', 'delete'],
        attributes: [],
        relationships: [],
      }))
    }

    return []
  }

  /**
   * Parse actions from CLI analysis
   */
  parseActionsFromCLI(actions, domainName) {
    if (!actions) return []

    // Handle array format: [{ name: 'create', domain: 'test', resource: 'resource' }]
    if (Array.isArray(actions)) {
      return actions
        .filter((action) => action.domain === domainName)
        .map((action) => ({
          name: action.name,
          description: `Action: ${action.name}`,
          category: 'Discovered',
          requires: [],
          optional: [],
        }))
    }

    // Handle array of strings format: ['create', 'list']
    if (Array.isArray(actions) && actions.every((action) => typeof action === 'string')) {
      return actions.map((actionName) => ({
        name: actionName,
        description: `Action: ${actionName}`,
        category: 'Discovered',
        requires: [],
        optional: [],
      }))
    }

    return []
  }

  /**
   * Register domain from CLI analysis
   */
  registerDomainFromCLI(domainName, cliAnalysis, options = {}) {
    // Validate domain name
    if (!domainName || typeof domainName !== 'string' || domainName.trim() === '') {
      return {
        success: false,
        error: 'Domain name must be a non-empty string',
        domain: null,
        source: 'cli-analysis',
        timestamp: new Date(),
      }
    }

    const domain = {
      name: domainName,
      displayName: domainName.charAt(0).toUpperCase() + domainName.slice(1),
      description: `Auto-discovered domain: ${domainName}`,
      category: 'discovered',
      resources: this.parseResourcesFromCLI(cliAnalysis.resources, domainName),
      actions: this.parseActionsFromCLI(cliAnalysis.actions, domainName),
    }

    return this.registerDomain(domain, { ...options, source: 'cli-analysis' })
  }

  /**
   * Register domain from package.json scripts
   */
  registerDomainFromScripts(domainName, scripts, options = {}) {
    const domainResources = new Map()
    const domainActions = new Set()

    // Analyze scripts for this domain
    Object.entries(scripts).forEach(([scriptName, scriptCommand]) => {
      if (scriptName.startsWith(`${domainName}:`)) {
        const parts = scriptName.split(':')
        if (parts.length >= 2) {
          const resource = parts[1]
          const action = parts[2] || 'run'

          if (!domainResources.has(resource)) {
            domainResources.set(resource, new Set())
          }
          domainResources.get(resource).add(action)
          domainActions.add(action)
        }
      }
    })

    const domain = {
      name: domainName,
      displayName: domainName.charAt(0).toUpperCase() + domainName.slice(1),
      description: `Script-based domain: ${domainName}`,
      category: 'scripts',
      resources: Array.from(domainResources.entries()).map(([name, actions]) => ({
        name,
        displayName: name.charAt(0).toUpperCase() + name.slice(1),
        description: `Resource: ${name}`,
        actions: Array.from(actions),
        attributes: [],
        relationships: [],
      })),
      actions: Array.from(domainActions).map((name) => ({
        name,
        description: `Action: ${name}`,
        category: 'Script',
        requires: [],
        optional: [],
      })),
    }

    return this.registerDomain(domain, { ...options, source: 'package-scripts' })
  }

  /**
   * Register domain from environment variables
   */
  registerDomainFromEnvironment(domainName, options = {}) {
    const prefix = `CITTY_DOMAIN_${domainName.toUpperCase()}_`
    const domainConfig = {}

    // Extract domain configuration from environment
    Object.entries(process.env).forEach(([key, value]) => {
      if (key.startsWith(prefix)) {
        const configKey = key.substring(prefix.length).toLowerCase()
        try {
          domainConfig[configKey] = JSON.parse(value)
        } catch {
          domainConfig[configKey] = value
        }
      }
    })

    if (Object.keys(domainConfig).length === 0) {
      throw new Error(`No environment configuration found for domain ${domainName}`)
    }

    return this.registerDomainFromConfig(domainName, domainConfig, {
      ...options,
      source: 'environment',
    })
  }

  /**
   * Register domain from template
   */
  registerDomainFromTemplate(domainName, template, templateData = {}, options = {}) {
    const domain = this.applyTemplate(template, {
      name: domainName,
      ...templateData,
    })

    return this.registerDomain(domain, { ...options, source: 'template' })
  }

  /**
   * Apply template to create domain
   */
  applyTemplate(template, data) {
    const domain = { ...template }

    // Replace placeholders
    const replacePlaceholders = (obj) => {
      if (typeof obj === 'string') {
        return obj.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || match)
      } else if (Array.isArray(obj)) {
        return obj.map(replacePlaceholders)
      } else if (obj && typeof obj === 'object') {
        const result = {}
        Object.entries(obj).forEach(([key, value]) => {
          result[key] = replacePlaceholders(value)
        })
        return result
      }
      return obj
    }

    return replacePlaceholders(domain)
  }

  /**
   * Validate command against registered domains
   */
  validateCommand(domain, resource, action) {
    const domainInfo = this.domains.get(domain)
    if (!domainInfo) {
      return false
    }

    const resourceInfo = domainInfo.resources.find((r) => r.name === resource)
    if (!resourceInfo) {
      return false
    }

    return resourceInfo.actions.includes(action)
  }

  /**
   * Unregister domain
   */
  unregisterDomain(domainName) {
    if (!this.domains.has(domainName)) {
      throw new Error(`Domain '${domainName}' not found`)
    }

    // Remove from registry
    this.domains.delete(domainName)

    // Remove resources
    const resourceKeys = Array.from(this.resources.keys()).filter((key) =>
      key.startsWith(`${domainName}.`)
    )
    resourceKeys.forEach((key) => this.resources.delete(key))

    // Remove actions
    const actionKeys = Array.from(this.actions.keys()).filter((key) =>
      key.startsWith(`${domainName}.`)
    )
    actionKeys.forEach((key) => this.actions.delete(key))

    // Remove from dynamic domains
    this.dynamicDomains.delete(domainName)

    // Track unregistration
    this.registrationHistory.push({
      domain: domainName,
      action: 'unregister',
      timestamp: new Date(),
    })

    console.log(`Unregistered domain '${domainName}'`)
    return this
  }

  /**
   * Update existing domain
   */
  updateDomain(domainName, updates, options = {}) {
    const existingDomain = this.getDomain(domainName)
    if (!existingDomain) {
      throw new Error(`Domain '${domainName}' not found`)
    }

    const updatedDomain = {
      ...existingDomain,
      ...updates,
      name: domainName, // Ensure name doesn't change
    }

    return this.registerDomain(updatedDomain, {
      ...options,
      overwrite: true,
      source: 'update',
    })
  }

  /**
   * Add resource to domain
   */
  addResourceToDomain(domainName, resource, options = {}) {
    const domain = this.getDomain(domainName)
    if (!domain) {
      throw new Error(`Domain '${domainName}' not found`)
    }

    const updatedResources = [...(domain.resources || []), resource]
    return this.updateDomain(domainName, { resources: updatedResources }, options)
  }

  /**
   * Add action to domain
   */
  addActionToDomain(domainName, action, options = {}) {
    const domain = this.getDomain(domainName)
    if (!domain) {
      throw new Error(`Domain '${domainName}' not found`)
    }

    const updatedActions = [...(domain.actions || []), action]
    return this.updateDomain(domainName, { actions: updatedActions }, options)
  }

  /**
   * Validate domain structure
   */
  validateDomain(domain) {
    if (!domain.name) {
      throw new Error('Domain must have a name')
    }

    if (domain.resources) {
      domain.resources.forEach((resource, index) => {
        if (!resource.name) {
          throw new Error(`Resource at index ${index} must have a name`)
        }
        if (!resource.actions || !Array.isArray(resource.actions)) {
          throw new Error(`Resource '${resource.name}' must have actions array`)
        }
      })
    }

    if (domain.actions) {
      domain.actions.forEach((action, index) => {
        if (!action.name) {
          throw new Error(`Action at index ${index} must have a name`)
        }
      })
    }
  }

  /**
   * Get dynamic domains
   */
  getDynamicDomains() {
    return Array.from(this.dynamicDomains)
  }

  /**
   * Get registration history
   */
  getRegistrationHistory() {
    return [...this.registrationHistory]
  }

  /**
   * Clear registration history
   */
  clearRegistrationHistory() {
    this.registrationHistory = []
  }

  /**
   * Export domains to configuration
   */
  exportDomains() {
    const domains = {}

    this.domains.forEach((domain, name) => {
      domains[name] = {
        ...domain,
        isDynamic: this.dynamicDomains.has(name),
      }
    })

    return {
      domains,
      metadata: {
        totalDomains: this.domains.size,
        dynamicDomains: this.dynamicDomains.size,
        exportedAt: new Date().toISOString(),
      },
    }
  }

  /**
   * Import domains from configuration
   */
  importDomains(config, options = {}) {
    const { overwrite = false, validate = true } = options

    if (!config.domains) {
      throw new Error('Configuration must contain domains')
    }

    Object.entries(config.domains).forEach(([name, domain]) => {
      this.registerDomain(domain, {
        overwrite,
        validate,
        source: 'import',
      })
    })

    return this
  }

  /**
   * Get registry statistics
   */
  getStats() {
    return {
      totalDomains: this.domains.size,
      dynamicDomains: this.dynamicDomains.size,
      totalResources: this.resources.size,
      totalActions: this.actions.size,
      registrationHistory: this.registrationHistory.length,
    }
  }
}

export default RuntimeDomainRegistry
