#!/usr/bin/env node
// src/core/discovery/domain-config-manager.js - Configuration-Driven Domain Management

import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, extname } from 'node:path'

/**
 * Domain Configuration Manager
 *
 * Manages domain configurations through various configuration files and formats
 */
export class DomainConfigManager {
  constructor(options = {}) {
    this.options = {
      configPath: './citty-test-config.json',
      configFormat: 'auto', // auto, json, js, yaml
      watchConfig: false,
      ...options,
    }
    this.configCache = new Map()
    this.watchers = new Map()
  }

  /**
   * Load configuration from file
   */
  async loadConfig(configPath = null) {
    const path = configPath || this.options.configPath

    if (!existsSync(path)) {
      return this.getDefaultConfig()
    }

    const cacheKey = `config:${path}`
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey)
    }

    try {
      const content = await readFile(path, 'utf8')
      const config = await this.parseConfigFile(content, path)

      this.configCache.set(cacheKey, config)
      return config
    } catch (error) {
      console.warn(`Failed to load config from ${path}:`, error.message)
      return this.getDefaultConfig()
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig(config, configPath = null) {
    const path = configPath || this.options.configPath
    const content = this.serializeConfig(config, path)

    await writeFile(path, content, 'utf8')

    // Update cache
    const cacheKey = `config:${path}`
    this.configCache.set(cacheKey, config)
  }

  /**
   * Parse configuration file based on format
   */
  async parseConfigFile(content, filePath) {
    const ext = extname(filePath).toLowerCase()

    switch (ext) {
      case '.json':
        return JSON.parse(content)
      case '.js':
      case '.mjs':
        // For JS files, we'd need to evaluate them safely
        throw new Error('JS config files not supported in this context')
      case '.yaml':
      case '.yml':
        // Would need yaml parser
        throw new Error('YAML config files not yet supported')
      default:
        // Try to parse as JSON
        try {
          return JSON.parse(content)
        } catch {
          throw new Error(`Unsupported config file format: ${ext}`)
        }
    }
  }

  /**
   * Serialize configuration to file format
   */
  serializeConfig(config, filePath) {
    const ext = extname(filePath).toLowerCase()

    switch (ext) {
      case '.json':
        return JSON.stringify(config, null, 2)
      case '.js':
      case '.mjs':
        return `export default ${JSON.stringify(config, null, 2)}`
      default:
        return JSON.stringify(config, null, 2)
    }
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      domains: {
        infra: {
          displayName: 'Infrastructure',
          description: 'Infrastructure and operations management',
          category: 'operations',
          compliance: ['SOC2', 'ISO27001'],
          governance: ['RBAC', 'Audit'],
          resources: [
            {
              name: 'server',
              displayName: 'Server',
              description: 'Compute server instances',
              actions: ['create', 'list', 'show', 'update', 'delete', 'restart', 'scale'],
              attributes: ['type', 'region', 'size', 'status', 'created'],
              relationships: ['network', 'storage', 'monitoring'],
            },
            {
              name: 'network',
              displayName: 'Network',
              description: 'Network infrastructure',
              actions: ['create', 'list', 'show', 'update', 'delete', 'configure'],
              attributes: ['cidr', 'region', 'status', 'created'],
              relationships: ['server', 'security'],
            },
          ],
          actions: [
            {
              name: 'create',
              description: 'Create new resource',
              category: 'CRUD',
              requires: ['name', 'type'],
              optional: ['region', 'size', 'config'],
            },
            {
              name: 'list',
              description: 'List resources',
              category: 'CRUD',
              requires: [],
              optional: ['filter', 'format'],
            },
          ],
        },
        dev: {
          displayName: 'Development',
          description: 'Development and testing operations',
          category: 'development',
          compliance: ['SOC2'],
          governance: ['RBAC'],
          resources: [
            {
              name: 'project',
              displayName: 'Project',
              description: 'Development projects',
              actions: ['create', 'list', 'show', 'update', 'delete', 'deploy'],
              attributes: ['name', 'type', 'status', 'created', 'updated'],
              relationships: ['app', 'test', 'scenario'],
            },
          ],
          actions: [
            {
              name: 'create',
              description: 'Create new resource',
              category: 'CRUD',
              requires: ['name'],
              optional: ['type', 'config'],
            },
          ],
        },
      },
      discovery: {
        enabled: true,
        sources: ['cli-help', 'package-scripts', 'config-files'],
        cliPath: './cli.js',
        packageJsonPath: './package.json',
      },
      validation: {
        strict: false,
        autoCreate: true,
        fallbackStrategy: 'generic',
        validateAgainstCLI: true,
      },
      testing: {
        defaultTimeout: 30000,
        enableContext: true,
        enableAudit: true,
        enablePerformance: true,
        enableCompliance: true,
      },
      plugins: {
        enabled: true,
        directory: './plugins',
        pattern: '*.plugin.js',
        autoLoad: true,
      },
    }
  }

  /**
   * Get domains from configuration
   */
  async getDomains(configPath = null) {
    const config = await this.loadConfig(configPath)
    return config.domains || {}
  }

  /**
   * Get discovery settings from configuration
   */
  async getDiscoverySettings(configPath = null) {
    const config = await this.loadConfig(configPath)
    return config.discovery || {}
  }

  /**
   * Get validation settings from configuration
   */
  async getValidationSettings(configPath = null) {
    const config = await this.loadConfig(configPath)
    return config.validation || {}
  }

  /**
   * Get testing settings from configuration
   */
  async getTestingSettings(configPath = null) {
    const config = await this.loadConfig(configPath)
    return config.testing || {}
  }

  /**
   * Get plugin settings from configuration
   */
  async getPluginSettings(configPath = null) {
    const config = await this.loadConfig(configPath)
    return config.plugins || {}
  }

  /**
   * Update domain in configuration
   */
  async updateDomain(domainName, domainConfig, configPath = null) {
    const config = await this.loadConfig(configPath)

    if (!config.domains) {
      config.domains = {}
    }

    config.domains[domainName] = {
      ...config.domains[domainName],
      ...domainConfig,
      name: domainName,
    }

    await this.saveConfig(config, configPath)
    return config.domains[domainName]
  }

  /**
   * Add domain to configuration
   */
  async addDomain(domainName, domainConfig, configPath = null) {
    const config = await this.loadConfig(configPath)

    if (!config.domains) {
      config.domains = {}
    }

    if (config.domains[domainName]) {
      throw new Error(`Domain '${domainName}' already exists`)
    }

    config.domains[domainName] = {
      name: domainName,
      ...domainConfig,
    }

    await this.saveConfig(config, configPath)
    return config.domains[domainName]
  }

  /**
   * Remove domain from configuration
   */
  async removeDomain(domainName, configPath = null) {
    const config = await this.loadConfig(configPath)

    if (!config.domains || !config.domains[domainName]) {
      throw new Error(`Domain '${domainName}' not found`)
    }

    delete config.domains[domainName]
    await this.saveConfig(config, configPath)
  }

  /**
   * Update discovery settings
   */
  async updateDiscoverySettings(settings, configPath = null) {
    const config = await this.loadConfig(configPath)
    config.discovery = { ...config.discovery, ...settings }
    await this.saveConfig(config, configPath)
    return config.discovery
  }

  /**
   * Update validation settings
   */
  async updateValidationSettings(settings, configPath = null) {
    const config = await this.loadConfig(configPath)
    config.validation = { ...config.validation, ...settings }
    await this.saveConfig(config, configPath)
    return config.validation
  }

  /**
   * Update testing settings
   */
  async updateTestingSettings(settings, configPath = null) {
    const config = await this.loadConfig(configPath)
    config.testing = { ...config.testing, ...settings }
    await this.saveConfig(config, configPath)
    return config.testing
  }

  /**
   * Update plugin settings
   */
  async updatePluginSettings(settings, configPath = null) {
    const config = await this.loadConfig(configPath)
    config.plugins = { ...config.plugins, ...settings }
    await this.saveConfig(config, configPath)
    return config.plugins
  }

  /**
   * Create configuration from template
   */
  async createConfigFromTemplate(templateName, templateData = {}, configPath = null) {
    const template = this.getConfigTemplate(templateName)
    const config = this.applyTemplate(template, templateData)

    await this.saveConfig(config, configPath)
    return config
  }

  /**
   * Get configuration template
   */
  getConfigTemplate(templateName) {
    const templates = {
      minimal: {
        domains: {},
        discovery: { enabled: true, sources: ['cli-help'] },
        validation: { strict: false, autoCreate: true },
        testing: { defaultTimeout: 30000 },
      },
      enterprise: {
        domains: {
          infra: {
            displayName: 'Infrastructure',
            category: 'operations',
            compliance: ['SOC2', 'ISO27001'],
            governance: ['RBAC', 'Audit'],
            resources: [
              {
                name: 'server',
                actions: ['create', 'list', 'show', 'update', 'delete'],
                attributes: ['type', 'region', 'size', 'status'],
              },
            ],
          },
        },
        discovery: {
          enabled: true,
          sources: ['cli-help', 'package-scripts', 'config-files'],
        },
        validation: {
          strict: true,
          autoCreate: false,
          fallbackStrategy: 'error',
          validateAgainstCLI: true,
        },
        testing: {
          defaultTimeout: 60000,
          enableContext: true,
          enableAudit: true,
          enablePerformance: true,
          enableCompliance: true,
        },
        plugins: {
          enabled: true,
          autoLoad: true,
        },
      },
      development: {
        domains: {
          dev: {
            displayName: 'Development',
            category: 'development',
            resources: [
              {
                name: 'project',
                actions: ['create', 'list', 'show', 'update', 'delete'],
                attributes: ['name', 'type', 'status'],
              },
            ],
          },
        },
        discovery: {
          enabled: true,
          sources: ['package-scripts'],
        },
        validation: {
          strict: false,
          autoCreate: true,
          fallbackStrategy: 'generic',
        },
        testing: {
          defaultTimeout: 30000,
          enableContext: true,
        },
      },
    }

    return templates[templateName] || templates['minimal']
  }

  /**
   * Apply template with data
   */
  applyTemplate(template, data) {
    const applyTemplateRecursive = (obj) => {
      if (typeof obj === 'string') {
        return obj.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || match)
      } else if (Array.isArray(obj)) {
        return obj.map(applyTemplateRecursive)
      } else if (obj && typeof obj === 'object') {
        const result = {}
        Object.entries(obj).forEach(([key, value]) => {
          result[key] = applyTemplateRecursive(value)
        })
        return result
      }
      return obj
    }

    return applyTemplateRecursive(template)
  }

  /**
   * Validate configuration
   */
  validateConfig(config) {
    const errors = []
    const warnings = []

    // Validate domains
    if (config.domains) {
      Object.entries(config.domains).forEach(([name, domain]) => {
        if (!domain.name) {
          errors.push(`Domain '${name}' missing name property`)
        }
        if (domain.resources) {
          domain.resources.forEach((resource, index) => {
            if (!resource.name) {
              errors.push(`Domain '${name}' resource at index ${index} missing name`)
            }
            if (!resource.actions || !Array.isArray(resource.actions)) {
              errors.push(`Domain '${name}' resource '${resource.name}' missing actions array`)
            }
          })
        }
      })
    }

    // Validate discovery settings
    if (config.discovery) {
      if (config.discovery.sources && !Array.isArray(config.discovery.sources)) {
        errors.push('Discovery sources must be an array')
      }
    }

    // Validate validation settings
    if (config.validation) {
      const validStrategies = ['generic', 'error', 'auto-discover', 'ignore']
      if (
        config.validation.fallbackStrategy &&
        !validStrategies.includes(config.validation.fallbackStrategy)
      ) {
        errors.push(`Invalid fallback strategy: ${config.validation.fallbackStrategy}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Clear configuration cache
   */
  clearCache() {
    this.configCache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.configCache.size,
      keys: Array.from(this.configCache.keys()),
    }
  }
}

export default DomainConfigManager
