#!/usr/bin/env node
// test/unit/domain-templates.test.mjs - Domain Templates Unit Tests

import { describe, it, expect, beforeEach } from 'vitest'
import { DomainTemplates } from '../../src/core/discovery/domain-templates.js'

describe('Domain Templates Unit Tests', () => {
  let templates

  beforeEach(() => {
    templates = new DomainTemplates()
  })

  describe('Template Registration', () => {
    it('should register a custom template', () => {
      const customTemplate = {
        name: '{{domain}}',
        displayName: '{{displayName}}',
        description: '{{description}}',
        category: '{{category}}',
        resources: [
          {
            name: '{{resource}}',
            displayName: '{{resourceDisplayName}}',
            description: '{{resourceDescription}}',
            actions: ['create', 'list'],
            attributes: ['name'],
            relationships: [],
          },
        ],
        actions: [
          {
            name: 'create',
            description: 'Create {{resource}}',
            category: 'CRUD',
            requires: ['name'],
            optional: [],
          },
        ],
      }

      templates.registerTemplate('custom', customTemplate)

      expect(templates.getTemplate('custom')).toBeDefined()
      expect(templates.listTemplates()).toContain('custom')
    })

    it('should list all available templates', () => {
      const templateList = templates.listTemplates()

      expect(templateList).toContain('noun-verb')
      expect(templateList).toContain('hierarchical')
      expect(templateList).toContain('flat')
      expect(templateList).toContain('microservice')
      expect(templateList).toContain('database')
      expect(templateList).toContain('api')
    })

    it('should get template metadata', () => {
      const metadata = templates.getTemplateMetadata('noun-verb')

      expect(metadata.name).toBe('noun-verb')
      expect(metadata.description).toBeDefined()
      expect(metadata.category).toBeDefined()
      expect(metadata.resources).toBeGreaterThan(0)
      expect(metadata.actions).toBeGreaterThan(0)
      expect(metadata.compliance).toBeDefined()
      expect(metadata.governance).toBeDefined()
    })

    it('should list all template metadata', () => {
      const allMetadata = templates.listTemplateMetadata()

      expect(allMetadata).toHaveLength(6) // Built-in templates
      expect(allMetadata.every((m) => m.name)).toBe(true)
      expect(allMetadata.every((m) => m.description)).toBe(true)
      expect(allMetadata.every((m) => m.resources > 0)).toBe(true)
      expect(allMetadata.every((m) => m.actions > 0)).toBe(true)
    })
  })

  describe('Template Application', () => {
    it('should create domain from noun-verb template', () => {
      const data = {
        domain: 'test',
        displayName: 'Test',
        description: 'Test domain',
        category: 'general',
        resource: 'resource',
        resourceDisplayName: 'Resource',
        resourceDescription: 'Test resource',
      }

      const domain = templates.createDomainFromTemplate('noun-verb', data)

      expect(domain.name).toBe('test')
      expect(domain.displayName).toBe('Test')
      expect(domain.description).toBe('Test domain')
      expect(domain.category).toBe('general')
      expect(domain.resources).toHaveLength(1)
      expect(domain.resources[0].name).toBe('resource')
      expect(domain.resources[0].displayName).toBe('Resource')
      expect(domain.resources[0].description).toBe('Test resource')
      expect(domain.actions).toHaveLength(5)
      expect(domain.actions[0].name).toBe('create')
    })

    it('should create domain from hierarchical template', () => {
      const data = {
        domain: 'infra',
        displayName: 'Infrastructure',
        description: 'Infrastructure management',
        category: 'operations',
        subdomain: 'server',
        subdomainDisplayName: 'Server',
        subdomainDescription: 'Server management',
        resource: 'instance',
        resourceDisplayName: 'Instance',
        resourceDescription: 'Server instance',
      }

      const domain = templates.createDomainFromTemplate('hierarchical', data)

      expect(domain.name).toBe('infra')
      expect(domain.displayName).toBe('Infrastructure')
      expect(domain.resources).toHaveLength(2)
      expect(domain.resources[0].name).toBe('server')
      expect(domain.resources[1].name).toBe('instance')
    })

    it('should create domain from flat template', () => {
      const data = {
        domain: 'utils',
        displayName: 'Utilities',
        description: 'Utility commands',
        category: 'tools',
        command: 'clean',
        commandDisplayName: 'Clean',
        commandDescription: 'Clean up files',
      }

      const domain = templates.createDomainFromTemplate('flat', data)

      expect(domain.name).toBe('utils')
      expect(domain.displayName).toBe('Utilities')
      expect(domain.resources).toHaveLength(1)
      expect(domain.resources[0].name).toBe('clean')
      expect(domain.resources[0].actions).toEqual(['run'])
      expect(domain.actions).toHaveLength(1)
      expect(domain.actions[0].name).toBe('run')
    })

    it('should create domain from microservice template', () => {
      const data = {
        domain: 'microservices',
        displayName: 'Microservices',
        description: 'Microservice management',
        category: 'microservice',
      }

      const domain = templates.createDomainFromTemplate('microservice', data)

      expect(domain.name).toBe('microservices')
      expect(domain.displayName).toBe('Microservices')
      expect(domain.category).toBe('microservice')
      expect(domain.resources).toHaveLength(3)
      expect(domain.resources.map((r) => r.name)).toContain('service')
      expect(domain.resources.map((r) => r.name)).toContain('config')
      expect(domain.resources.map((r) => r.name)).toContain('secret')
      expect(domain.actions).toHaveLength(9)
      expect(domain.actions.map((a) => a.name)).toContain('deploy')
      expect(domain.actions.map((a) => a.name)).toContain('scale')
    })

    it('should create domain from database template', () => {
      const data = {
        domain: 'database',
        displayName: 'Database',
        description: 'Database management',
        category: 'database',
      }

      const domain = templates.createDomainFromTemplate('database', data)

      expect(domain.name).toBe('database')
      expect(domain.displayName).toBe('Database')
      expect(domain.category).toBe('database')
      expect(domain.resources).toHaveLength(3)
      expect(domain.resources.map((r) => r.name)).toContain('database')
      expect(domain.resources.map((r) => r.name)).toContain('user')
      expect(domain.resources.map((r) => r.name)).toContain('backup')
      expect(domain.actions).toHaveLength(8)
      expect(domain.actions.map((a) => a.name)).toContain('backup')
      expect(domain.actions.map((a) => a.name)).toContain('restore')
    })

    it('should create domain from API template', () => {
      const data = {
        domain: 'api',
        displayName: 'API',
        description: 'API management',
        category: 'api',
      }

      const domain = templates.createDomainFromTemplate('api', data)

      expect(domain.name).toBe('api')
      expect(domain.displayName).toBe('API')
      expect(domain.category).toBe('api')
      expect(domain.resources).toHaveLength(2)
      expect(domain.resources.map((r) => r.name)).toContain('endpoint')
      expect(domain.resources.map((r) => r.name)).toContain('auth')
      expect(domain.actions).toHaveLength(7)
      expect(domain.actions.map((a) => a.name)).toContain('test')
      expect(domain.actions.map((a) => a.name)).toContain('validate')
    })

    it('should handle missing template variables with defaults', () => {
      const data = {
        domain: 'test',
        displayName: 'Test',
        description: 'Test domain',
        resource: 'resource',
        resourceDisplayName: 'Resource',
        resourceDescription: 'Test resource',
        // Missing: category, compliance, governance
      }

      const domain = templates.createDomainFromTemplate('noun-verb', data)

      expect(domain.name).toBe('test')
      expect(domain.category).toBe('general') // Default value
      expect(domain.compliance).toBe('SOC2') // Default value
      expect(domain.governance).toBe('RBAC') // Default value
    })

    it('should throw error for non-existent template', () => {
      expect(() => {
        templates.createDomainFromTemplate('non-existent', {})
      }).toThrow("Template 'non-existent' not found")
    })
  })

  describe('Template Suggestion', () => {
    it('should suggest hierarchical template for 3+ level commands', () => {
      const cliStructure = {
        commands: [
          'infra server create',
          'infra server list',
          'infra network create',
          'dev project create',
          'dev app deploy',
        ],
      }

      const suggestedTemplate = templates.suggestTemplate(cliStructure)

      expect(suggestedTemplate).toBe('hierarchical')
    })

    it('should suggest microservice template for service keywords', () => {
      const cliStructure = {
        commands: ['service create', 'service deploy', 'service scale', 'config update'],
      }

      const suggestedTemplate = templates.suggestTemplate(cliStructure)

      expect(suggestedTemplate).toBe('microservice')
    })

    it('should suggest database template for database keywords', () => {
      const cliStructure = {
        commands: ['database create', 'database backup', 'database restore', 'user create'],
      }

      const suggestedTemplate = templates.suggestTemplate(cliStructure)

      expect(suggestedTemplate).toBe('database')
    })

    it('should suggest API template for API keywords', () => {
      const cliStructure = {
        commands: ['endpoint create', 'api test', 'auth validate'],
      }

      const suggestedTemplate = templates.suggestTemplate(cliStructure)

      expect(suggestedTemplate).toBe('api')
    })

    it('should suggest flat template for single commands', () => {
      const cliStructure = {
        commands: ['clean', 'build', 'test'],
      }

      const suggestedTemplate = templates.suggestTemplate(cliStructure)

      expect(suggestedTemplate).toBe('flat')
    })

    it('should suggest noun-verb as default', () => {
      const cliStructure = {
        commands: ['unknown command', 'mystery action'],
      }

      const suggestedTemplate = templates.suggestTemplate(cliStructure)

      expect(suggestedTemplate).toBe('noun-verb')
    })

    it('should handle empty command list', () => {
      const cliStructure = {
        commands: [],
      }

      const suggestedTemplate = templates.suggestTemplate(cliStructure)

      expect(suggestedTemplate).toBe('noun-verb')
    })
  })

  describe('Command Pattern Analysis', () => {
    it('should analyze hierarchical patterns', () => {
      const commands = [
        'infra server create',
        'infra server list',
        'dev project create',
        'dev project deploy',
      ]

      const patterns = templates.analyzeCommandPatterns(commands)

      expect(patterns.hierarchical).toBe(true)
      expect(patterns.microservice).toBe(false)
      expect(patterns.database).toBe(false)
      expect(patterns.api).toBe(false)
      expect(patterns.flat).toBe(false)
    })

    it('should analyze microservice patterns', () => {
      const commands = ['service create', 'service deploy', 'service scale', 'config update']

      const patterns = templates.analyzeCommandPatterns(commands)

      expect(patterns.hierarchical).toBe(false)
      expect(patterns.microservice).toBe(true)
      expect(patterns.database).toBe(false)
      expect(patterns.api).toBe(false)
      expect(patterns.flat).toBe(false)
    })

    it('should analyze database patterns', () => {
      const commands = ['database create', 'database backup', 'database restore', 'user create']

      const patterns = templates.analyzeCommandPatterns(commands)

      expect(patterns.hierarchical).toBe(false)
      expect(patterns.microservice).toBe(false)
      expect(patterns.database).toBe(true)
      expect(patterns.api).toBe(false)
      expect(patterns.flat).toBe(false)
    })

    it('should analyze API patterns', () => {
      const commands = ['endpoint create', 'api test', 'auth validate']

      const patterns = templates.analyzeCommandPatterns(commands)

      expect(patterns.hierarchical).toBe(false)
      expect(patterns.microservice).toBe(false)
      expect(patterns.database).toBe(false)
      expect(patterns.api).toBe(true)
      expect(patterns.flat).toBe(false)
    })

    it('should analyze flat patterns', () => {
      const commands = ['clean', 'build', 'test']

      const patterns = templates.analyzeCommandPatterns(commands)

      expect(patterns.hierarchical).toBe(false)
      expect(patterns.microservice).toBe(false)
      expect(patterns.database).toBe(false)
      expect(patterns.api).toBe(false)
      expect(patterns.flat).toBe(true)
    })

    it('should handle mixed patterns', () => {
      const commands = [
        'infra server create', // hierarchical
        'service deploy', // microservice
        'database backup', // database
        'endpoint test', // api
        'clean', // flat
      ]

      const patterns = templates.analyzeCommandPatterns(commands)

      expect(patterns.hierarchical).toBe(true)
      expect(patterns.microservice).toBe(true)
      expect(patterns.database).toBe(true)
      expect(patterns.api).toBe(true)
      expect(patterns.flat).toBe(true)
    })
  })

  describe('Template Validation', () => {
    it('should validate valid template', () => {
      const validTemplate = {
        name: 'test',
        resources: [
          {
            name: 'resource',
            actions: ['create', 'list'],
          },
        ],
        actions: [
          {
            name: 'create',
            description: 'Create resource',
            category: 'CRUD',
            requires: [],
            optional: [],
          },
        ],
      }

      const validation = templates.validateTemplate(validTemplate)

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should reject template without name', () => {
      const invalidTemplate = {
        resources: [
          {
            name: 'resource',
            actions: ['create'],
          },
        ],
        actions: [
          {
            name: 'create',
            description: 'Create resource',
            category: 'CRUD',
            requires: [],
            optional: [],
          },
        ],
      }

      const validation = templates.validateTemplate(invalidTemplate)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Template must have a name')
    })

    it('should reject template without resources array', () => {
      const invalidTemplate = {
        name: 'test',
        actions: [
          {
            name: 'create',
            description: 'Create resource',
            category: 'CRUD',
            requires: [],
            optional: [],
          },
        ],
      }

      const validation = templates.validateTemplate(invalidTemplate)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Template must have resources array')
    })

    it('should reject template without actions array', () => {
      const invalidTemplate = {
        name: 'test',
        resources: [
          {
            name: 'resource',
            actions: ['create'],
          },
        ],
      }

      const validation = templates.validateTemplate(invalidTemplate)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Template must have actions array')
    })

    it('should reject resource without name', () => {
      const invalidTemplate = {
        name: 'test',
        resources: [
          {
            actions: ['create'],
          },
        ],
        actions: [
          {
            name: 'create',
            description: 'Create resource',
            category: 'CRUD',
            requires: [],
            optional: [],
          },
        ],
      }

      const validation = templates.validateTemplate(invalidTemplate)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Resource at index 0 must have a name')
    })

    it('should reject resource without actions array', () => {
      const invalidTemplate = {
        name: 'test',
        resources: [
          {
            name: 'resource',
          },
        ],
        actions: [
          {
            name: 'create',
            description: 'Create resource',
            category: 'CRUD',
            requires: [],
            optional: [],
          },
        ],
      }

      const validation = templates.validateTemplate(invalidTemplate)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain("Resource 'resource' must have actions array")
    })

    it('should reject action without name', () => {
      const invalidTemplate = {
        name: 'test',
        resources: [
          {
            name: 'resource',
            actions: ['create'],
          },
        ],
        actions: [
          {
            description: 'Create resource',
            category: 'CRUD',
            requires: [],
            optional: [],
          },
        ],
      }

      const validation = templates.validateTemplate(invalidTemplate)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Action at index 0 must have a name')
    })
  })

  describe('Edge Cases', () => {
    it('should handle template with empty resources', () => {
      const data = {
        domain: 'empty',
        displayName: 'Empty',
        description: 'Empty domain',
        resource: 'resource',
        resourceDisplayName: 'Resource',
        resourceDescription: 'Test resource',
      }

      const domain = templates.createDomainFromTemplate('noun-verb', data)

      expect(domain.resources).toHaveLength(1)
      expect(domain.resources[0].name).toBe('resource')
    })

    it('should handle template with empty actions', () => {
      const data = {
        domain: 'test',
        displayName: 'Test',
        description: 'Test domain',
        resource: 'resource',
        resourceDisplayName: 'Resource',
        resourceDescription: 'Test resource',
      }

      const domain = templates.createDomainFromTemplate('noun-verb', data)

      expect(domain.actions).toHaveLength(5) // Default actions
      expect(domain.actions[0].name).toBe('create')
    })

    it('should handle template with special characters in data', () => {
      const data = {
        domain: 'test-domain',
        displayName: 'Test Domain',
        description: 'Test domain with special chars: !@#$%',
        category: 'test-category',
        resource: 'test-resource',
        resourceDisplayName: 'Test Resource',
        resourceDescription: 'Test resource with special chars: !@#$%',
      }

      const domain = templates.createDomainFromTemplate('noun-verb', data)

      expect(domain.name).toBe('test-domain')
      expect(domain.displayName).toBe('Test Domain')
      expect(domain.description).toBe('Test domain with special chars: !@#$%')
      expect(domain.category).toBe('test-category')
    })

    it('should handle template with nested objects', () => {
      const data = {
        domain: 'test',
        displayName: 'Test',
        description: 'Test domain',
        resource: 'resource',
        resourceDisplayName: 'Resource',
        resourceDescription: 'Test resource',
        metadata: {
          nested: {
            value: 'test',
          },
        },
      }

      const domain = templates.createDomainFromTemplate('noun-verb', data)

      expect(domain.name).toBe('test')
      expect(domain.resources[0].name).toBe('resource')
    })
  })
})
