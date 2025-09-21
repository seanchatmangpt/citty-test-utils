#!/usr/bin/env node
// src/core/discovery/domain-plugin-system.js - Plugin-Based Domain System

import { readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, extname } from 'node:path'

/**
 * Domain Plugin System
 *
 * Manages domain plugins and provides extensibility for domain definitions
 */
export class DomainPluginSystem {
  constructor(options = {}) {
    this.options = {
      pluginDirectory: './plugins',
      autoLoadPlugins: true,
      pluginPattern: '*.plugin.js',
      ...options,
    }
    this.plugins = new Map()
    this.hooks = new Map()
    this.domainExtensions = new Map()
  }

  /**
   * Register a domain plugin
   */
  registerPlugin(name, plugin) {
    if (typeof plugin !== 'object' || !plugin.name) {
      throw new Error('Plugin must be an object with a name property')
    }

    this.plugins.set(name, {
      ...plugin,
      registeredAt: new Date(),
      enabled: plugin.enabled !== false,
    })

    // Register hooks if provided
    if (plugin.hooks) {
      Object.entries(plugin.hooks).forEach(([hookName, hookFn]) => {
        this.registerHook(hookName, hookFn)
      })
    }

    // Register domain extensions if provided
    if (plugin.domains) {
      Object.entries(plugin.domains).forEach(([domainName, domainConfig]) => {
        this.registerDomainExtension(domainName, domainConfig)
      })
    }

    console.log(`Registered domain plugin: ${name}`)
  }

  /**
   * Load plugins from directory
   */
  async loadPlugins(options = {}) {
    const {
      directory = this.options.pluginDirectory,
      pattern = this.options.pluginPattern,
      recursive = true,
    } = options

    if (!existsSync(directory)) {
      console.warn(`Plugin directory not found: ${directory}`)
      return []
    }

    const pluginFiles = await this.findPluginFiles(directory, pattern, recursive)
    const loadedPlugins = []

    for (const file of pluginFiles) {
      try {
        const plugin = await this.loadPluginFile(file)
        if (plugin) {
          this.registerPlugin(plugin.name, plugin)
          loadedPlugins.push(plugin.name)
        }
      } catch (error) {
        console.warn(`Failed to load plugin ${file}:`, error.message)
      }
    }

    return loadedPlugins
  }

  /**
   * Find plugin files in directory
   */
  async findPluginFiles(directory, pattern, recursive) {
    const files = []
    const entries = await readdir(directory, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = resolve(directory, entry.name)

      if (entry.isDirectory() && recursive) {
        const subFiles = await this.findPluginFiles(fullPath, pattern, recursive)
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
   * Load plugin from file
   */
  async loadPluginFile(filePath) {
    const ext = extname(filePath)

    if (ext === '.js' || ext === '.mjs') {
      const module = await import(resolve(filePath))
      return module.default || module
    } else if (ext === '.json') {
      const content = await readFile(filePath, 'utf8')
      return JSON.parse(content)
    } else {
      throw new Error(`Unsupported plugin file type: ${ext}`)
    }
  }

  /**
   * Register a hook
   */
  registerHook(hookName, hookFn) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, [])
    }
    this.hooks.get(hookName).push(hookFn)
  }

  /**
   * Execute hooks
   */
  async executeHooks(hookName, ...args) {
    const hooks = this.hooks.get(hookName) || []
    const results = []

    for (const hook of hooks) {
      try {
        const result = await hook(...args)
        results.push(result)
      } catch (error) {
        console.warn(`Hook ${hookName} failed:`, error.message)
      }
    }

    return results
  }

  /**
   * Register domain extension
   */
  registerDomainExtension(domainName, extension) {
    if (!this.domainExtensions.has(domainName)) {
      this.domainExtensions.set(domainName, [])
    }
    this.domainExtensions.get(domainName).push(extension)
  }

  /**
   * Get domain extensions
   */
  getDomainExtensions(domainName) {
    return this.domainExtensions.get(domainName) || []
  }

  /**
   * Apply domain extensions
   */
  applyDomainExtensions(domain) {
    const extensions = this.getDomainExtensions(domain.name)
    let extendedDomain = { ...domain }

    for (const extension of extensions) {
      extendedDomain = this.applyExtension(extendedDomain, extension)
    }

    return extendedDomain
  }

  /**
   * Apply single extension
   */
  applyExtension(domain, extension) {
    const extended = { ...domain }

    // Merge resources
    if (extension.resources) {
      extended.resources = [...(extended.resources || []), ...extension.resources]
    }

    // Merge actions
    if (extension.actions) {
      extended.actions = [...(extended.actions || []), ...extension.actions]
    }

    // Merge metadata
    if (extension.metadata) {
      extended.metadata = { ...extended.metadata, ...extension.metadata }
    }

    // Apply custom extension function
    if (typeof extension.extend === 'function') {
      return extension.extend(extended)
    }

    return extended
  }

  /**
   * Get all registered plugins
   */
  getPlugins() {
    return Array.from(this.plugins.values())
  }

  /**
   * Get enabled plugins
   */
  getEnabledPlugins() {
    return Array.from(this.plugins.values()).filter((plugin) => plugin.enabled)
  }

  /**
   * Enable/disable plugin
   */
  setPluginEnabled(pluginName, enabled) {
    const plugin = this.plugins.get(pluginName)
    if (plugin) {
      plugin.enabled = enabled
    }
  }

  /**
   * Unregister plugin
   */
  unregisterPlugin(pluginName) {
    this.plugins.delete(pluginName)
  }

  /**
   * Get plugin statistics
   */
  getPluginStats() {
    const plugins = Array.from(this.plugins.values())
    return {
      total: plugins.length,
      enabled: plugins.filter((p) => p.enabled).length,
      disabled: plugins.filter((p) => !p.enabled).length,
      hooks: this.hooks.size,
      domainExtensions: this.domainExtensions.size,
    }
  }
}

/**
 * Built-in domain plugins
 */
export const builtInPlugins = {
  /**
   * Infrastructure domain plugin
   */
  infrastructure: {
    name: 'infrastructure',
    version: '1.0.0',
    description: 'Infrastructure management domain',
    domains: {
      infra: {
        name: 'infra',
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
          {
            name: 'storage',
            displayName: 'Storage',
            description: 'Storage systems and volumes',
            actions: ['create', 'list', 'show', 'update', 'delete', 'backup', 'restore'],
            attributes: ['type', 'size', 'region', 'status', 'created'],
            relationships: ['server', 'backup'],
          },
          {
            name: 'database',
            displayName: 'Database',
            description: 'Database instances and clusters',
            actions: ['create', 'list', 'show', 'update', 'delete', 'backup', 'restore'],
            attributes: ['type', 'version', 'size', 'region', 'status', 'created'],
            relationships: ['server', 'storage', 'backup'],
          },
          {
            name: 'monitoring',
            displayName: 'Monitoring',
            description: 'Monitoring and observability systems',
            actions: ['create', 'list', 'show', 'update', 'delete', 'configure', 'start', 'stop'],
            attributes: ['type', 'status', 'region', 'created', 'endpoints'],
            relationships: ['server', 'database'],
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
          {
            name: 'show',
            description: 'Show resource details',
            category: 'CRUD',
            requires: ['id'],
            optional: ['format'],
          },
          {
            name: 'update',
            description: 'Update resource',
            category: 'CRUD',
            requires: ['id'],
            optional: ['config', 'tags'],
          },
          {
            name: 'delete',
            description: 'Delete resource',
            category: 'CRUD',
            requires: ['id'],
            optional: ['force'],
          },
          {
            name: 'backup',
            description: 'Backup resource',
            category: 'Operations',
            requires: ['id'],
            optional: ['schedule', 'retention'],
          },
          {
            name: 'restore',
            description: 'Restore resource',
            category: 'Operations',
            requires: ['id', 'backup'],
            optional: ['target'],
          },
        ],
      },
    },
  },

  /**
   * Development domain plugin
   */
  development: {
    name: 'development',
    version: '1.0.0',
    description: 'Development and testing operations',
    domains: {
      dev: {
        name: 'dev',
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
          {
            name: 'app',
            displayName: 'Application',
            description: 'Application instances',
            actions: ['create', 'list', 'show', 'update', 'delete', 'deploy', 'run'],
            attributes: ['name', 'version', 'status', 'created', 'updated'],
            relationships: ['project', 'test'],
          },
          {
            name: 'test',
            displayName: 'Test',
            description: 'Test suites and cases',
            actions: ['create', 'list', 'show', 'update', 'delete', 'run', 'schedule'],
            attributes: ['name', 'type', 'status', 'duration', 'results'],
            relationships: ['project', 'scenario', 'snapshot'],
          },
          {
            name: 'scenario',
            displayName: 'Scenario',
            description: 'Test scenarios',
            actions: ['create', 'list', 'show', 'update', 'delete', 'run'],
            attributes: ['name', 'type', 'status', 'steps', 'created'],
            relationships: ['test', 'snapshot'],
          },
          {
            name: 'snapshot',
            displayName: 'Snapshot',
            description: 'Test snapshots',
            actions: ['create', 'list', 'show', 'update', 'delete', 'compare'],
            attributes: ['name', 'type', 'status', 'created', 'size'],
            relationships: ['test', 'scenario'],
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
          {
            name: 'list',
            description: 'List resources',
            category: 'CRUD',
            requires: [],
            optional: ['filter', 'format'],
          },
          {
            name: 'show',
            description: 'Show resource details',
            category: 'CRUD',
            requires: ['id'],
            optional: ['format'],
          },
          {
            name: 'update',
            description: 'Update resource',
            category: 'CRUD',
            requires: ['id'],
            optional: ['config', 'tags'],
          },
          {
            name: 'delete',
            description: 'Delete resource',
            category: 'CRUD',
            requires: ['id'],
            optional: ['force'],
          },
          {
            name: 'run',
            description: 'Run resource',
            category: 'Operations',
            requires: ['id'],
            optional: ['config', 'environment'],
          },
          {
            name: 'deploy',
            description: 'Deploy resource',
            category: 'Operations',
            requires: ['id'],
            optional: ['environment', 'config'],
          },
          {
            name: 'schedule',
            description: 'Schedule resource',
            category: 'Operations',
            requires: ['id', 'schedule'],
            optional: ['config'],
          },
        ],
      },
    },
  },

  /**
   * Security domain plugin
   */
  security: {
    name: 'security',
    version: '1.0.0',
    description: 'Security and compliance management',
    domains: {
      security: {
        name: 'security',
        displayName: 'Security',
        description: 'Security and compliance management',
        category: 'security',
        compliance: ['SOC2', 'ISO27001', 'GDPR'],
        governance: ['RBAC', 'Audit', 'Policy'],
        resources: [
          {
            name: 'user',
            displayName: 'User',
            description: 'User accounts and identities',
            actions: ['create', 'list', 'show', 'update', 'delete', 'audit'],
            attributes: ['name', 'email', 'status', 'created', 'lastLogin'],
            relationships: ['role', 'policy'],
          },
          {
            name: 'role',
            displayName: 'Role',
            description: 'User roles and permissions',
            actions: ['create', 'list', 'show', 'update', 'delete', 'audit'],
            attributes: ['name', 'permissions', 'status', 'created'],
            relationships: ['user', 'policy'],
          },
          {
            name: 'policy',
            displayName: 'Policy',
            description: 'Security policies and rules',
            actions: ['create', 'list', 'show', 'update', 'delete', 'validate'],
            attributes: ['name', 'type', 'status', 'created', 'updated'],
            relationships: ['user', 'role'],
          },
          {
            name: 'secret',
            displayName: 'Secret',
            description: 'Secrets and credentials',
            actions: ['create', 'list', 'show', 'update', 'delete', 'rotate'],
            attributes: ['name', 'type', 'status', 'created', 'expires'],
            relationships: ['user', 'policy'],
          },
          {
            name: 'certificate',
            displayName: 'Certificate',
            description: 'SSL/TLS certificates',
            actions: ['create', 'list', 'show', 'update', 'delete', 'validate'],
            attributes: ['name', 'type', 'status', 'created', 'expires'],
            relationships: ['secret', 'policy'],
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
          {
            name: 'list',
            description: 'List resources',
            category: 'CRUD',
            requires: [],
            optional: ['filter', 'format'],
          },
          {
            name: 'show',
            description: 'Show resource details',
            category: 'CRUD',
            requires: ['id'],
            optional: ['format'],
          },
          {
            name: 'update',
            description: 'Update resource',
            category: 'CRUD',
            requires: ['id'],
            optional: ['config', 'tags'],
          },
          {
            name: 'delete',
            description: 'Delete resource',
            category: 'CRUD',
            requires: ['id'],
            optional: ['force'],
          },
          {
            name: 'audit',
            description: 'Audit resource',
            category: 'Security',
            requires: ['id'],
            optional: ['scope', 'format'],
          },
          {
            name: 'validate',
            description: 'Validate resource',
            category: 'Security',
            requires: ['id'],
            optional: ['rules', 'format'],
          },
          {
            name: 'rotate',
            description: 'Rotate resource',
            category: 'Security',
            requires: ['id'],
            optional: ['schedule'],
          },
        ],
      },
    },
  },
}

export default DomainPluginSystem
