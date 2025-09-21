#!/usr/bin/env node
// test/domain-discovery/domain-discovery-system.test.mjs - Comprehensive Domain Discovery System Test

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DomainDiscoveryOrchestrator } from '../../src/core/discovery/domain-discovery-orchestrator.js'
import { CLIAnalyzer } from '../../src/core/discovery/cli-analyzer.js'
import { DomainLoader } from '../../src/core/discovery/domain-loader.js'
import { DomainPluginSystem } from '../../src/core/discovery/domain-plugin-system.js'
import { RuntimeDomainRegistry } from '../../src/core/discovery/runtime-domain-registry.js'
import { DomainValidator } from '../../src/core/discovery/domain-validator.js'
import { DomainConfigManager } from '../../src/core/discovery/domain-config-manager.js'
import { DomainTemplates } from '../../src/core/discovery/domain-templates.js'
import { writeFile, readFile, existsSync } from 'node:fs/promises'
import { resolve } from 'node:path'

describe('Domain Discovery System', () => {
  let orchestrator
  let testConfigPath
  let testCLIPath
  let testPackageJsonPath

  beforeEach(async () => {
    // Create test configuration
    testConfigPath = resolve(process.cwd(), 'test-domain-config.json')
    testCLIPath = resolve(process.cwd(), 'test-cli.js')
    testPackageJsonPath = resolve(process.cwd(), 'test-package.json')

    // Create test CLI file
    await writeFile(
      testCLIPath,
      `#!/usr/bin/env node
// Test CLI for domain discovery

console.log(\`USAGE:
  test-cli <command> [options]

COMMANDS:
  infra server create <name> [options]    Create a new server
  infra server list [options]             List servers
  infra server show <id> [options]        Show server details
  infra server update <id> [options]      Update server
  infra server delete <id> [options]      Delete server
  infra network create <name> [options]    Create a new network
  infra network list [options]            List networks
  dev project create <name> [options]     Create a new project
  dev project list [options]              List projects
  dev app create <name> [options]          Create a new app
  dev app list [options]                  List apps
  security user create <name> [options]   Create a new user
  security user list [options]            List users
\`)

if (process.argv.includes('--help')) {
  process.exit(0)
}
`,
      'utf8'
    )

    // Create test package.json
    await writeFile(
      testPackageJsonPath,
      JSON.stringify(
        {
          name: 'test-cli',
          version: '1.0.0',
          scripts: {
            'infra:server:create': 'echo "Creating server"',
            'infra:server:list': 'echo "Listing servers"',
            'infra:network:create': 'echo "Creating network"',
            'dev:project:create': 'echo "Creating project"',
            'dev:app:create': 'echo "Creating app"',
            'security:user:create': 'echo "Creating user"',
          },
        },
        null,
        2
      ),
      'utf8'
    )

    // Create test configuration
    await writeFile(
      testConfigPath,
      JSON.stringify(
        {
          domains: {
            infra: {
              displayName: 'Infrastructure',
              description: 'Infrastructure management',
              category: 'operations',
              resources: [
                {
                  name: 'server',
                  displayName: 'Server',
                  description: 'Server instances',
                  actions: ['create', 'list', 'show', 'update', 'delete'],
                  attributes: ['name', 'type', 'status'],
                  relationships: ['network'],
                },
                {
                  name: 'network',
                  displayName: 'Network',
                  description: 'Network infrastructure',
                  actions: ['create', 'list', 'show', 'update', 'delete'],
                  attributes: ['name', 'cidr', 'status'],
                  relationships: ['server'],
                },
              ],
            },
            dev: {
              displayName: 'Development',
              description: 'Development operations',
              category: 'development',
              resources: [
                {
                  name: 'project',
                  displayName: 'Project',
                  description: 'Development projects',
                  actions: ['create', 'list', 'show', 'update', 'delete'],
                  attributes: ['name', 'type', 'status'],
                  relationships: ['app'],
                },
                {
                  name: 'app',
                  displayName: 'Application',
                  description: 'Applications',
                  actions: ['create', 'list', 'show', 'update', 'delete'],
                  attributes: ['name', 'version', 'status'],
                  relationships: ['project'],
                },
              ],
            },
          },
          discovery: {
            enabled: true,
            sources: ['cli-help', 'package-scripts', 'config-files'],
          },
          validation: {
            strict: false,
            autoCreate: true,
            fallbackStrategy: 'generic',
          },
        },
        null,
        2
      ),
      'utf8'
    )

    orchestrator = new DomainDiscoveryOrchestrator({
      configPath: testConfigPath,
      cliPath: testCLIPath,
      packageJsonPath: testPackageJsonPath,
      autoDiscover: true,
      validateDomains: true,
      fallbackStrategy: 'generic',
    })
  })

  afterEach(async () => {
    // Clean up test files
    try {
      if (existsSync(testConfigPath))
        await import('node:fs').then((fs) => fs.promises.unlink(testConfigPath))
      if (existsSync(testCLIPath))
        await import('node:fs').then((fs) => fs.promises.unlink(testCLIPath))
      if (existsSync(testPackageJsonPath))
        await import('node:fs').then((fs) => fs.promises.unlink(testPackageJsonPath))
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('CLI Analyzer', () => {
    it('should analyze CLI structure from help output', async () => {
      const analyzer = new CLIAnalyzer()
      const result = await analyzer.analyzeFromCLI(testCLIPath)

      expect(result.domains).toContain('infra')
      expect(result.domains).toContain('dev')
      expect(result.domains).toContain('security')
      expect(result.resources.infra).toContain('server')
      expect(result.resources.infra).toContain('network')
      expect(result.resources.dev).toContain('project')
      expect(result.resources.dev).toContain('app')
      expect(result.actions).toContain('create')
      expect(result.actions).toContain('list')
      expect(result.actions).toContain('show')
    })

    it('should parse command patterns correctly', () => {
      const analyzer = new CLIAnalyzer()
      const result = analyzer.parseCommandLine('infra server create <name> [options]')

      expect(result.domain).toBe('infra')
      expect(result.resource).toBe('server')
      expect(result.action).toBe('create')
    })

    it('should identify likely actions', () => {
      const analyzer = new CLIAnalyzer()
      expect(analyzer.isLikelyAction('create')).toBe(true)
      expect(analyzer.isLikelyAction('list')).toBe(true)
      expect(analyzer.isLikelyAction('update')).toBe(true)
      expect(analyzer.isLikelyAction('delete')).toBe(true)
      expect(analyzer.isLikelyAction('server')).toBe(false)
    })
  })

  describe('Domain Loader', () => {
    it('should load domains from multiple sources', async () => {
      const loader = new DomainLoader()

      // Register test sources
      loader.registerSource('cli-test', {
        loader: async () => ({
          domains: ['infra', 'dev'],
          resources: {
            infra: ['server', 'network'],
            dev: ['project', 'app'],
          },
          actions: ['create', 'list', 'show', 'update', 'delete'],
          commands: {},
        }),
        validator: (result) => result.domains && result.domains.length > 0,
        priority: 10,
      })

      loader.registerSource('config-test', {
        loader: async () => ({
          domains: ['security'],
          resources: {
            security: ['user', 'role'],
          },
          actions: ['create', 'list', 'show'],
          commands: {},
        }),
        validator: (result) => result.domains && result.domains.length > 0,
        priority: 8,
      })

      const result = await loader.loadAll({
        sources: ['cli-test', 'config-test'],
      })

      expect(result.domains).toContain('infra')
      expect(result.domains).toContain('dev')
      expect(result.domains).toContain('security')
      expect(result.resources.infra).toContain('server')
      expect(result.resources.infra).toContain('network')
      expect(result.resources.security).toContain('user')
    })

    it('should load from package.json scripts', async () => {
      const loader = new DomainLoader()
      const result = await loader.loadFromPackageJson({
        packageJsonPath: testPackageJsonPath,
      })

      expect(result.domains).toContain('infra')
      expect(result.domains).toContain('dev')
      expect(result.domains).toContain('security')
    })

    it('should load from configuration file', async () => {
      const loader = new DomainLoader()
      const result = await loader.loadFromConfig({
        configPath: testConfigPath,
      })

      expect(result.domains).toContain('infra')
      expect(result.domains).toContain('dev')
      expect(result.resources.infra).toContain('server')
      expect(result.resources.infra).toContain('network')
    })
  })

  describe('Domain Plugin System', () => {
    it('should register and manage plugins', () => {
      const pluginSystem = new DomainPluginSystem()

      const plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
        domains: {
          test: {
            name: 'test',
            displayName: 'Test',
            description: 'Test domain',
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
          },
        },
      }

      pluginSystem.registerPlugin('test-plugin', plugin)

      expect(pluginSystem.getPlugins()).toHaveLength(1)
      expect(pluginSystem.getEnabledPlugins()).toHaveLength(1)
    })

    it('should apply domain extensions', () => {
      const pluginSystem = new DomainPluginSystem()

      const domain = {
        name: 'test',
        resources: [],
        actions: [],
      }

      const extension = {
        resources: [
          {
            name: 'new-resource',
            displayName: 'New Resource',
            description: 'New resource',
            actions: ['create', 'list'],
            attributes: ['name'],
            relationships: [],
          },
        ],
      }

      pluginSystem.registerDomainExtension('test', extension)
      const extendedDomain = pluginSystem.applyDomainExtensions(domain)

      expect(extendedDomain.resources).toHaveLength(1)
      expect(extendedDomain.resources[0].name).toBe('new-resource')
    })
  })

  describe('Runtime Domain Registry', () => {
    it('should register domains at runtime', () => {
      const registry = new RuntimeDomainRegistry()

      const domain = {
        name: 'test',
        displayName: 'Test',
        description: 'Test domain',
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

      registry.registerDomain(domain)

      expect(registry.getDomain('test')).toBeDefined()
      expect(registry.getDomainResources('test')).toHaveLength(1)
      expect(registry.getDomainActions('test')).toHaveLength(1)
    })

    it('should register domain from configuration', () => {
      const registry = new RuntimeDomainRegistry()

      const config = {
        displayName: 'Test',
        description: 'Test domain',
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
      }

      registry.registerDomainFromConfig('test', config)

      expect(registry.getDomain('test')).toBeDefined()
      expect(registry.getDomainResources('test')).toHaveLength(1)
    })

    it('should register domain from CLI analysis', () => {
      const registry = new RuntimeDomainRegistry()

      const cliAnalysis = {
        domains: ['test'],
        resources: {
          test: ['resource'],
        },
        actions: ['create', 'list'],
      }

      registry.registerDomainFromCLI('test', cliAnalysis)

      expect(registry.getDomain('test')).toBeDefined()
      expect(registry.getDomainResources('test')).toHaveLength(1)
    })

    it('should register domain from package.json scripts', () => {
      const registry = new RuntimeDomainRegistry()

      const scripts = {
        'test:resource:create': 'echo "Creating resource"',
        'test:resource:list': 'echo "Listing resources"',
        'test:other:run': 'echo "Running other"',
      }

      registry.registerDomainFromScripts('test', scripts)

      expect(registry.getDomain('test')).toBeDefined()
      expect(registry.getDomainResources('test')).toHaveLength(2)
    })

    it('should validate commands', () => {
      const registry = new RuntimeDomainRegistry()

      const domain = {
        name: 'test',
        displayName: 'Test',
        description: 'Test domain',
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

      registry.registerDomain(domain)

      expect(registry.validateCommand('test', 'resource', 'create')).toBe(true)
      expect(registry.validateCommand('test', 'resource', 'invalid')).toBe(false)
      expect(registry.validateCommand('test', 'invalid', 'create')).toBe(false)
    })
  })

  describe('Domain Validator', () => {
    it('should validate domain structure', () => {
      const validator = new DomainValidator()

      const domain = {
        name: 'test',
        displayName: 'Test',
        description: 'Test domain',
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

      const validation = validator.validateDomainStructure(domain, {
        commands: ['test resource create', 'test resource list'],
        domains: [],
        resources: [],
        actions: [],
      })

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should handle validation failures with fallback', async () => {
      const validator = new DomainValidator()

      const domain = {
        name: 'test',
        displayName: 'Test',
        description: 'Test domain',
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

      const validation = {
        valid: false,
        errors: ['Command not found'],
        warnings: [],
        suggestions: [],
      }

      const fallback = await validator.handleValidationFailure(domain, testCLIPath, validation)

      expect(fallback.domain).toBeDefined()
      expect(fallback.fallback).toBe('generic')
    })
  })

  describe('Domain Config Manager', () => {
    it('should load and save configuration', async () => {
      const configManager = new DomainConfigManager()

      const config = await configManager.loadConfig(testConfigPath)

      expect(config.domains).toBeDefined()
      expect(config.domains.infra).toBeDefined()
      expect(config.domains.dev).toBeDefined()
      expect(config.discovery).toBeDefined()
      expect(config.validation).toBeDefined()
    })

    it('should update domain in configuration', async () => {
      const configManager = new DomainConfigManager()

      const domainConfig = {
        displayName: 'Updated Infrastructure',
        description: 'Updated infrastructure management',
        category: 'operations',
      }

      await configManager.updateDomain('infra', domainConfig, testConfigPath)

      const config = await configManager.loadConfig(testConfigPath)
      expect(config.domains.infra.displayName).toBe('Updated Infrastructure')
    })

    it('should add domain to configuration', async () => {
      const configManager = new DomainConfigManager()

      const domainConfig = {
        displayName: 'New Domain',
        description: 'New domain description',
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
      }

      await configManager.addDomain('new', domainConfig, testConfigPath)

      const config = await configManager.loadConfig(testConfigPath)
      expect(config.domains.new).toBeDefined()
      expect(config.domains.new.displayName).toBe('New Domain')
    })

    it('should remove domain from configuration', async () => {
      const configManager = new DomainConfigManager()

      await configManager.removeDomain('dev', testConfigPath)

      const config = await configManager.loadConfig(testConfigPath)
      expect(config.domains.dev).toBeUndefined()
    })

    it('should validate configuration', () => {
      const configManager = new DomainConfigManager()

      const config = {
        domains: {
          test: {
            name: 'test',
            resources: [
              {
                name: 'resource',
                actions: ['create', 'list'],
              },
            ],
          },
        },
      }

      const validation = configManager.validateConfig(config)

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  describe('Domain Templates', () => {
    it('should create domain from template', () => {
      const templates = new DomainTemplates()

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
      expect(domain.resources).toHaveLength(1)
      expect(domain.resources[0].name).toBe('resource')
    })

    it('should suggest template based on CLI structure', () => {
      const templates = new DomainTemplates()

      const cliStructure = {
        commands: ['infra server create', 'infra server list', 'dev project create'],
      }

      const suggestedTemplate = templates.suggestTemplate(cliStructure)

      expect(suggestedTemplate).toBe('hierarchical')
    })

    it('should list available templates', () => {
      const templates = new DomainTemplates()

      const templateList = templates.listTemplates()

      expect(templateList).toContain('noun-verb')
      expect(templateList).toContain('hierarchical')
      expect(templateList).toContain('flat')
      expect(templateList).toContain('microservice')
      expect(templateList).toContain('database')
      expect(templateList).toContain('api')
    })

    it('should get template metadata', () => {
      const templates = new DomainTemplates()

      const metadata = templates.getTemplateMetadata('noun-verb')

      expect(metadata.name).toBe('noun-verb')
      expect(metadata.resources).toBeGreaterThan(0)
      expect(metadata.actions).toBeGreaterThan(0)
    })
  })

  describe('Domain Discovery Orchestrator', () => {
    it('should discover domains from all sources', async () => {
      const discoveryResult = await orchestrator.discoverDomains({
        sources: ['cli-analysis', 'config', 'package-json'],
        cliPath: testCLIPath,
        packageJsonPath: testPackageJsonPath,
        configPath: testConfigPath,
      })

      expect(discoveryResult.domains).toHaveLength(3)
      expect(discoveryResult.domains.map((d) => d.name)).toContain('infra')
      expect(discoveryResult.domains.map((d) => d.name)).toContain('dev')
      expect(discoveryResult.domains.map((d) => d.name)).toContain('security')
      expect(discoveryResult.metadata.sources).toHaveLength(3)
    })

    it('should register domains in runtime registry', async () => {
      await orchestrator.discoverDomains({
        sources: ['config'],
        configPath: testConfigPath,
      })

      const domains = orchestrator.getAllDomains()
      expect(domains).toHaveLength(2)
      expect(domains.map((d) => d.name)).toContain('infra')
      expect(domains.map((d) => d.name)).toContain('dev')
    })

    it('should create domain from template', async () => {
      const data = {
        domain: 'template-test',
        displayName: 'Template Test',
        description: 'Test domain from template',
        category: 'test',
        resource: 'test-resource',
        resourceDisplayName: 'Test Resource',
        resourceDescription: 'Test resource from template',
      }

      const domain = await orchestrator.createDomainFromTemplate('noun-verb', data, {
        register: true,
        validate: false,
      })

      expect(domain.name).toBe('template-test')
      expect(domain.displayName).toBe('Template Test')
      expect(domain.resources).toHaveLength(1)
      expect(domain.resources[0].name).toBe('test-resource')
    })

    it('should suggest template for CLI', async () => {
      const suggestedTemplate = await orchestrator.suggestTemplateForCLI(testCLIPath)

      expect(suggestedTemplate).toBe('hierarchical')
    })

    it('should register domain at runtime', () => {
      const domain = {
        name: 'runtime-test',
        displayName: 'Runtime Test',
        description: 'Test domain registered at runtime',
        category: 'test',
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

      orchestrator.registerDomain(domain)

      const registeredDomain = orchestrator.getDomain('runtime-test')
      expect(registeredDomain).toBeDefined()
      expect(registeredDomain.name).toBe('runtime-test')
    })

    it('should get orchestrator statistics', () => {
      const stats = orchestrator.getStats()

      expect(stats.registry).toBeDefined()
      expect(stats.plugins).toBeDefined()
      expect(stats.templates).toBeGreaterThan(0)
      expect(stats.config).toBeDefined()
      expect(stats.validator).toBeDefined()
    })

    it('should clear caches', () => {
      orchestrator.clearCaches()

      const stats = orchestrator.getStats()
      expect(stats.config.size).toBe(0)
      expect(stats.validator.size).toBe(0)
    })

    it('should reset orchestrator state', () => {
      orchestrator.reset()

      const stats = orchestrator.getStats()
      expect(stats.registry.registrationHistory).toBe(0)
    })
  })

  describe('Integration with Enterprise Test Runner', () => {
    it('should work with enterprise test runner', async () => {
      const { EnterpriseTestRunner } = await import(
        '../../src/enterprise/runners/enterprise-test-runner.js'
      )

      const runner = new EnterpriseTestRunner({
        configPath: testConfigPath,
        cliPath: testCLIPath,
        packageJsonPath: testPackageJsonPath,
        autoDiscoverDomains: true,
        domainDiscoverySources: ['config'],
      })

      // Wait for domain discovery to complete
      let attempts = 0
      const maxAttempts = 50 // 5 seconds max
      while (attempts < maxAttempts) {
        const domains = runner.getDomainRegistry()
        if (domains.length > 0) {
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 100))
        attempts++
      }

      const domains = runner.getDomainRegistry()
      expect(domains).toHaveLength(2)
      expect(domains.map((d) => d.name)).toContain('infra')
      expect(domains.map((d) => d.name)).toContain('dev')

      const infraDomain = runner.getDomain('infra')
      expect(infraDomain).toBeDefined()
      expect(infraDomain.name).toBe('infra')

      const infraResources = runner.getDomainResources('infra')
      expect(infraResources).toHaveLength(5) // Includes plugin-added resources
      expect(infraResources.map((r) => r.name)).toContain('server')
      expect(infraResources.map((r) => r.name)).toContain('network')
      expect(infraResources.map((r) => r.name)).toContain('storage')
      expect(infraResources.map((r) => r.name)).toContain('database')
      expect(infraResources.map((r) => r.name)).toContain('monitoring')

      const infraActions = runner.getDomainActions('infra')
      expect(infraActions).toHaveLength(7) // Includes plugin-added actions
      expect(infraActions.map((a) => a.name)).toContain('create')
      expect(infraActions.map((a) => a.name)).toContain('list')
      expect(infraActions.map((a) => a.name)).toContain('show')
      expect(infraActions.map((a) => a.name)).toContain('update')
      expect(infraActions.map((a) => a.name)).toContain('delete')

      const isValidCommand = runner.validateCommand('infra', 'server', 'create')
      expect(isValidCommand).toBe(true)

      const commandMetadata = runner.getCommandMetadata('infra', 'server', 'create')
      expect(commandMetadata).toBeDefined()
    })

    it('should support domain registration at runtime', async () => {
      const { EnterpriseTestRunner } = await import(
        '../../src/enterprise/runners/enterprise-test-runner.js'
      )

      const runner = new EnterpriseTestRunner({
        autoDiscoverDomains: false,
      })

      const domain = {
        name: 'runtime-test',
        displayName: 'Runtime Test',
        description: 'Test domain registered at runtime',
        category: 'test',
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

      runner.registerDomain(domain)

      const registeredDomain = runner.getDomain('runtime-test')
      expect(registeredDomain).toBeDefined()
      expect(registeredDomain.name).toBe('runtime-test')
    })

    it('should support template-based domain creation', async () => {
      const { EnterpriseTestRunner } = await import(
        '../../src/enterprise/runners/enterprise-test-runner.js'
      )

      const runner = new EnterpriseTestRunner({
        autoDiscoverDomains: false,
      })

      const data = {
        domain: 'template-test',
        displayName: 'Template Test',
        description: 'Test domain from template',
        category: 'test',
        resource: 'test-resource',
        resourceDisplayName: 'Test Resource',
        resourceDescription: 'Test resource from template',
      }

      const domain = await runner.createDomainFromTemplate('noun-verb', data, {
        register: true,
        validate: false,
      })

      expect(domain.name).toBe('template-test')
      expect(domain.displayName).toBe('Template Test')
      expect(domain.resources).toHaveLength(1)
      expect(domain.resources[0].name).toBe('test-resource')

      const registeredDomain = runner.getDomain('template-test')
      expect(registeredDomain).toBeDefined()
    })

    it('should provide orchestrator statistics', async () => {
      const { EnterpriseTestRunner } = await import(
        '../../src/enterprise/runners/enterprise-test-runner.js'
      )

      const runner = new EnterpriseTestRunner({
        configPath: testConfigPath,
        autoDiscoverDomains: true,
        domainDiscoverySources: ['config'],
      })

      // Wait for domain discovery to complete
      await new Promise((resolve) => setTimeout(resolve, 100))

      const stats = runner.getOrchestratorStats()
      expect(stats.registry).toBeDefined()
      expect(stats.plugins).toBeDefined()
      expect(stats.templates).toBeGreaterThan(0)
    })
  })
})
