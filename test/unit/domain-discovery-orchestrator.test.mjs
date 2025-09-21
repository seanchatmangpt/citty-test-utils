#!/usr/bin/env node
// test/unit/domain-discovery-orchestrator.test.mjs - Domain Discovery Orchestrator Unit Tests

import { describe, it, expect, beforeEach } from 'vitest'
import { DomainDiscoveryOrchestrator } from '../../src/core/discovery/domain-discovery-orchestrator.js'

describe.skip('Domain Discovery Orchestrator Unit Tests', () => {
  let orchestrator

  beforeEach(() => {
    orchestrator = new DomainDiscoveryOrchestrator({
      rootDir: '.',
      timeout: 30000,
      enablePlugins: true,
      enableCLIAnalysis: true,
      enableConfigLoading: true,
      enablePackageJsonAnalysis: true,
    })
  })

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      const defaultOrchestrator = new DomainDiscoveryOrchestrator()

      expect(defaultOrchestrator.options.rootDir).toBe('.')
      expect(defaultOrchestrator.options.timeout).toBe(30000)
      expect(defaultOrchestrator.options.enablePlugins).toBe(true)
      expect(defaultOrchestrator.options.enableCLIAnalysis).toBe(true)
      expect(defaultOrchestrator.options.enableConfigLoading).toBe(true)
      expect(defaultOrchestrator.options.enablePackageJsonAnalysis).toBe(true)
    })

    it('should initialize with custom options', () => {
      const customOptions = {
        rootDir: '/custom/path',
        timeout: 60000,
        enablePlugins: false,
        enableCLIAnalysis: false,
        enableConfigLoading: false,
        enablePackageJsonAnalysis: false,
      }

      const customOrchestrator = new DomainDiscoveryOrchestrator(customOptions)

      expect(customOrchestrator.options.rootDir).toBe('/custom/path')
      expect(customOrchestrator.options.timeout).toBe(60000)
      expect(customOrchestrator.options.enablePlugins).toBe(false)
      expect(customOrchestrator.options.enableCLIAnalysis).toBe(false)
      expect(customOrchestrator.options.enableConfigLoading).toBe(false)
      expect(customOrchestrator.options.enablePackageJsonAnalysis).toBe(false)
    })

    it('should initialize all components', () => {
      expect(orchestrator.cliAnalyzer).toBeDefined()
      expect(orchestrator.domainLoader).toBeDefined()
      expect(orchestrator.pluginSystem).toBeDefined()
      expect(orchestrator.runtimeRegistry).toBeDefined()
      expect(orchestrator.validator).toBeDefined()
      expect(orchestrator.configManager).toBeDefined()
      expect(orchestrator.templates).toBeDefined()
    })

    it('should load built-in plugins', () => {
      const plugins = orchestrator.pluginSystem.getEnabledPlugins()

      expect(plugins).toHaveLength(3) // Built-in plugins
      expect(plugins.map((p) => p.name)).toContain('infrastructure')
      expect(plugins.map((p) => p.name)).toContain('development')
      expect(plugins.map((p) => p.name)).toContain('security')
    })
  })

  describe('Domain Registration', () => {
    it('should register domain from CLI analysis', async () => {
      const result = await orchestrator.registerDomainFromCLI('test', {
        resources: [
          {
            name: 'resource',
            displayName: 'Resource',
            description: 'Test resource',
            actions: ['create', 'list'],
            attributes: ['name'],
            relationships: [],
          },
        ],
        actions: [
          {
            name: 'create',
            description: 'Create resource',
            category: 'CRUD',
            requires: ['name'],
            optional: [],
          },
        ],
      })

      expect(result.success).toBe(true)
      expect(result.domain).toBeDefined()
      expect(result.domain.name).toBe('test')
    })

    it('should register domain from config', async () => {
      const domain = {
        name: 'test',
        displayName: 'Test',
        description: 'Test domain',
        category: 'general',
        resources: [
          {
            name: 'resource',
            displayName: 'Resource',
            description: 'Test resource',
            actions: ['create', 'list'],
            attributes: ['name'],
            relationships: [],
          },
        ],
        actions: [
          {
            name: 'create',
            description: 'Create resource',
            category: 'CRUD',
            requires: ['name'],
            optional: [],
          },
        ],
      }

      const result = await orchestrator.registerDomain(domain)

      expect(result.success).toBe(true)
      expect(result.domain).toBeDefined()
      expect(result.domain.name).toBe('test')
    })
  })

  describe('Domain Management', () => {
    it('should get domain by name', async () => {
      await orchestrator.registerDomainFromCLI('test', {
        resources: [
          {
            name: 'resource',
            displayName: 'Resource',
            description: 'Test resource',
            actions: ['create', 'list'],
            attributes: ['name'],
            relationships: [],
          },
        ],
        actions: [
          {
            name: 'create',
            description: 'Create resource',
            category: 'CRUD',
            requires: ['name'],
            optional: [],
          },
        ],
      })

      const domain = orchestrator.getDomain('test')

      expect(domain).toBeDefined()
      expect(domain.name).toBe('test')
    })

    it('should return undefined for non-existent domain', () => {
      const domain = orchestrator.getDomain('nonexistent')

      expect(domain).toBeUndefined()
    })

    it('should return empty array for non-existent domain resources', () => {
      const resources = orchestrator.getDomainResources('nonexistent')

      expect(resources).toEqual([])
    })

    it('should return empty array for non-existent domain actions', () => {
      const actions = orchestrator.getDomainActions('nonexistent')

      expect(actions).toEqual([])
    })

    it('should return invalid validation for non-existent command', () => {
      const validation = orchestrator.validateCommand('nonexistent command')

      expect(validation.valid).toBe(false)
      expect(validation.error).toBeDefined()
    })
  })

  describe('Template Management', () => {
    it('should suggest template for CLI', async () => {
      const result = await orchestrator.suggestTemplateForCLI({
        commands: ['test resource create', 'test resource list', 'test resource delete'],
      })

      expect(result.success).toBe(true)
      expect(result.template).toBeDefined()
    })
  })

  describe('Statistics and Monitoring', () => {
    it('should get component statistics', () => {
      const stats = orchestrator.getComponentStats()

      expect(stats.cliAnalyzer).toBeDefined()
      expect(stats.domainLoader).toBeDefined()
      expect(stats.pluginSystem).toBeDefined()
      expect(stats.runtimeRegistry).toBeDefined()
      expect(stats.validator).toBeDefined()
      expect(stats.configManager).toBeDefined()
      expect(stats.templates).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty domain names', async () => {
      const result = await orchestrator.registerDomain('')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle null domain names', async () => {
      const result = await orchestrator.registerDomain(null)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle undefined domain names', async () => {
      const result = await orchestrator.registerDomain(undefined)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle special characters in domain names', async () => {
      const result = await orchestrator.registerDomainFromCLI('test-domain', {
        resources: [
          {
            name: 'resource',
            displayName: 'Resource',
            description: 'Test resource',
            actions: ['create', 'list'],
            attributes: ['name'],
            relationships: [],
          },
        ],
        actions: [
          {
            name: 'create',
            description: 'Create resource',
            category: 'CRUD',
            requires: ['name'],
            optional: [],
          },
        ],
      })

      expect(result.success).toBe(true)
      expect(result.domain).toBeDefined()
      expect(result.domain.name).toBe('test-domain')
    })

    it('should handle very long domain names', async () => {
      const longName = 'a'.repeat(1000)
      const result = await orchestrator.registerDomainFromCLI(longName, {
        resources: [
          {
            name: 'resource',
            displayName: 'Resource',
            description: 'Test resource',
            actions: ['create', 'list'],
            attributes: ['name'],
            relationships: [],
          },
        ],
        actions: [
          {
            name: 'create',
            description: 'Create resource',
            category: 'CRUD',
            requires: ['name'],
            optional: [],
          },
        ],
      })

      expect(result.success).toBe(true)
      expect(result.domain).toBeDefined()
      expect(result.domain.name).toBe(longName)
    })
  })
})
