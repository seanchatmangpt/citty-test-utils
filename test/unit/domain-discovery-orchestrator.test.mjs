#!/usr/bin/env node
// test/unit/domain-discovery-orchestrator.test.mjs - Domain Discovery Orchestrator Unit Tests

import { describe, it, expect, beforeEach } from 'vitest'
import { DomainDiscoveryOrchestrator } from '../../src/core/discovery/domain-discovery-orchestrator.js'

describe('Domain Discovery Orchestrator Unit Tests', () => {
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

      expect(plugins).toHaveLength(2) // Built-in plugins
      expect(plugins.map((p) => p.name)).toContain('citty')
      expect(plugins.map((p) => p.name)).toContain('gitvan')
    })
  })

  describe('Domain Discovery', () => {
    it('should discover domains from CLI analysis', async () => {
      const mockCLIOutput = `
USAGE:
  test-cli [COMMAND]

COMMANDS:
  infra server create    Create a server
  infra server list      List servers
  dev project create     Create a project
  dev project deploy     Deploy a project
      `

      const domains = await orchestrator.discoverDomains({
        cliAnalysis: {
          domains: ['infra', 'dev'],
          resources: [
            { name: 'server', domain: 'infra', actions: ['create', 'list'] },
            { name: 'project', domain: 'dev', actions: ['create', 'deploy'] },
          ],
          actions: [
            { name: 'create', domain: 'infra', resource: 'server' },
            { name: 'list', domain: 'infra', resource: 'server' },
            { name: 'create', domain: 'dev', resource: 'project' },
            { name: 'deploy', domain: 'dev', resource: 'project' },
          ],
        },
      })

      expect(domains).toHaveLength(2)
      expect(domains.map((d) => d.name)).toContain('infra')
      expect(domains.map((d) => d.name)).toContain('dev')
    })

    it('should discover domains from config', async () => {
      const domains = await orchestrator.discoverDomains({
        config: {
          domains: [
            {
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
            },
          ],
        },
      })

      expect(domains).toHaveLength(1)
      expect(domains[0].name).toBe('test')
      expect(domains[0].displayName).toBe('Test')
    })

    it('should discover domains from package.json', async () => {
      const domains = await orchestrator.discoverDomains({
        packageJson: {
          name: 'test-cli',
          version: '1.0.0',
          description: 'Test CLI',
          citty: {
            domains: ['test'],
          },
        },
      })

      expect(domains).toHaveLength(1)
      expect(domains[0].name).toBe('test')
    })

    it('should discover domains from plugins', async () => {
      const domains = await orchestrator.discoverDomains({
        plugins: [
          {
            name: 'test-plugin',
            domains: [
              {
                name: 'plugin',
                displayName: 'Plugin',
                description: 'Plugin domain',
                category: 'plugin',
                resources: [
                  {
                    name: 'resource',
                    displayName: 'Resource',
                    description: 'Plugin resource',
                    actions: ['create'],
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
              },
            ],
          },
        ],
      })

      expect(domains).toHaveLength(1)
      expect(domains[0].name).toBe('plugin')
      expect(domains[0].displayName).toBe('Plugin')
    })

    it('should merge domains from multiple sources', async () => {
      const domains = await orchestrator.discoverDomains({
        cliAnalysis: {
          domains: ['infra'],
          resources: [{ name: 'server', domain: 'infra', actions: ['create'] }],
          actions: [{ name: 'create', domain: 'infra', resource: 'server' }],
        },
        config: {
          domains: [
            {
              name: 'test',
              displayName: 'Test',
              description: 'Test domain',
              category: 'general',
              resources: [
                {
                  name: 'resource',
                  displayName: 'Resource',
                  description: 'Test resource',
                  actions: ['create'],
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
            },
          ],
        },
      })

      expect(domains).toHaveLength(2)
      expect(domains.map((d) => d.name)).toContain('infra')
      expect(domains.map((d) => d.name)).toContain('test')
    })

    it('should handle empty discovery sources', async () => {
      const domains = await orchestrator.discoverDomains({})

      expect(domains).toHaveLength(0)
    })

    it('should handle discovery errors gracefully', async () => {
      const domains = await orchestrator.discoverDomains({
        cliAnalysis: {
          domains: ['error'],
          resources: [],
          actions: [],
        },
      })

      expect(domains).toHaveLength(1)
      expect(domains[0].name).toBe('error')
    })
  })

  describe('Domain Registration', () => {
    it('should register domain from CLI analysis', async () => {
      const cliAnalysis = {
        domains: ['test'],
        resources: [{ name: 'resource', domain: 'test', actions: ['create'] }],
        actions: [{ name: 'create', domain: 'test', resource: 'resource' }],
      }

      const result = await orchestrator.registerDomain('test', cliAnalysis)

      expect(result.success).toBe(true)
      expect(result.domain.name).toBe('test')
      expect(result.domain.resources).toHaveLength(1)
      expect(result.domain.resources[0].name).toBe('resource')
    })

    it('should register domain from config', async () => {
      const config = {
        name: 'test',
        displayName: 'Test',
        description: 'Test domain',
        category: 'general',
        resources: [
          {
            name: 'resource',
            displayName: 'Resource',
            description: 'Test resource',
            actions: ['create'],
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

      const result = await orchestrator.registerDomain('test', config)

      expect(result.success).toBe(true)
      expect(result.domain.name).toBe('test')
      expect(result.domain.displayName).toBe('Test')
    })

    it('should register domain from template', async () => {
      const template = 'noun-verb'
      const data = {
        domain: 'test',
        displayName: 'Test',
        description: 'Test domain',
        category: 'general',
        resource: 'resource',
        resourceDisplayName: 'Resource',
        resourceDescription: 'Test resource',
      }

      const result = await orchestrator.registerDomain('test', template, data)

      expect(result.success).toBe(true)
      expect(result.domain.name).toBe('test')
      expect(result.domain.displayName).toBe('Test')
    })

    it('should handle registration errors', async () => {
      const result = await orchestrator.registerDomain('test', 'invalid-source')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should validate domain before registration', async () => {
      const invalidDomain = {
        name: 'test',
        resources: [], // Empty resources
        actions: [], // Empty actions
      }

      const result = await orchestrator.registerDomain('test', invalidDomain)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Domain Management', () => {
    it('should get domain by name', async () => {
      const cliAnalysis = {
        domains: ['test'],
        resources: [{ name: 'resource', domain: 'test', actions: ['create'] }],
        actions: [{ name: 'create', domain: 'test', resource: 'resource' }],
      }

      await orchestrator.registerDomain('test', cliAnalysis)
      const domain = orchestrator.getDomain('test')

      expect(domain).toBeDefined()
      expect(domain.name).toBe('test')
    })

    it('should get domain resources', async () => {
      const cliAnalysis = {
        domains: ['test'],
        resources: [
          { name: 'resource1', domain: 'test', actions: ['create'] },
          { name: 'resource2', domain: 'test', actions: ['list'] },
        ],
        actions: [
          { name: 'create', domain: 'test', resource: 'resource1' },
          { name: 'list', domain: 'test', resource: 'resource2' },
        ],
      }

      await orchestrator.registerDomain('test', cliAnalysis)
      const resources = orchestrator.getDomainResources('test')

      expect(resources).toHaveLength(2)
      expect(resources.map((r) => r.name)).toContain('resource1')
      expect(resources.map((r) => r.name)).toContain('resource2')
    })

    it('should get domain actions', async () => {
      const cliAnalysis = {
        domains: ['test'],
        resources: [{ name: 'resource', domain: 'test', actions: ['create', 'list'] }],
        actions: [
          { name: 'create', domain: 'test', resource: 'resource' },
          { name: 'list', domain: 'test', resource: 'resource' },
        ],
      }

      await orchestrator.registerDomain('test', cliAnalysis)
      const actions = orchestrator.getDomainActions('test')

      expect(actions).toHaveLength(2)
      expect(actions.map((a) => a.name)).toContain('create')
      expect(actions.map((a) => a.name)).toContain('list')
    })

    it('should validate command', async () => {
      const cliAnalysis = {
        domains: ['test'],
        resources: [{ name: 'resource', domain: 'test', actions: ['create'] }],
        actions: [{ name: 'create', domain: 'test', resource: 'resource' }],
      }

      await orchestrator.registerDomain('test', cliAnalysis)
      const validation = orchestrator.validateCommand('test resource create')

      expect(validation.valid).toBe(true)
      expect(validation.domain).toBe('test')
      expect(validation.resource).toBe('resource')
      expect(validation.action).toBe('create')
    })

    it('should return undefined for non-existent domain', () => {
      const domain = orchestrator.getDomain('non-existent')

      expect(domain).toBeUndefined()
    })

    it('should return empty array for non-existent domain resources', () => {
      const resources = orchestrator.getDomainResources('non-existent')

      expect(resources).toEqual([])
    })

    it('should return empty array for non-existent domain actions', () => {
      const actions = orchestrator.getDomainActions('non-existent')

      expect(actions).toEqual([])
    })

    it('should return invalid validation for non-existent command', () => {
      const validation = orchestrator.validateCommand('non-existent command')

      expect(validation.valid).toBe(false)
      expect(validation.error).toBeDefined()
    })
  })

  describe('Template Management', () => {
    it('should create domain from template', async () => {
      const template = 'noun-verb'
      const data = {
        domain: 'test',
        displayName: 'Test',
        description: 'Test domain',
        category: 'general',
        resource: 'resource',
        resourceDisplayName: 'Resource',
        resourceDescription: 'Test resource',
      }

      const domain = await orchestrator.createDomainFromTemplate(template, data)

      expect(domain.name).toBe('test')
      expect(domain.displayName).toBe('Test')
      expect(domain.resources).toHaveLength(1)
      expect(domain.resources[0].name).toBe('resource')
    })

    it('should suggest template for CLI', async () => {
      const cliStructure = {
        commands: ['infra server create', 'infra server list', 'dev project create'],
      }

      const suggestedTemplate = await orchestrator.suggestTemplateForCLI(cliStructure)

      expect(suggestedTemplate).toBe('hierarchical')
    })

    it('should handle template creation errors', async () => {
      const result = await orchestrator.createDomainFromTemplate('non-existent', {})

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle template suggestion errors', async () => {
      const result = await orchestrator.suggestTemplateForCLI({ commands: [] })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Statistics and Monitoring', () => {
    it('should get orchestrator statistics', async () => {
      const cliAnalysis = {
        domains: ['test'],
        resources: [{ name: 'resource', domain: 'test', actions: ['create'] }],
        actions: [{ name: 'create', domain: 'test', resource: 'resource' }],
      }

      await orchestrator.registerDomain('test', cliAnalysis)
      const stats = orchestrator.getOrchestratorStats()

      expect(stats.domains).toBe(1)
      expect(stats.resources).toBe(1)
      expect(stats.actions).toBe(1)
      expect(stats.plugins).toBe(2) // Built-in plugins
      expect(stats.templates).toBe(6) // Built-in templates
    })

    it('should get component statistics', async () => {
      const stats = orchestrator.getComponentStats()

      expect(stats.cliAnalyzer).toBeDefined()
      expect(stats.domainLoader).toBeDefined()
      expect(stats.pluginSystem).toBeDefined()
      expect(stats.runtimeRegistry).toBeDefined()
      expect(stats.validator).toBeDefined()
      expect(stats.configManager).toBeDefined()
      expect(stats.templates).toBeDefined()
    })

    it('should get performance metrics', async () => {
      const cliAnalysis = {
        domains: ['test'],
        resources: [{ name: 'resource', domain: 'test', actions: ['create'] }],
        actions: [{ name: 'create', domain: 'test', resource: 'resource' }],
      }

      await orchestrator.registerDomain('test', cliAnalysis)
      const metrics = orchestrator.getPerformanceMetrics()

      expect(metrics.discoveryTime).toBeGreaterThan(0)
      expect(metrics.registrationTime).toBeGreaterThan(0)
      expect(metrics.validationTime).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle discovery errors gracefully', async () => {
      const domains = await orchestrator.discoverDomains({
        cliAnalysis: {
          domains: ['error'],
          resources: [],
          actions: [],
        },
      })

      expect(domains).toHaveLength(1)
      expect(domains[0].name).toBe('error')
    })

    it('should handle registration errors gracefully', async () => {
      const result = await orchestrator.registerDomain('test', 'invalid-source')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle validation errors gracefully', async () => {
      const validation = orchestrator.validateCommand('invalid command')

      expect(validation.valid).toBe(false)
      expect(validation.error).toBeDefined()
    })

    it('should handle template errors gracefully', async () => {
      const result = await orchestrator.createDomainFromTemplate('non-existent', {})

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty domain names', async () => {
      const result = await orchestrator.registerDomain('', {})

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle null domain names', async () => {
      const result = await orchestrator.registerDomain(null, {})

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle undefined domain names', async () => {
      const result = await orchestrator.registerDomain(undefined, {})

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle special characters in domain names', async () => {
      const cliAnalysis = {
        domains: ['test-domain'],
        resources: [{ name: 'resource', domain: 'test-domain', actions: ['create'] }],
        actions: [{ name: 'create', domain: 'test-domain', resource: 'resource' }],
      }

      const result = await orchestrator.registerDomain('test-domain', cliAnalysis)

      expect(result.success).toBe(true)
      expect(result.domain.name).toBe('test-domain')
    })

    it('should handle very long domain names', async () => {
      const longName = 'a'.repeat(1000)
      const cliAnalysis = {
        domains: [longName],
        resources: [{ name: 'resource', domain: longName, actions: ['create'] }],
        actions: [{ name: 'create', domain: longName, resource: 'resource' }],
      }

      const result = await orchestrator.registerDomain(longName, cliAnalysis)

      expect(result.success).toBe(true)
      expect(result.domain.name).toBe(longName)
    })
  })
})
