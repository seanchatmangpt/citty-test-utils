#!/usr/bin/env node
// src/core/discovery/domain-templates.js - Domain Templates System

/**
 * Domain Templates System
 *
 * Provides domain templates for common CLI patterns and structures
 */
export class DomainTemplates {
  constructor() {
    this.templates = new Map()
    this.registerDefaultTemplates()
  }

  /**
   * Register default templates
   */
  registerDefaultTemplates() {
    // Noun-Verb pattern template
    this.registerTemplate('noun-verb', {
      name: '{{domain}}',
      displayName: '{{displayName}}',
      description: '{{description}}',
      category: '{{category}}',
      compliance: ['{{compliance}}'],
      governance: ['{{governance}}'],
      resources: [
        {
          name: '{{resource}}',
          displayName: '{{resourceDisplayName}}',
          description: '{{resourceDescription}}',
          actions: ['create', 'list', 'show', 'update', 'delete'],
          attributes: ['name', 'type', 'status', 'created'],
          relationships: [],
        },
      ],
      actions: [
        {
          name: 'create',
          description: 'Create new {{resource}}',
          category: 'CRUD',
          requires: ['name'],
          optional: ['type', 'config'],
        },
        {
          name: 'list',
          description: 'List {{resource}}s',
          category: 'CRUD',
          requires: [],
          optional: ['filter', 'format'],
        },
        {
          name: 'show',
          description: 'Show {{resource}} details',
          category: 'CRUD',
          requires: ['id'],
          optional: ['format'],
        },
        {
          name: 'update',
          description: 'Update {{resource}}',
          category: 'CRUD',
          requires: ['id'],
          optional: ['config', 'tags'],
        },
        {
          name: 'delete',
          description: 'Delete {{resource}}',
          category: 'CRUD',
          requires: ['id'],
          optional: ['force'],
        },
      ],
    })

    // Hierarchical pattern template
    this.registerTemplate('hierarchical', {
      name: '{{domain}}',
      displayName: '{{displayName}}',
      description: '{{description}}',
      category: '{{category}}',
      compliance: ['{{compliance}}'],
      governance: ['{{governance}}'],
      resources: [
        {
          name: '{{subdomain}}',
          displayName: '{{subdomainDisplayName}}',
          description: '{{subdomainDescription}}',
          actions: ['create', 'list', 'show', 'update', 'delete'],
          attributes: ['name', 'type', 'status', 'created'],
          relationships: ['{{resource}}'],
        },
        {
          name: '{{resource}}',
          displayName: '{{resourceDisplayName}}',
          description: '{{resourceDescription}}',
          actions: ['create', 'list', 'show', 'update', 'delete'],
          attributes: ['name', 'type', 'status', 'created'],
          relationships: ['{{subdomain}}'],
        },
      ],
      actions: [
        {
          name: 'create',
          description: 'Create new {{resource}}',
          category: 'CRUD',
          requires: ['name'],
          optional: ['type', 'config'],
        },
        {
          name: 'list',
          description: 'List {{resource}}s',
          category: 'CRUD',
          requires: [],
          optional: ['filter', 'format'],
        },
        {
          name: 'show',
          description: 'Show {{resource}} details',
          category: 'CRUD',
          requires: ['id'],
          optional: ['format'],
        },
        {
          name: 'update',
          description: 'Update {{resource}}',
          category: 'CRUD',
          requires: ['id'],
          optional: ['config', 'tags'],
        },
        {
          name: 'delete',
          description: 'Delete {{resource}}',
          category: 'CRUD',
          requires: ['id'],
          optional: ['force'],
        },
      ],
    })

    // Flat pattern template
    this.registerTemplate('flat', {
      name: '{{domain}}',
      displayName: '{{displayName}}',
      description: '{{description}}',
      category: '{{category}}',
      compliance: ['{{compliance}}'],
      governance: ['{{governance}}'],
      resources: [
        {
          name: '{{command}}',
          displayName: '{{commandDisplayName}}',
          description: '{{commandDescription}}',
          actions: ['run'],
          attributes: ['name', 'status'],
          relationships: [],
        },
      ],
      actions: [
        {
          name: 'run',
          description: 'Run {{command}}',
          category: 'Execution',
          requires: [],
          optional: ['args', 'config'],
        },
      ],
    })

    // Microservice pattern template
    this.registerTemplate('microservice', {
      name: '{{domain}}',
      displayName: '{{displayName}}',
      description: '{{description}}',
      category: 'microservice',
      compliance: 'SOC2',
      governance: 'RBAC',
      resources: [
        {
          name: 'service',
          displayName: 'Service',
          description: 'Microservice instances',
          actions: ['create', 'list', 'show', 'update', 'delete', 'deploy', 'scale'],
          attributes: ['name', 'version', 'status', 'replicas', 'created'],
          relationships: ['config', 'secret'],
        },
        {
          name: 'config',
          displayName: 'Configuration',
          description: 'Service configurations',
          actions: ['create', 'list', 'show', 'update', 'delete', 'apply'],
          attributes: ['name', 'environment', 'status', 'created'],
          relationships: ['service'],
        },
        {
          name: 'secret',
          displayName: 'Secret',
          description: 'Service secrets',
          actions: ['create', 'list', 'show', 'update', 'delete', 'rotate'],
          attributes: ['name', 'type', 'status', 'created', 'expires'],
          relationships: ['service'],
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
          name: 'deploy',
          description: 'Deploy service',
          category: 'Operations',
          requires: ['id'],
          optional: ['environment', 'config'],
        },
        {
          name: 'scale',
          description: 'Scale service',
          category: 'Operations',
          requires: ['id', 'replicas'],
          optional: ['config'],
        },
        {
          name: 'apply',
          description: 'Apply configuration',
          category: 'Operations',
          requires: ['id'],
          optional: ['config'],
        },
        {
          name: 'rotate',
          description: 'Rotate secret',
          category: 'Security',
          requires: ['id'],
          optional: ['schedule'],
        },
      ],
    })

    // Database pattern template
    this.registerTemplate('database', {
      name: '{{domain}}',
      displayName: '{{displayName}}',
      description: '{{description}}',
      category: 'database',
      compliance: 'SOC2',
      governance: 'RBAC',
      resources: [
        {
          name: 'database',
          displayName: 'Database',
          description: 'Database instances',
          actions: ['create', 'list', 'show', 'update', 'delete', 'backup', 'restore'],
          attributes: ['name', 'type', 'version', 'status', 'created'],
          relationships: ['user', 'backup'],
        },
        {
          name: 'user',
          displayName: 'User',
          description: 'Database users',
          actions: ['create', 'list', 'show', 'update', 'delete', 'grant'],
          attributes: ['name', 'permissions', 'status', 'created'],
          relationships: ['database'],
        },
        {
          name: 'backup',
          displayName: 'Backup',
          description: 'Database backups',
          actions: ['create', 'list', 'show', 'delete', 'restore'],
          attributes: ['name', 'size', 'status', 'created'],
          relationships: ['database'],
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
          name: 'backup',
          description: 'Backup database',
          category: 'Operations',
          requires: ['id'],
          optional: ['schedule', 'retention'],
        },
        {
          name: 'restore',
          description: 'Restore database',
          category: 'Operations',
          requires: ['id', 'backup'],
          optional: ['target'],
        },
        {
          name: 'grant',
          description: 'Grant permissions',
          category: 'Security',
          requires: ['id', 'permissions'],
          optional: ['database'],
        },
      ],
    })

    // API pattern template
    this.registerTemplate('api', {
      name: '{{domain}}',
      displayName: '{{displayName}}',
      description: '{{description}}',
      category: 'api',
      compliance: 'SOC2',
      governance: 'RBAC',
      resources: [
        {
          name: 'endpoint',
          displayName: 'Endpoint',
          description: 'API endpoints',
          actions: ['create', 'list', 'show', 'update', 'delete', 'test'],
          attributes: ['name', 'method', 'path', 'status', 'created'],
          relationships: ['auth'],
        },
        {
          name: 'auth',
          displayName: 'Authentication',
          description: 'API authentication',
          actions: ['create', 'list', 'show', 'update', 'delete', 'validate'],
          attributes: ['name', 'type', 'status', 'created'],
          relationships: ['endpoint'],
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
          name: 'test',
          description: 'Test endpoint',
          category: 'Testing',
          requires: ['id'],
          optional: ['method', 'data'],
        },
        {
          name: 'validate',
          description: 'Validate authentication',
          category: 'Security',
          requires: ['id'],
          optional: ['token'],
        },
      ],
    })
  }

  /**
   * Register a template
   */
  registerTemplate(name, template) {
    this.templates.set(name, template)
  }

  /**
   * Get template by name
   */
  getTemplate(name) {
    return this.templates.get(name)
  }

  /**
   * List available templates
   */
  listTemplates() {
    return Array.from(this.templates.keys())
  }

  /**
   * Create domain from template
   */
  createDomainFromTemplate(templateName, data) {
    const template = this.getTemplate(templateName)
    if (!template) {
      throw new Error(`Template '${templateName}' not found`)
    }

    return this.applyTemplate(template, data)
  }

  /**
   * Apply template with data
   */
  applyTemplate(template, data) {
    const applyTemplateRecursive = (obj) => {
      if (typeof obj === 'string') {
        return obj.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          const value = data[key]
          if (value === undefined) {
            // Provide default values for common template variables
            const defaults = {
              compliance: 'SOC2',
              governance: 'RBAC',
              category: 'general',
            }
            return defaults[key] || match
          }
          return value
        })
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
   * Suggest template based on CLI structure
   */
  suggestTemplate(cliStructure) {
    const commands = cliStructure.commands || []
    const patterns = this.analyzeCommandPatterns(commands)

    if (patterns.hierarchical) {
      return 'hierarchical'
    } else if (patterns.microservice) {
      return 'microservice'
    } else if (patterns.database) {
      return 'database'
    } else if (patterns.api) {
      return 'api'
    } else if (patterns.flat) {
      return 'flat'
    } else {
      return 'noun-verb'
    }
  }

  /**
   * Analyze command patterns
   */
  analyzeCommandPatterns(commands) {
    const patterns = {
      hierarchical: false,
      microservice: false,
      database: false,
      api: false,
      flat: false,
    }

    let hierarchicalCount = 0
    let microserviceCount = 0
    let databaseCount = 0
    let apiCount = 0
    let flatCount = 0

    commands.forEach((command) => {
      const parts = command.split(' ')

      // Check for hierarchical pattern (3+ levels)
      if (parts.length >= 3) {
        hierarchicalCount++
      }

      // Check for microservice keywords
      if (command.includes('service') || command.includes('deploy') || command.includes('scale')) {
        microserviceCount++
      }

      // Check for database keywords
      if (
        command.includes('database') ||
        command.includes('backup') ||
        command.includes('restore')
      ) {
        databaseCount++
      }

      // Check for API keywords
      if (command.includes('endpoint') || command.includes('api') || command.includes('auth')) {
        apiCount++
      }

      // Check for flat pattern (1-2 levels)
      if (parts.length <= 2) {
        flatCount++
      }
    })

    // Determine dominant pattern - hierarchical takes precedence
    const total = commands.length
    if (hierarchicalCount > 0) {
      patterns.hierarchical = true
    } else if (microserviceCount > total * 0.5) {
      patterns.microservice = true
    } else if (databaseCount > total * 0.5) {
      patterns.database = true
    } else if (apiCount > total * 0.5) {
      patterns.api = true
    } else if (flatCount > total * 0.5) {
      patterns.flat = true
    }

    return patterns
  }

  /**
   * Get template metadata
   */
  getTemplateMetadata(templateName) {
    const template = this.getTemplate(templateName)
    if (!template) {
      return null
    }

    return {
      name: templateName,
      description: template.description || `Template for ${templateName} pattern`,
      category: template.category || 'general',
      resources: template.resources?.length || 0,
      actions: template.actions?.length || 0,
      compliance: template.compliance || [],
      governance: template.governance || [],
    }
  }

  /**
   * List all template metadata
   */
  listTemplateMetadata() {
    return Array.from(this.templates.keys()).map((name) => this.getTemplateMetadata(name))
  }

  /**
   * Validate template
   */
  validateTemplate(template) {
    const errors = []
    const warnings = []

    if (!template.name) {
      errors.push('Template must have a name')
    }

    if (!template.resources || !Array.isArray(template.resources)) {
      errors.push('Template must have resources array')
    }

    if (!template.actions || !Array.isArray(template.actions)) {
      errors.push('Template must have actions array')
    }

    if (template.resources) {
      template.resources.forEach((resource, index) => {
        if (!resource.name) {
          errors.push(`Resource at index ${index} must have a name`)
        }
        if (!resource.actions || !Array.isArray(resource.actions)) {
          errors.push(`Resource '${resource.name}' must have actions array`)
        }
      })
    }

    if (template.actions) {
      template.actions.forEach((action, index) => {
        if (!action.name) {
          errors.push(`Action at index ${index} must have a name`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }
}

export default DomainTemplates
